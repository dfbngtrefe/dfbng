import { existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "dist/assets"),
  target = resolve(root, "public/assets");
if (existsSync(source)) {
  mkdirSync(target, { recursive: true });
  for (const name of readdirSync(source)) {
    if (
      /\.(png|jpe?g|webp|svg|woff2?)$/i.test(name) &&
      !existsSync(resolve(target, name))
    )
      copyFileSync(resolve(source, name), resolve(target, name));
  }
}
