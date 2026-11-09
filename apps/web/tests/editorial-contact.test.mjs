import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync(new URL("../src/components/PageShell.tsx", import.meta.url), "utf8");
const articleRoute = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("independent editorial email appears as an email link on every page", () => {
  assert.match(shell, /href="mailto:admin@dgi-pravo\.ru"/);
  assert.match(shell, /Не является официальным сайтом или подразделением ДГИ Москвы/);
});
test("contact page identifies this email as site editorial rather than government mail", () => {
  assert.match(articleRoute, /slug === "kontakty-dgi"/);
  assert.match(articleRoute, /href="mailto:admin@dgi-pravo\.ru"/);
  assert.match(articleRoute, /не электронная почта ДГИ Москвы/);
});
test("mobile contact and footer remain readable", () => {
  assert.match(styles, /\.editorial-email\s*\{/);
  assert.match(styles, /\.footer-email-note\s*\{/);
  assert.match(styles, /@media\(max-width:640px\)/);
});
