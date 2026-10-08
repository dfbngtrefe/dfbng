import { randomBytes, randomUUID, timingSafeEqual, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { existsSync, readFileSync, mkdirSync, createReadStream } from "node:fs";
import { writeFile, rename, unlink } from "node:fs/promises";
import { resolve } from "node:path";
const derive = promisify(scrypt);
export async function setupCommerce({ db, root, dataDir, seedProducts }) {
  const addColumn = (table, name, declaration) => {
    if (
      !db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .some((c) => c.name === name)
    )
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${declaration}`);
  };
  addColumn("users", "role", "TEXT NOT NULL DEFAULT 'customer'");
  addColumn("users", "username", "TEXT");
  addColumn("requests", "status", "TEXT NOT NULL DEFAULT 'new'");
  addColumn("requests", "reply", "TEXT NOT NULL DEFAULT ''");
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users(username COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS catalog (id TEXT PRIMARY KEY, data TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), product_id TEXT NOT NULL REFERENCES catalog(id), product TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>=0), status TEXT NOT NULL, payment TEXT NOT NULL, report TEXT, admin_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, client_key TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, UNIQUE(user_id,client_key));
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, admin_id TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL);`);
  const defaults = {
    iban: "TR95 0001 5001 5800 7314 5318 43",
    holder: "EFE KENAN ULUS",
    bank: "",
    discord: "",
    instagram: "",
    email: "",
  };
  for (const [key, value] of Object.entries(defaults))
    db.prepare("INSERT OR IGNORE INTO settings VALUES (?,?)").run(key, value);
  if (!db.prepare("SELECT 1 FROM settings WHERE key='catalog_seeded'").get()) {
    const insert = db.prepare("INSERT OR IGNORE INTO catalog VALUES (?,?,1)");
    for (const p of seedProducts)
      insert.run(p.id, JSON.stringify({ ...p, deliveryFile: "" }));
    db.prepare("INSERT INTO settings VALUES (?,?)").run(
      "catalog_seeded",
      "true",
    );
  }
  const seedPath =
    process.env.ADMIN_SEED_FILE || resolve(root, ".private/admin-seed.json");
  if (existsSync(seedPath)) {
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    if (
      !/^[A-Za-z0-9_-]{2,40}$/.test(seed.username) ||
      !/^[a-f0-9]{128}$/.test(seed.hash) ||
      !/^[a-f0-9]{32}$/.test(seed.salt)
    )
      throw new Error("Invalid admin seed");
    if (
      !db
        .prepare("SELECT 1 FROM users WHERE username=? COLLATE NOCASE")
        .get(seed.username)
    ) {
      db.prepare(
        "INSERT INTO users (id,name,email,password,salt,role,username) VALUES (?,?,?,?,?,?,?)",
      ).run(
        randomUUID(),
        seed.username,
        `admin-${randomUUID()}@local.invalid`,
        seed.hash,
        seed.salt,
        "admin",
        seed.username,
      );
    }
  }
  const fileDir = resolve(dataDir, "files");
  mkdirSync(fileDir, { recursive: true, mode: 0o700 });
  return { fileDir };
}
export function commerceRoutes({
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
}) {
  const settings = () =>
    Object.fromEntries(
      db
        .prepare("SELECT key,value FROM settings WHERE key!='catalog_seeded'")
        .all()
        .map((x) => [x.key, x.value]),
    );
  const audit = (user, action, target) =>
    db
      .prepare(
        "INSERT INTO audit (admin_id,action,target,created_at) VALUES (?,?,?,?)",
      )
      .run(user.id, action, target, new Date().toISOString());
  const admin = (req) => {
    const user = session(req);
    if (!user) fail("unauthorized", 401);
    if (user.role !== "admin") fail("forbidden", 403);
    return user;
  };
  const member = (req) => {
    const user = session(req);
    if (!user) fail("unauthorized", 401);
    return user;
  };
  const product = (row) => ({ ...JSON.parse(row.data), active: !!row.active });
  const publicProduct = (row) => {
    const { deliveryFile, ...p } = product(row);
    return { ...p, downloadAvailable: !!deliveryFile };
  };
  const order = (row) => {
    const { client_key, user_id, ...o } = row;
    const current = db
      .prepare("SELECT data FROM catalog WHERE id=?")
      .get(row.product_id);
    return {
      ...o,
      product: JSON.parse(row.product),
      payment: JSON.parse(row.payment),
      report: row.report ? JSON.parse(row.report) : null,
      downloadAvailable:
        !!(current && JSON.parse(current.data).deliveryFile) &&
        ["paid", "fulfilled"].includes(row.status),
    };
  };
  const ownOrder = (req, id) => {
    const user = member(req);
    const row = db
      .prepare("SELECT * FROM orders WHERE id=? AND user_id=?")
      .get(id, user.id);
    if (!row) fail("not_found", 404);
    return row;
  };
  const validIban = (value) => {
    const iban = value.replace(/\s/g, "").toUpperCase();
    if (!/^TR\d{24}$/.test(iban)) fail("invalid_iban");
    const number = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) =>
      String(c.charCodeAt(0) - 55),
    );
    if (BigInt(number) % 97n !== 1n) fail("invalid_iban");
    return iban.match(/.{1,4}/g).join(" ");
  };
  const currency = (value) => {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1000000 ||
      Math.abs(Math.round(value * 100) - value * 100) > 0.00001
    )
      fail("invalid_input");
    return value;
  };
  const safeUrl = (value, host = null) => {
    if (!value) return "";
    const url = new URL(str(value, 500));
    if (url.protocol !== "https:" || (host && !host.includes(url.hostname)))
      fail("invalid_input");
    return url.href;
  };
  function validateProduct(input) {
    const id = str(input.id, 70);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) fail("invalid_input");
    const pair = (value, max) => {
      if (!Array.isArray(value) || value.length !== 2) fail("invalid_input");
      return value.map((v) => str(v, max));
    };
    const category = str(input.category, 40);
    if (!["Minecraft", "FiveM", "Discord", "Web", "Design"].includes(category))
      fail("invalid_input");
    const image = str(input.image, 100);
    if (!/^[a-zA-Z0-9_-]+\.(png|jpg|svg)$/.test(image)) fail("invalid_input");
    if (
      !Array.isArray(input.tags) ||
      input.tags.length > 12 ||
      typeof input.active !== "boolean"
    )
      fail("invalid_input");
    const deliveryFile = input.deliveryFile ? str(input.deliveryFile, 40) : "";
    if (
      deliveryFile &&
      !db.prepare("SELECT 1 FROM files WHERE id=?").get(deliveryFile)
    )
      fail("invalid_input");
    const p = {
      id,
      title: pair(input.title, 150),
      description: pair(input.description, 4000),
      category,
      image,
      tags: input.tags.map((x) => str(x, 50)),
      price: currency(input.price),
      deliveryFile,
    };
    if (
      input.oldPrice !== undefined &&
      input.oldPrice !== null &&
      input.oldPrice !== ""
    )
      p.oldPrice = currency(input.oldPrice);
    return p;
  }
  return async function handle(req, res, path, input) {
    if (req.method === "GET") {
      if (path === "/products") {
        send(res, 200, {
          products: db
            .prepare("SELECT * FROM catalog WHERE active=1")
            .all()
            .map(publicProduct),
        });
        return true;
      }
      if (path === "/settings") {
        send(res, 200, { settings: settings() });
        return true;
      }
      if (path === "/orders") {
        const user = member(req);
        send(res, 200, {
          orders: db
            .prepare(
              "SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC",
            )
            .all(user.id)
            .map(order),
        });
        return true;
      }
      const match = path.match(/^\/orders\/([A-Z0-9-]+)(\/download)?$/);
      if (match) {
        const row = ownOrder(req, match[1]);
        if (!match[2]) send(res, 200, { order: order(row) });
        else {
          if (!["paid", "fulfilled"].includes(row.status))
            fail("payment_required", 403);
          const p = JSON.parse(
            db
              .prepare("SELECT data FROM catalog WHERE id=?")
              .get(row.product_id).data,
          );
          if (!p.deliveryFile) fail("file_unavailable", 404);
          const file = resolve(fileDir, p.deliveryFile + ".zip");
          if (!existsSync(file)) fail("file_unavailable", 404);
          res.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${row.product_id}.zip"`,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          });
          const stream = createReadStream(file);
          stream.on("error", () => res.destroy());
          stream.pipe(res);
        }
        return true;
      }
      if (path === "/admin/dashboard") {
        admin(req);
        send(res, 200, {
          settings: settings(),
          products: db.prepare("SELECT * FROM catalog").all().map(product),
          orders: db
            .prepare(
              "SELECT orders.*,users.name AS customer_name,users.email AS customer_email FROM orders JOIN users ON users.id=orders.user_id ORDER BY created_at DESC",
            )
            .all()
            .map(order),
          requests: db
            .prepare("SELECT * FROM requests ORDER BY created_at DESC")
            .all(),
          users: db
            .prepare("SELECT id,name,email,role,username FROM users")
            .all(),
          audit: db
            .prepare(
              "SELECT action,target,created_at FROM audit ORDER BY id DESC LIMIT 30",
            )
            .all(),
        });
        return true;
      }
    }
    if (req.method === "POST") {
      if (path === "/admin/login") {
        throttle(req, "auth", 20);
        const username = str(input.username, 40);
        const password = str(input.password, 128);
        const found = db
          .prepare(
            "SELECT * FROM users WHERE username=? COLLATE NOCASE AND role='admin'",
          )
          .get(username);
        const candidate = await derive(
          password,
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
          username: found.username,
        };
        send(res, 200, { user }, { "Set-Cookie": makeSession(user) });
        return true;
      }
      if (path === "/orders") {
        const user = member(req);
        throttle(req, "orders", 50);
        const key = str(input.clientKey, 80);
        if (!/^[a-zA-Z0-9-]{16,80}$/.test(key)) fail("invalid_input");
        const previous = db
          .prepare("SELECT * FROM orders WHERE user_id=? AND client_key=?")
          .get(user.id, key);
        if (previous) {
          send(res, 200, { order: order(previous) });
          return true;
        }
        const found = db
          .prepare("SELECT * FROM catalog WHERE id=? AND active=1")
          .get(str(input.productId, 70));
        if (!found) fail("not_found", 404);
        const p = publicProduct(found),
          pay = settings();
        if (p.price > 0 && !pay.holder) fail("payment_not_configured", 409);
        const now = new Date().toISOString(),
          id = "DFB-" + randomBytes(6).toString("hex").toUpperCase();
        const amount = Math.round(p.price * 100);
        db.prepare(
          "INSERT INTO orders (id,user_id,product_id,product,amount,status,payment,created_at,updated_at,client_key) VALUES (?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          user.id,
          p.id,
          JSON.stringify(p),
          amount,
          amount === 0 ? "paid" : "pending_payment",
          JSON.stringify({
            iban: pay.iban,
            holder: pay.holder,
            bank: pay.bank,
          }),
          now,
          now,
          key,
        );
        send(res, 201, {
          order: order(db.prepare("SELECT * FROM orders WHERE id=?").get(id)),
        });
        return true;
      }
      const report = path.match(/^\/orders\/([A-Z0-9-]+)\/report$/);
      if (report) {
        const row = ownOrder(req, report[1]);
        if (!["pending_payment", "payment_rejected"].includes(row.status))
          fail("invalid_transition", 409);
        const payer = str(input.payer, 150),
          bankReference = str(input.bankReference, 100),
          transferDate = str(input.transferDate, 10),
          note = input.note ? str(input.note, 1000) : "";
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(transferDate) ||
          Number.isNaN(Date.parse(transferDate)) ||
          transferDate > new Date().toISOString().slice(0, 10) ||
          transferDate < row.created_at.slice(0, 10)
        )
          fail("invalid_input");
        db.prepare(
          "UPDATE orders SET status='payment_review',report=?,version=version+1,updated_at=? WHERE id=?",
        ).run(
          JSON.stringify({ payer, bankReference, transferDate, note }),
          new Date().toISOString(),
          row.id,
        );
        send(res, 200, {
          order: order(
            db.prepare("SELECT * FROM orders WHERE id=?").get(row.id),
          ),
        });
        return true;
      }
      if (path.startsWith("/admin/")) {
        const user = admin(req);
        if (path === "/admin/settings") {
          const values = {
            iban: validIban(str(input.iban, 40)),
            holder: str(input.holder, 150),
            bank: input.bank ? str(input.bank, 100) : "",
            discord: safeUrl(input.discord, ["discord.gg", "discord.com"]),
            instagram: safeUrl(input.instagram, [
              "www.instagram.com",
              "instagram.com",
            ]),
            email: input.email ? email(input.email) : "",
          };
          db.exec("BEGIN IMMEDIATE");
          try {
            for (const [k, v] of Object.entries(values))
              db.prepare("UPDATE settings SET value=? WHERE key=?").run(v, k);
            audit(user, "settings.update", "site");
            db.exec("COMMIT");
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
          send(res, 200, { settings: settings() });
          return true;
        }
        if (path === "/admin/products") {
          const p = validateProduct(input);
          db.prepare(
            "INSERT INTO catalog VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,active=excluded.active",
          ).run(p.id, JSON.stringify(p), input.active ? 1 : 0);
          audit(user, "product.save", p.id);
          send(res, 200, { product: { ...p, active: input.active } });
          return true;
        }
        if (path === "/admin/order-status") {
          const id = str(input.id, 40),
            next = str(input.status, 30),
            note = input.note ? str(input.note, 1500) : "";
          const row = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
          if (!row) fail("not_found", 404);
          const transitions = {
            pending_payment: ["cancelled"],
            payment_review: ["paid", "payment_rejected"],
            payment_rejected: ["cancelled"],
            paid: ["fulfilled"],
            fulfilled: [],
            cancelled: [],
          };
          if (
            !transitions[row.status]?.includes(next) ||
            input.version !== row.version
          )
            fail("invalid_transition", 409);
          if (next === "payment_rejected" && !note) fail("invalid_input");
          if (next === "paid" && input.confirmed !== true)
            fail("invalid_input");
          db.exec("BEGIN IMMEDIATE");
          try {
            db.prepare(
              "UPDATE orders SET status=?,admin_note=?,updated_at=?,version=version+1 WHERE id=?",
            ).run(next, note, new Date().toISOString(), id);
            audit(user, "order." + next, id);
            db.exec("COMMIT");
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
          send(res, 200, {
            order: order(db.prepare("SELECT * FROM orders WHERE id=?").get(id)),
          });
          return true;
        }
        if (path === "/admin/request") {
          const reference = str(input.reference, 40),
            status = str(input.status, 20),
            reply = input.reply ? str(input.reply, 4000) : "";
          if (!["new", "in_progress", "completed", "closed"].includes(status))
            fail("invalid_input");
          const result = db
            .prepare("UPDATE requests SET status=?,reply=? WHERE reference=?")
            .run(status, reply, reference);
          if (!result.changes) fail("not_found", 404);
          audit(user, "request.update", reference);
          send(res, 200, { ok: true });
          return true;
        }
        if (path === "/admin/password") {
          const old = str(input.currentPassword, 128),
            next = str(input.password, 128, 10);
          const row = db.prepare("SELECT * FROM users WHERE id=?").get(user.id);
          const candidate = await derive(old, row.salt, 64);
          if (!timingSafeEqual(candidate, Buffer.from(row.password, "hex")))
            fail("invalid_credentials", 401);
          const salt = randomBytes(16).toString("hex"),
            hash = (await derive(next, salt, 64)).toString("hex");
          db.exec("BEGIN IMMEDIATE");
          try {
            db.prepare("UPDATE users SET password=?,salt=? WHERE id=?").run(
              hash,
              salt,
              user.id,
            );
            db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
            audit(user, "password.update", user.id);
            db.exec("COMMIT");
          } catch (e) {
            db.exec("ROLLBACK");
            throw e;
          }
          send(res, 200, { ok: true }, { "Set-Cookie": makeSession(user) });
          return true;
        }
      }
    }
    return false;
  };
}
export async function uploadProductFile({
  req,
  res,
  db,
  fileDir,
  session,
  verifyOrigin,
  fail,
  send,
  throttle,
}) {
  verifyOrigin(req);
  const user = session(req);
  if (!user) fail("unauthorized", 401);
  if (user.role !== "admin") fail("forbidden", 403);
  throttle(req, "upload", 20);
  if (req.headers["content-type"] !== "application/zip") fail("invalid_file");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 25 * 1024 * 1024) fail("file_too_large", 413);
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (
    size < 22 ||
    !["504b0304", "504b0506"].includes(buffer.subarray(0, 4).toString("hex"))
  )
    fail("invalid_file");
  const id = randomUUID(),
    temp = resolve(fileDir, id + ".tmp"),
    file = resolve(fileDir, id + ".zip");
  try {
    await writeFile(temp, buffer, { mode: 0o600 });
    await rename(temp, file);
    db.prepare("INSERT INTO files VALUES (?,?)").run(
      id,
      new Date().toISOString(),
    );
    send(res, 201, { fileId: id });
  } catch (e) {
    await unlink(temp).catch(() => {});
    await unlink(file).catch(() => {});
    throw e;
  }
}
