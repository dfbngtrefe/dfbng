import { siteDefaults, templates, blockTemplate } from "./src/site-defaults.js";
import { copyDefaults } from "./src/copy-defaults.js";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
const copyKeys = new Set(copyDefaults.map((c) => c.key));
const bad = () => {
  throw Object.assign(new Error("invalid_site_content"), { status: 400 });
};
const object = (v) => v && typeof v === "object" && !Array.isArray(v);
export function safeSiteUrl(v) {
  if (typeof v !== "string" || v.length > 2000 || /[\s\\\u0000-\u001f]/.test(v))
    return false;
  if (v === "") return true;
  if (v.startsWith("/") && !v.startsWith("//"))
    return !/%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(v);
  if (/^#[\w-]+$/.test(v)) return true;
  try {
    const u = new URL(v);
    return (
      ["https:", "http:", "mailto:", "tel:"].includes(u.protocol) &&
      !u.username &&
      !u.password
    );
  } catch {
    return false;
  }
}
function validate(v, model, key = "", depth = 0) {
  if (depth > 12) bad();
  if (Array.isArray(model)) {
    if (!Array.isArray(v) || v.length > 120) bad();
    const shape =
      model[0] ||
      templates[key] ||
      (key === "children" || key === "links"
        ? { title: { tr: "", en: "" }, url: "" }
        : null);
    if (!shape && v.length) bad();
    return v.map((x) => validate(x, shape, key, depth + 1));
  }
  if (object(model)) {
    if (!object(v) || Object.keys(v).some((k) => !Object.hasOwn(model, k)))
      bad();
    return Object.fromEntries(
      Object.entries(model).map(([k, m]) => [
        k,
        validate(v[k] ?? m, m, k, depth + 1),
      ]),
    );
  }
  if (typeof model === "boolean") {
    if (typeof v !== "boolean") bad();
    return v;
  }
  if (typeof model === "number") {
    if (!Number.isFinite(v) || v < 0 || v > 2000) bad();
    return v;
  }
  if (typeof v !== "string" || v.length > 16000) bad();
  if (
    ["url", "source", "image", "logo", "favicon"].includes(key) &&
    !safeSiteUrl(v)
  )
    bad();
  if (
    key === "path" &&
    (!/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/.test(v) ||
      /^\/(?:api|admin|account|login|register|checkout|orders|product|products|services|custom-order|contact|career)(?:\/|$)/.test(
        v,
      ))
  )
    bad();
  if (key === "id" && !/^[a-z0-9-]{1,80}$/.test(v)) bad();
  if (key === "type" && !["text", "image", "button", "banner"].includes(v))
    bad();
  if (
    key === "icon" &&
    ![
      "Blocks",
      "Gamepad2",
      "Bot",
      "Globe",
      "Palette",
      "MessagesSquare",
      "Box",
      "Code2",
      "Zap",
      "Terminal",
      "Layers",
      "ShieldCheck",
    ].includes(v)
  )
    bad();
  return v;
}
export function validateSite(input) {
  if (
    !object(input) ||
    Object.keys(input).some((k) => !Object.hasOwn(siteDefaults, k))
  )
    bad();
  const { copy = {}, ...rest } = input;
  const model = { ...siteDefaults };
  delete model.copy;
  const out = validate(rest, model);
  if (!object(copy) || Object.keys(copy).length > copyKeys.size) bad();
  out.copy = {};
  for (const [k, v] of Object.entries(copy)) {
    if (!copyKeys.has(k)) bad();
    out.copy[k] = validate(v, { tr: "", en: "" });
  }
  for (const k of [
    "background",
    "text",
    "muted",
    "border",
    "accent",
    "secondary",
    "surface",
  ])
    if (!/^#[a-f0-9]{6}$/i.test(out.appearance[k])) bad();
  if (
    !["Inter", "Arial", "Georgia", "monospace"].includes(out.appearance.font) ||
    !["Pixel", "Inter", "Arial", "Georgia", "monospace"].includes(
      out.appearance.headingFont,
    )
  )
    bad();
  if (
    out.appearance.fontSize < 10 ||
    out.appearance.fontSize > 24 ||
    out.appearance.contentWidth < 320 ||
    out.appearance.contentWidth > 1800 ||
    out.appearance.spacing > 200 ||
    out.appearance.radius > 60
  )
    bad();
  if (!out.brand.name.trim() || out.brand.name.length > 100) bad();
  if (
    !["tr", "en"].includes(out.options.defaultLanguage) ||
    (!out.options.turkish && !out.options.english) ||
    !out.options[out.options.defaultLanguage === "tr" ? "turkish" : "english"]
  )
    bad();
  const ids = siteDefaults.home.map((s) => s.id);
  if (
    out.home.length !== ids.length ||
    new Set(out.home.map((s) => s.id)).size !== ids.length ||
    out.home.some((s) => !ids.includes(s.id))
  )
    bad();
  for (const k of ["pages", "services", "docs"]) {
    const id = k === "pages" ? "path" : "id";
    if (new Set(out[k].map((x) => x[id])).size !== out[k].length) bad();
  }
  for (const x of out.links)
    if (
      /^\/(?:api|admin|account|login|register|checkout|orders)(?:\/|$)/.test(
        x.source,
      )
    )
      bad();
  return out;
}
export function setupCms({ db, dataDir, root }) {
  db.exec(`CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,content TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS site_history (revision INTEGER PRIMARY KEY,content TEXT NOT NULL,admin_id TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS site_media (id TEXT PRIMARY KEY,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL);`);
  const seed = resolve(root, ".private/site-seed.json");
  if (!db.prepare("SELECT id FROM site_content").get())
    db.prepare("INSERT INTO site_content VALUES (1,1,?)").run(
      JSON.stringify(
        existsSync(seed)
          ? validateSite(JSON.parse(readFileSync(seed, "utf8")))
          : siteDefaults,
      ),
    );
  const mediaDir = resolve(dataDir, "media");
  mkdirSync(mediaDir, { recursive: true, mode: 0o700 });
  return { mediaDir };
}
export function cmsRoutes({ db, mediaDir, session, send, fail, verifyOrigin }) {
  const read = () => {
    const row = db.prepare("SELECT * FROM site_content WHERE id=1").get();
    return { revision: row.revision, site: JSON.parse(row.content) };
  };
  const admin = (req) => {
    const u = session(req);
    if (!u) fail("unauthorized", 401);
    if (u.role !== "admin") fail("forbidden", 403);
    return u;
  };
  function save(site, revision, user) {
    const content = JSON.stringify(validateSite(site));
    db.exec("BEGIN IMMEDIATE");
    try {
      const old = db.prepare("SELECT * FROM site_content WHERE id=1").get();
      if (old.revision !== revision) fail("site_conflict", 409);
      db.prepare("INSERT INTO site_history VALUES (?,?,?,?)").run(
        old.revision,
        old.content,
        user.id,
        new Date().toISOString(),
      );
      db.prepare(
        "UPDATE site_content SET revision=revision+1,content=? WHERE id=1",
      ).run(content);
      db.prepare("DELETE FROM site_history WHERE revision < ?").run(
        old.revision - 19,
      );
      db.prepare(
        "INSERT INTO audit (admin_id,action,target,created_at) VALUES (?,?,?,?)",
      ).run(
        user.id,
        "site.update",
        String(old.revision + 1),
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    return read();
  }
  return async (req, res, path, input) => {
    if (req.method === "GET") {
      if (path === "/site") {
        send(res, 200, read());
        return true;
      }
      if (path === "/admin/site") {
        admin(req);
        send(res, 200, {
          ...read(),
          history: db
            .prepare(
              "SELECT revision,created_at FROM site_history ORDER BY revision DESC",
            )
            .all(),
          media: db
            .prepare("SELECT * FROM site_media ORDER BY created_at DESC")
            .all(),
        });
        return true;
      }
      if (path.startsWith("/media/")) {
        const id = path.slice(7);
        const row = db.prepare("SELECT * FROM site_media WHERE id=?").get(id);
        if (!row) fail("not_found", 404);
        const bytes = readFileSync(resolve(mediaDir, row.id));
        res.writeHead(200, {
          "Content-Type": row.mime,
          "Content-Length": bytes.length,
          "Cache-Control": "public, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        });
        res.end(bytes);
        return true;
      }
    }
    if (req.method === "POST" && path === "/admin/media") {
      admin(req);
      verifyOrigin(req);
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 6 * 1024 * 1024) fail("image_too_large", 413);
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks);
      let mime;
      if (
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
        bytes.subarray(12, 16).toString() === "IHDR"
      )
        mime = "image/png";
      else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
        mime = "image/jpeg";
      else if (
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP"
      )
        mime = "image/webp";
      if (!mime || size < 24) fail("invalid_image");
      const id = randomUUID();
      writeFileSync(resolve(mediaDir, id), bytes, { mode: 0o600 });
      db.prepare("INSERT INTO site_media VALUES (?,?,?,?,?)").run(
        id,
        "Görsel " + id.slice(0, 8),
        mime,
        size,
        new Date().toISOString(),
      );
      send(res, 201, { url: "/api/media/" + id, id });
      return true;
    }
    if (req.method === "POST" && path === "/admin/site/validate") {
      admin(req);
      send(res, 200, { site: validateSite(input.site) });
      return true;
    }
    if (
      req.method === "POST" &&
      (path === "/admin/site" || path === "/admin/site/restore")
    ) {
      const user = admin(req);
      if (!Number.isSafeInteger(input.revision)) fail("invalid_input");
      let site = input.site;
      if (path.endsWith("/restore")) {
        if (!Number.isSafeInteger(input.restoreRevision)) fail("invalid_input");
        const row = db
          .prepare("SELECT content FROM site_history WHERE revision=?")
          .get(Number(input.restoreRevision));
        if (!row) fail("not_found", 404);
        site = JSON.parse(row.content);
      }
      send(res, 200, save(site, input.revision, user));
      return true;
    }
    return false;
  };
}
