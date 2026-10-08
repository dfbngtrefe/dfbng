import { test, before, after } from "node:test";
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { scryptSync, randomBytes, randomUUID } from "node:crypto";
let dir,
  child,
  base,
  admin,
  customer,
  other,
  product,
  order,
  fileId,
  requestRef,
  secondSession;
const adminPassword = randomBytes(20).toString("hex");
const config = {
  iban: "TR95 0001 5001 5800 7314 5318 43",
  holder: "Synthetic Test Account",
  bank: "Test Bank",
  discord: "",
  instagram: "",
  email: "",
};
const transfer = {
  payer: "Test Customer",
  bankReference: "SYNTHETIC-TRANSFER-1",
  transferDate: new Date().toISOString().slice(0, 10),
  note: "Fixture only, no real transfer.",
};
async function start() {
  child = spawn(process.execPath, ["server.mjs", "--production"], {
    env: {
      ...process.env,
      PORT: "0",
      DATA_DIR: dir,
      ADMIN_SEED_FILE: join(dir, "admin-seed.json"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error("Readiness timeout")),
      10000,
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("Server stopped " + code));
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/localhost:(\d+)/);
      if (match) {
        base = "http://localhost:" + match[1];
        clearTimeout(timer);
        resolve();
      }
    });
  });
}
async function stop() {
  const end = once(child, "exit");
  child.kill("SIGTERM");
  await end;
}
async function call(path, { body, cookie, expect = 200, origin } = {}) {
  const r = await fetch(base + "/api" + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body
        ? { "Content-Type": "application/json", Origin: origin || base }
        : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  assert.equal(r.status, expect, path + ": " + (d.error || ""));
  return { data: d, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "dfbng-commerce-"));
  const salt = randomBytes(16).toString("hex");
  await writeFile(
    join(dir, "admin-seed.json"),
    JSON.stringify({
      username: "TestAdmin",
      salt,
      hash: scryptSync(adminPassword, salt, 64).toString("hex"),
    }),
  );
  await start();
});
after(async () => {
  if (child?.exitCode === null) await stop();
  await rm(dir, { recursive: true, force: true });
});
test("admin login and server-side role checks", async () => {
  await call("/admin/dashboard", { expect: 401 });
  await call("/admin/login", {
    body: { username: "TestAdmin", password: "incorrect" },
    expect: 401,
  });
  admin = (
    await call("/admin/login", {
      body: { username: "TestAdmin", password: adminPassword },
    })
  ).cookie;
  secondSession = (
    await call("/admin/login", {
      body: { username: "TestAdmin", password: adminPassword },
    })
  ).cookie;
  const registration = await call("/register", {
    body: {
      name: "TestAdmin",
      email: "customer@example.test",
      password: "customer-password",
      role: "admin",
      username: "TestAdmin",
    },
    expect: 201,
  });
  customer = registration.cookie;
  other = (
    await call("/register", {
      body: {
        name: "Other",
        email: "other@example.test",
        password: "other-password",
      },
      expect: 201,
    })
  ).cookie;
  assert.equal(
    (await call("/session", { cookie: customer })).data.user.role,
    "customer",
  );
  await call("/admin/dashboard", { cookie: customer, expect: 403 });
  for (const path of [
    "/admin/settings",
    "/admin/products",
    "/admin/order-status",
    "/admin/request",
    "/admin/password",
  ])
    await call(path, { cookie: customer, body: {}, expect: 403 });
  const dashboard = (await call("/admin/dashboard", { cookie: admin })).data;
  assert(dashboard.users.every((u) => !u.password && !u.salt));
});
test("payment setup validation, CSRF and private seed protection", async () => {
  assert.equal((await call("/settings")).data.settings.holder, "EFE KENAN ULUS");
  const fixtureDb = new DatabaseSync(join(dir, "dfbng.sqlite"));
  fixtureDb.prepare("UPDATE settings SET value = ? WHERE key = ?").run("", "holder");
  fixtureDb.close();
  await call("/admin/settings", {
    cookie: admin,
    body: config,
    origin: "https://unrelated.example",
    expect: 403,
  });
  await call("/admin/settings", {
    cookie: admin,
    body: { ...config, iban: "TR00 0001 5001 5800 7314 5318 43" },
    expect: 400,
  });
  await call("/orders", {
    cookie: customer,
    body: { productId: "dfbng-stone", clientKey: randomUUID() },
    expect: 409,
  });
  await call("/admin/settings", { cookie: admin, body: config });
  assert.equal((await call("/settings")).data.settings.holder, config.holder);
  const res = await fetch(base + "/.private/admin-seed.json");
  assert.equal(res.status, 403);
});
test("checkout uses server price, is idempotent and isolated", async () => {
  const key = randomUUID();
  const body = {
    productId: "dfbng-stone",
    clientKey: key,
    price: 0,
    status: "paid",
    amount: 1,
  };
  order = (await call("/orders", { cookie: customer, body, expect: 201 })).data
    .order;
  assert.equal(order.amount, 50000);
  assert.equal(order.status, "pending_payment");
  assert.equal(
    (await call("/orders", { cookie: customer, body })).data.order.id,
    order.id,
  );
  await call("/orders/" + order.id, { cookie: other, expect: 404 });
  await call("/orders/" + order.id + "/report", {
    cookie: other,
    body: transfer,
    expect: 404,
  });
  const noCookie = await fetch(base + "/api/orders/" + order.id + "/download");
  assert.equal(noCookie.status, 401);
  const unpaid = await fetch(base + "/api/orders/" + order.id + "/download", {
    headers: { Cookie: customer },
  });
  assert.equal(unpaid.status, 403);
});
test("catalog changes cannot alter existing order price or bank snapshot", async () => {
  product = (
    await call("/admin/dashboard", { cookie: admin })
  ).data.products.find((p) => p.id === "dfbng-stone");
  await call("/admin/products", {
    cookie: admin,
    body: { ...product, price: 900 },
  });
  await call("/admin/settings", {
    cookie: admin,
    body: { ...config, holder: "New Test Account" },
  });
  const original = (await call("/orders/" + order.id, { cookie: customer }))
    .data.order;
  assert.equal(original.amount, 50000);
  assert.equal(original.payment.holder, config.holder);
  assert.equal(
    (await call("/products")).data.products.find((p) => p.id === "dfbng-stone")
      .price,
    900,
  );
});
test("transfer report requires review; approval and rejection obey transitions", async () => {
  await call("/admin/order-status", {
    cookie: admin,
    body: {
      id: order.id,
      status: "paid",
      version: order.version,
      confirmed: true,
    },
    expect: 409,
  });
  order = (
    await call("/orders/" + order.id + "/report", {
      cookie: customer,
      body: transfer,
    })
  ).data.order;
  assert.equal(order.status, "payment_review");
  await call("/orders/" + order.id + "/report", {
    cookie: customer,
    body: transfer,
    expect: 409,
  });
  await call("/admin/order-status", {
    cookie: admin,
    body: { id: order.id, status: "paid", version: order.version },
    expect: 400,
  });
  await call("/admin/order-status", {
    cookie: admin,
    body: { id: order.id, status: "payment_rejected", version: order.version },
    expect: 400,
  });
  order = (
    await call("/admin/order-status", {
      cookie: admin,
      body: {
        id: order.id,
        status: "payment_rejected",
        version: order.version,
        note: "Please verify the reference.",
      },
    })
  ).data.order;
  order = (
    await call("/orders/" + order.id + "/report", {
      cookie: customer,
      body: { ...transfer, bankReference: "CORRECTED" },
    })
  ).data.order;
  const version = order.version;
  order = (
    await call("/admin/order-status", {
      cookie: admin,
      body: { id: order.id, status: "paid", version, confirmed: true },
    })
  ).data.order;
  assert.equal(order.status, "paid");
  await call("/admin/order-status", {
    cookie: admin,
    body: { id: order.id, status: "paid", version, confirmed: true },
    expect: 409,
  });
});
test("ZIP upload and download are admin/customer gated", async () => {
  const zip = Buffer.concat([Buffer.from("PK\x05\x06"), Buffer.alloc(18)]);
  async function upload(cookie, body = zip) {
    return fetch(base + "/api/admin/files", {
      method: "POST",
      headers: {
        Origin: base,
        Cookie: cookie,
        "Content-Type": "application/zip",
      },
      body,
    });
  }
  assert.equal((await upload(customer)).status, 403);
  assert.equal((await upload(admin, Buffer.from("not a zip"))).status, 400);
  const result = await upload(admin);
  assert.equal(result.status, 201);
  fileId = (await result.json()).fileId;
  await call("/admin/products", {
    cookie: admin,
    body: { ...product, deliveryFile: fileId },
  });
  const publicP = (await call("/products")).data.products.find(
    (p) => p.id === product.id,
  );
  assert.equal(publicP.deliveryFile, undefined);
  assert.equal(publicP.downloadAvailable, true);
  const forbidden = await fetch(
    base + "/api/orders/" + order.id + "/download",
    { headers: { Cookie: other } },
  );
  assert.equal(forbidden.status, 404);
  const download = await fetch(base + "/api/orders/" + order.id + "/download", {
    headers: { Cookie: customer },
  });
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("content-type"), "application/zip");
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), zip);
});
test("hide product prevents new purchases but keeps existing access", async () => {
  await call("/admin/products", {
    cookie: admin,
    body: { ...product, active: false, deliveryFile: fileId },
  });
  assert(
    !(await call("/products")).data.products.some((p) => p.id === product.id),
  );
  await call("/orders", {
    cookie: customer,
    body: { productId: product.id, clientKey: randomUUID() },
    expect: 404,
  });
  assert.equal(
    (await call("/orders/" + order.id, { cookie: customer })).data.order
      .downloadAvailable,
    true,
  );
});
test("free orders and private request replies work", async () => {
  const free = (
    await call("/orders", {
      cookie: customer,
      body: { productId: "survival-spawn", clientKey: randomUUID() },
      expect: 201,
    })
  ).data.order;
  assert.equal(free.amount, 0);
  assert.equal(free.status, "paid");
  requestRef = (
    await call("/requests", {
      cookie: customer,
      body: {
        type: "contact",
        name: "Test",
        email: "customer@example.test",
        category: "Web",
        subject: "Support",
        message: "A synthetic support request for admin reply testing.",
      },
      expect: 201,
    })
  ).data.reference;
  await call("/admin/request", {
    cookie: admin,
    body: {
      reference: requestRef,
      status: "completed",
      reply: "Synthetic answer.",
    },
  });
  assert.equal(
    (await call("/requests", { cookie: customer })).data.requests.find(
      (r) => r.reference === requestRef,
    ).reply,
    "Synthetic answer.",
  );
  assert.equal(
    (await call("/requests", { cookie: other })).data.requests.length,
    0,
  );
});
test("password change invalidates old sessions and survives restart", async () => {
  const newPassword = randomBytes(20).toString("hex");
  await call("/admin/password", {
    cookie: admin,
    body: { currentPassword: "incorrect", password: newPassword },
    expect: 401,
  });
  admin = (
    await call("/admin/password", {
      cookie: admin,
      body: { currentPassword: adminPassword, password: newPassword },
    })
  ).cookie;
  await call("/admin/dashboard", { cookie: secondSession, expect: 401 });
  await call("/admin/login", {
    body: { username: "TestAdmin", password: adminPassword },
    expect: 401,
  });
  await stop();
  await start();
  await call("/admin/dashboard", { cookie: admin });
  const persisted = (await call("/orders/" + order.id, { cookie: customer }))
    .data.order;
  assert.equal(persisted.status, "paid");
  assert.equal(persisted.downloadAvailable, true);
  await call("/admin/login", {
    body: { username: "TestAdmin", password: newPassword },
  });
});
