import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
let child, dir, base, one, two, reference;
async function start() {
  child = spawn(process.execPath, ["server.mjs", "--production"], {
    env: { ...process.env, PORT: "0", DATA_DIR: dir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Server readiness timeout")),
      10000,
    );
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error("Server exited: " + code));
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/localhost:(\d+)/);
      if (match) {
        base = "http://localhost:" + match[1];
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}
async function stop() {
  const exit = once(child, "exit");
  child.kill("SIGTERM");
  await exit;
}
async function request(path, { body, cookie, origin, status = 200 } = {}) {
  const res = await fetch(base + "/api" + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body
        ? { "Content-Type": "application/json", Origin: origin || base }
        : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(res.status, status, `${path} response`);
  const data = await res.json();
  return {
    data,
    cookie: res.headers.get("set-cookie")?.split(";")[0],
    header: res.headers.get("set-cookie"),
  };
}
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "dfbng-test-"));
  await start();
});
after(async () => {
  if (child?.exitCode === null) await stop();
  await rm(dir, { recursive: true, force: true });
});
test("catalog and unauthenticated access", async () => {
  const { data } = await request("/products");
  assert.equal(data.products.length, 3);
  assert(data.products.every((p) => p.id && typeof p.price === "number"));
  assert.equal((await request("/session")).data.user, null);
  await request("/requests", { status: 401 });
});
test("registration hashes passwords and issues secure cookies", async () => {
  one = await request("/register", {
    body: {
      name: "Test One",
      email: "one@example.test",
      password: "test-password-one",
    },
    status: 201,
  });
  assert.match(one.header, /HttpOnly/);
  assert.match(one.header, /SameSite=Lax/);
  assert.match(one.header, /Secure/);
  assert.equal(one.data.user.password, undefined);
  const db = new DatabaseSync(join(dir, "dfbng.sqlite"));
  const saved = db
    .prepare("SELECT password,salt FROM users WHERE email=?")
    .get("one@example.test");
  assert.notEqual(saved.password, "test-password-one");
  assert.equal(saved.password.length, 128);
  db.close();
  assert.equal(
    (await request("/session", { cookie: one.cookie })).data.user.name,
    "Test One",
  );
});
test("rejects duplicate registration, short passwords and bad credentials", async () => {
  await request("/register", {
    body: {
      name: "Another",
      email: "one@example.test",
      password: "test-password-one",
    },
    status: 409,
  });
  await request("/register", {
    body: { name: "Short", email: "short@example.test", password: "tiny" },
    status: 400,
  });
  await request("/login", {
    body: { email: "one@example.test", password: "wrong" },
    status: 401,
  });
  await request("/register", {
    body: { name: "Bad", email: "not-an-email", password: "test-password-one" },
    status: 400,
  });
});
test("request validation and CSRF reject before storing", async () => {
  const data = {
    type: "order",
    name: "Test One",
    email: "one@example.test",
    category: "Minecraft",
    subject: "Synthetic test",
    message: "A valid synthetic project brief for test.",
  };
  await request("/requests", {
    body: data,
    origin: "https://unrelated.example",
    status: 403,
  });
  await request("/requests", {
    body: { ...data, message: "short" },
    status: 400,
  });
  await request("/requests", {
    body: { ...data, type: "invalid" },
    status: 400,
  });
  const res = await request("/requests", {
    body: data,
    cookie: one.cookie,
    status: 201,
  });
  reference = res.data.reference;
  assert.match(reference, /^DFB-[A-F0-9]{12}$/);
  assert.equal(
    (await request("/requests", { cookie: one.cookie })).data.requests.length,
    1,
  );
});
test("requests are isolated by account, not supplied email", async () => {
  two = await request("/register", {
    body: {
      name: "Test Two",
      email: "two@example.test",
      password: "test-password-two",
    },
    status: 201,
  });
  assert.equal(
    (await request("/requests", { cookie: two.cookie })).data.requests.length,
    0,
  );
  await request("/requests", {
    body: {
      type: "contact",
      name: "Guest",
      email: "one@example.test",
      category: "Web",
      subject: "Guest request",
      message: "A guest request must not be linked by email.",
    },
    status: 201,
  });
  const owned = (await request("/requests", { cookie: one.cookie })).data
    .requests;
  assert.equal(owned.length, 1);
  assert.equal(owned[0].reference, reference);
});
test("sessions and requests persist across restart", async () => {
  await stop();
  await start();
  assert.equal(
    (await request("/session", { cookie: one.cookie })).data.user.email,
    "one@example.test",
  );
  assert.equal(
    (await request("/requests", { cookie: one.cookie })).data.requests[0]
      .reference,
    reference,
  );
});
test("logout invalidates the session and login restores access", async () => {
  await request("/logout", { body: {}, cookie: one.cookie });
  assert.equal(
    (await request("/session", { cookie: one.cookie })).data.user,
    null,
  );
  await request("/requests", { cookie: one.cookie, status: 401 });
  const login = await request("/login", {
    body: { email: "one@example.test", password: "test-password-one" },
  });
  assert.equal(
    (await request("/requests", { cookie: login.cookie })).data.requests.length,
    1,
  );
});
test("production deep links serve the application", async () => {
  const res = await fetch(base + "/services/discord-bot");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /dfbng software/);
  const secret = await fetch(base + "/.data/dfbng.sqlite");
  assert.notEqual(
    secret.headers.get("content-type"),
    "application/octet-stream",
  );
});
