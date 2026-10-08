import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scryptSync, randomBytes } from "node:crypto";
import { validateSite } from "../cms.mjs";
import { siteDefaults, blockTemplate } from "../src/site-defaults.js";
import { copyDefaults } from "../src/copy-defaults.js";
let dir, child, base, admin, customer, revision, site, mediaUrl;
const password = randomBytes(20).toString("hex");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=",
  "base64",
);
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
  base = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(Error("Readiness timeout")), 10000);
    child.once("error", reject);
    child.once("exit", () => {
      clearTimeout(timer);
      reject(Error("Startup failed"));
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const m = output.match(/localhost:(\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve("http://localhost:" + m[1]);
      }
    });
  });
}
async function stop() {
  const done = once(child, "exit");
  child.kill();
  const [code] = await done;
  assert.equal(code, 0);
}
async function call(
  path,
  { body, cookie, expect = 200, origin = base, raw } = {},
) {
  const r = await fetch(base + "/api" + path, {
    method: body || raw ? "POST" : "GET",
    headers: {
      ...(body || raw ? { Origin: origin } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: raw || (body ? JSON.stringify(body) : undefined),
  });
  const d = await r.json();
  assert.equal(r.status, expect, path + ": " + JSON.stringify(d).slice(0, 100));
  return { d, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "dfbng-cms-"));
  const salt = randomBytes(16).toString("hex");
  await writeFile(
    join(dir, "admin-seed.json"),
    JSON.stringify({
      username: "CmsAdmin",
      salt,
      hash: scryptSync(password, salt, 64).toString("hex"),
    }),
  );
  await start();
  admin = (
    await call("/admin/login", { body: { username: "CmsAdmin", password } })
  ).cookie;
  customer = (
    await call("/register", {
      body: { name: "CMS Test", email: "cms@example.test", password },
      expect: 201,
    })
  ).cookie;
});
after(async () => {
  if (child?.exitCode === null) await stop();
  await rm(dir, { recursive: true, force: true });
});
test("public defaults and all CMS writes require administrator and same origin", async () => {
  ({ site, revision } = (await call("/site")).d);
  assert.equal(site.brand.name, "dfbng software");
  assert.equal(site.home.length, 10);
  for (const path of [
    "/admin/site",
    "/admin/site/restore",
    "/admin/site/validate",
  ]) {
    await call(path, { body: { site, revision }, expect: 401 });
    await call(path, {
      body: { site, revision },
      cookie: customer,
      expect: 403,
    });
    await call(path, {
      body: { site, revision },
      cookie: admin,
      origin: "https://invalid.example",
      expect: 403,
    });
  }
  await call("/admin/site", { expect: 401 });
  await call("/admin/site", { cookie: customer, expect: 403 });
  await call("/admin/media", { raw: png, expect: 401 });
  await call("/admin/media", { raw: png, cookie: customer, expect: 403 });
  await call("/admin/media", {
    raw: png,
    cookie: admin,
    origin: "https://invalid.example",
    expect: 403,
  });
});
test("site name, bilingual text, page blocks, menus and theme save atomically with conflict detection", async () => {
  site = structuredClone(site);
  site.brand.name = "Synthetic Software";
  site.copy[copyDefaults[0].key] = { tr: "Yeni metin", en: "New copy" };
  site.appearance.accent = "#123456";
  site.home.reverse();
  site.home[0].visible = false;
  site.navigation.push({
    title: { tr: "Yeni sayfa", en: "New page" },
    url: "/yeni",
    children: [],
    visible: true,
  });
  site.pages.push({
    path: "/yeni",
    title: { tr: "Yeni", en: "New" },
    description: { tr: "Açıklama", en: "Description" },
    visible: true,
    blocks: [
      {
        ...structuredClone(blockTemplate),
        title: { tr: "<script>text</script>", en: "Text" },
        body: { tr: "Güvenli düz metin", en: "Safe plain text" },
      },
    ],
  });
  const saved = (
    await call("/admin/site", { body: { site, revision }, cookie: admin })
  ).d;
  assert.equal(saved.revision, revision + 1);
  assert.deepEqual(saved.site, site);
  await call("/admin/site", {
    body: { site, revision },
    cookie: admin,
    expect: 409,
  });
  revision = saved.revision;
  assert.deepEqual((await call("/site")).d, saved);
  const validate = (
    await call("/admin/site/validate", { body: { site }, cookie: admin })
  ).d;
  assert.deepEqual(validate.site, site);
  assert.equal((await call("/site")).d.revision, revision);
});
test("malformed or unsafe content never changes stored revision", async () => {
  const mutations = [
    (s) => (s.brand.name = ""),
    (s) => (s.appearance.accent = "red;display:none"),
    (s) => (s.appearance.font = "url(evil)"),
    (s) => (s.appearance.fontSize = 1),
    (s) => (s.navigation[0].url = "javascript:alert(1)"),
    (s) => (s.brand.logo = "data:image/svg+xml,evil"),
    (s) => (s.navigation[0].url = "//evil.test"),
    (s) => (s.navigation[0].url = "/\\evil.test"),
    (s) => (s.pages[0].path = "/admin"),
    (s) => (s.pages[0].path = "/checkout/a"),
    (s) => (s.pages[0].blocks[0].type = "html"),
    (s) => s.pages.push(s.pages[0]),
    (s) => s.home.pop(),
    (s) => (s.copy.unknown = { tr: "x", en: "x" }),
    (s) => (s.extra = "x"),
    (s) => (s.options.turkish = s.options.english = false),
    (s) => s.links.push({ source: "/orders/example", url: "/yeni" }),
  ];
  for (const mutate of mutations) {
    const altered = structuredClone(site);
    mutate(altered);
    assert.throws(() => validateSite(altered));
    await call("/admin/site", {
      body: { site: altered, revision },
      cookie: admin,
      expect: 400,
    });
  }
  assert.equal((await call("/site")).d.revision, revision);
});
test("image uploads validate content, bound size, remain public and work as product covers", async () => {
  await call("/admin/media", {
    raw: Buffer.from('<svg onload="alert(1)"></svg>'),
    cookie: admin,
    expect: 400,
  });
  await call("/admin/media", {
    raw: Buffer.alloc(6 * 1024 * 1024 + 1),
    cookie: admin,
    expect: 413,
  });
  const upload = (
    await call("/admin/media", { raw: png, cookie: admin, expect: 201 })
  ).d;
  mediaUrl = upload.url;
  const image = await fetch(base + mediaUrl);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.equal(image.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  assert.equal(
    (await call("/admin/site", { cookie: admin })).d.media.length,
    1,
  );
  await call("/media/not-a-real-id", { expect: 404 });
  const products = (await call("/admin/dashboard", { cookie: admin })).d
    .products;
  const p = products[0];
  await call("/admin/products", {
    body: { ...p, image: mediaUrl },
    cookie: admin,
  });
  site.assets[0].url = mediaUrl;
  site.brand.logo = mediaUrl;
  const d = (
    await call("/admin/site", { body: { site, revision }, cookie: admin })
  ).d;
  revision = d.revision;
});
test("history restore creates a new revision and config/media persist after restart", async () => {
  const oldRevision = revision;
  const restored = (
    await call("/admin/site/restore", {
      body: { revision, restoreRevision: 1 },
      cookie: admin,
    })
  ).d;
  revision = restored.revision;
  assert.equal(revision, oldRevision + 1);
  assert.deepEqual(restored.site, siteDefaults);
  await call("/admin/site/restore", {
    body: { revision: oldRevision, restoreRevision: 1 },
    cookie: admin,
    expect: 409,
  });
  await call("/admin/site/restore", {
    body: { revision, restoreRevision: "no" },
    cookie: admin,
    expect: 400,
  });
  await stop();
  await start();
  const d = (await call("/site")).d;
  assert.deepEqual(d, restored);
  assert.equal((await fetch(base + mediaUrl)).status, 200);
  assert.equal(
    (await call("/admin/site", { cookie: admin })).d.history.length,
    3,
  );
});
