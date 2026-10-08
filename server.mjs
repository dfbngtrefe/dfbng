import http from "node:http";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { products } from "./src/content.js";
import {
  setupCommerce,
  commerceRoutes,
  uploadProductFile,
} from "./commerce.mjs";
import { setupCms, cmsRoutes } from "./cms.mjs";
const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const production = process.argv.includes("--production");
const dataDir = resolve(process.env.DATA_DIR || resolve(root, ".data"));
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(resolve(dataDir, "dfbng.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,salt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS requests (reference TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),type TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,category TEXT NOT NULL,budget TEXT,subject TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL);`);
const { fileDir } = await setupCommerce({
  db,
  root,
  dataDir,
  seedProducts: products,
});
const { mediaDir } = setupCms({ db, dataDir, root });
const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const derive = promisify(scrypt);
const limit = new Map();
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of limit) if (val.until < now) limit.delete(key);
  db.prepare("DELETE FROM sessions WHERE expires < ?").run(now);
}, 60000);
cleanup.unref();
function throttle(req, scope, max) {
  const key = scope + ":" + req.socket.remoteAddress;
  const now = Date.now();
  let item = limit.get(key);
  if (!item || item.until < now) {
    item = { until: now + 600000, count: 0 };
    limit.set(key, item);
  }
  if (++item.count > max)
    throw Object.assign(new Error("rate_limited"), { status: 429 });
}
function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end(JSON.stringify(data));
}
function fail(code, status = 400) {
  throw Object.assign(new Error(code), { status });
}
async function body(req, maximum = 16000) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (Buffer.byteLength(data) > maximum) fail("invalid_input", 413);
  }
  try {
    const value = JSON.parse(data);
    if (!value || Array.isArray(value) || typeof value !== "object")
      fail("invalid_input");
    return value;
  } catch {
    fail("invalid_input");
  }
}
const str = (value, max, min = 1) => {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.length > max
  )
    fail("invalid_input");
  return value.trim();
};
const email = (value) => {
  const val = str(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) fail("invalid_input");
  return val;
};
function sessionToken(req) {
  return (
    (req.headers.cookie || "")
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("dfbng_session="))
      ?.slice(14) || ""
  );
}
function session(req) {
  const token = sessionToken(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return (
    db
      .prepare(
        "SELECT users.id,users.name,users.email,users.role,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?",
      )
      .get(hashToken(token), Date.now()) || null
  );
}
function cookie(value, maxAge) {
  return `dfbng_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${production ? "; Secure" : ""}`;
}
function makeSession(user) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
    hashToken(token),
    user.id,
    Date.now() + 7 * 86400000,
  );
  return cookie(token, 7 * 86400);
}
function verifyOrigin(req) {
  const source = req.headers.origin;
  if (!source) fail("origin_rejected", 403);
  let url;
  try {
    url = new URL(source);
  } catch {
    fail("origin_rejected", 403);
  }
  const expected = process.env.APP_ORIGIN
    ? new URL(process.env.APP_ORIGIN).host
    : req.headers.host;
  if (url.host !== expected || !["http:", "https:"].includes(url.protocol))
    fail("origin_rejected", 403);
}
const commerce = commerceRoutes({
  db,
  fileDir,
  session,
  send,
  fail,
  str,
  email,
  throttle,
  makeSession,
  verifyOrigin,
});
const cms = cmsRoutes({ db, mediaDir, session, send, fail, verifyOrigin });
const vite = production
  ? null
  : await (
      await import("vite")
    ).createServer({
      root,
      server: {
        middlewareMode: true,
        fs: {
          deny: [
            ".env",
            ".env.*",
            "*.{crt,pem}",
            "**/.git/**",
            "**/.data/**",
            "**/.private/**",
            "**/*.sqlite",
            "**/*.sqlite-*",
          ],
        },
      },
      appType: "spa",
    });
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  let url;
  let decodedPath;
  try {
    url = new URL(req.url, "http://localhost");
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    send(res, 400, { error: "invalid_input" });
    return;
  }
  if (/\/(?:\.private|\.data|\.git)(?:\/|$)/.test(decodedPath)) {
    send(res, 403, { error: "forbidden" });
    return;
  }
  if (!url.pathname.startsWith("/api/")) {
    if (vite) return vite.middlewares(req, res);
    try {
      const dist = resolve(root, "dist");
      const file = resolve(dist, "." + decodeURIComponent(url.pathname));
      if (!file.startsWith(dist + "/") && file !== dist) {
        res.writeHead(403);
        res.end();
        return;
      }
      let target = file;
      if (!extname(file) || !existsSync(file) || file === dist)
        target = resolve(dist, "index.html");
      const data = readFileSync(target);
      res.writeHead(200, {
        "Content-Type": mime[extname(target)] || "application/octet-stream",
        "Cache-Control": target.includes("/assets/")
          ? "public, max-age=3600"
          : "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
    return;
  }
  try {
    const path = url.pathname.slice(4);
    if (req.method === "GET" && (await cms(req, res, path))) return;
    if (req.method === "GET" && (await commerce(req, res, path))) return;
    if (req.method === "GET") {
      if (path === "/health") return send(res, 200, { ok: true });
      if (path === "/products") return send(res, 200, { products });
      if (path === "/session") return send(res, 200, { user: session(req) });
      if (path === "/requests") {
        const user = session(req);
        if (!user) fail("unauthorized", 401);
        const requests = db
          .prepare(
            "SELECT reference,type,category,subject,created_at,status,reply FROM requests WHERE user_id=? ORDER BY created_at DESC",
          )
          .all(user.id);
        return send(res, 200, { requests });
      }
    }
    if (req.method === "POST") {
      if (path === "/admin/media") {
        await cms(req, res, path);
        return;
      }
      if (path === "/admin/files") {
        await uploadProductFile({
          req,
          res,
          db,
          fileDir,
          session,
          verifyOrigin,
          fail,
          send,
          throttle,
        });
        return;
      }
      verifyOrigin(req);
      const input = await body(
        req,
        path.startsWith("/admin/site") ? 1024 * 1024 : 16000,
      );
      if (await cms(req, res, path, input)) return;
      if (await commerce(req, res, path, input)) return;
      if (path === "/register" || path === "/login") {
        throttle(req, "auth", 20);
        const address = email(input.email);
        if (
          typeof input.password !== "string" ||
          input.password.length > 128 ||
          input.password.length < 1
        )
          fail("invalid_input");
        if (path === "/register") {
          if (input.password.length < 10) fail("invalid_input");
          const name = str(input.name, 100);
          const salt = randomBytes(16).toString("hex");
          const password = (await derive(input.password, salt, 64)).toString(
            "hex",
          );
          const user = { id: randomUUID(), name, email: address };
          try {
            db.prepare(
              "INSERT INTO users (id,name,email,password,salt) VALUES (?,?,?,?,?)",
            ).run(user.id, name, address, password, salt);
          } catch (error) {
            if (error.message.includes("UNIQUE constraint"))
              fail("email_exists", 409);
            throw error;
          }
          return send(res, 201, { user }, { "Set-Cookie": makeSession(user) });
        }
        const found = db
          .prepare("SELECT * FROM users WHERE email=?")
          .get(address);
        const candidate = await derive(
          input.password,
          found?.salt || "00000000000000000000000000000000",
          64,
        );
        if (
          !found ||
          !timingSafeEqual(candidate, Buffer.from(found.password, "hex"))
        )
          fail("invalid_credentials", 401);
        const user = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role,
        };
        return send(res, 200, { user }, { "Set-Cookie": makeSession(user) });
      }
      if (path === "/logout") {
        const token = sessionToken(req);
        db.prepare("DELETE FROM sessions WHERE token=?").run(hashToken(token));
        return send(res, 200, { ok: true }, { "Set-Cookie": cookie("", 0) });
      }
      if (path === "/requests") {
        throttle(req, "requests", 30);
        const type = str(input.type, 20);
        if (!["contact", "order", "career"].includes(type))
          fail("invalid_input");
        const name = str(input.name, 100),
          address = email(input.email),
          category = str(input.category, 100),
          subject = str(input.subject, 150),
          message = str(input.message, 5000, 20),
          budget = input.budget ? str(input.budget, 100) : "";
        const reference = "DFB-" + randomBytes(6).toString("hex").toUpperCase();
        db.prepare(
          "INSERT INTO requests (reference,user_id,type,name,email,category,budget,subject,message,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        ).run(
          reference,
          session(req)?.id || null,
          type,
          name,
          address,
          category,
          budget,
          subject,
          message,
          new Date().toISOString(),
        );
        return send(res, 201, { reference });
      }
    }
    send(res, 404, { error: "not_found" });
  } catch (error) {
    send(res, error.status || 500, {
      error: error.status ? error.message : "server_error",
    });
    if (!error.status) console.error("API request failed:", error.name);
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(
    `dfbng software is ready at http://localhost:${server.address().port}`,
  ),
);
async function shutdown() {
  server.close();
  await vite?.close();
  db.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
