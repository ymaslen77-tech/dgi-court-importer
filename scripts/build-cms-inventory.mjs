#!/usr/bin/env node
// Usage: node scripts/build-cms-inventory.mjs PRIVATE_RAW_EXPORT SAFE_INVENTORY
// Only whitelist source metadata. Never commit a raw Webflow CMS export.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { sanitizeCmsExport } from "./lib/sanitize-webflow-cms.mjs";

const args = process.argv.slice(2);
if (args.length !== 2 || args.some((arg) => arg.startsWith("--")))
  throw new Error("Usage: node scripts/build-cms-inventory.mjs PRIVATE_RAW_EXPORT SAFE_INVENTORY");
const input = resolve(args[0]), output = resolve(args[1]);
if (input === output) throw new Error("Never overwrite the raw Webflow export");
if (!output.endsWith("cms-inventory.json")) throw new Error("Output must end with cms-inventory.json");
const source = JSON.parse(readFileSync(input, "utf8"));
const sanitized = sanitizeCmsExport(source);
mkdirSync(dirname(output), { recursive: true });
const temp = output + ".tmp";
writeFileSync(temp, JSON.stringify(sanitized, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
renameSync(temp, output);
console.log(JSON.stringify({
  collections: sanitized.collections.length,
  records: sanitized.collections.reduce((n, c) => n + c.items.length, 0),
  verifiedJudicialActs: 0, autoPublications: 0, output,
}, null, 2));
