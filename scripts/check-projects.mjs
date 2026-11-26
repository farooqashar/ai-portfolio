#!/usr/bin/env node
// Check projects.json before it ships: a parse error or a bad entry breaks the gallery.
//
//   node scripts/check-projects.mjs
//
// Prints one line per problem and exits 1 if there are any.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

let projects;
try {
  projects = JSON.parse(fs.readFileSync(path.join(root, "projects.json"), "utf8"));
} catch (e) {
  console.error(`projects.json: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(projects)) {
  console.error("projects.json: must be an array of entries.");
  process.exit(1);
}

const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const hostedRe = /^\/p\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/;
const required = ["id", "title", "summary", "kind", "year", "builtWith", "notes", "color", "glyph"];
const seen = new Map();
const hosted = new Set();
const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim());

projects.forEach((p, i) => {
  const where = `entry ${i + 1}${p && typeof p.id === "string" && p.id ? ` ("${p.id}")` : ""}`;
  const problem = (msg) => problems.push(`projects.json ${where}: ${msg}`);
  if (!p || typeof p !== "object" || Array.isArray(p)) return problem("must be an object.");

  for (const field of required) if (isEmpty(p[field])) problem(`missing "${field}".`);
  for (const field of ["id", "title", "summary", "kind", "notes", "color", "glyph"]) {
    if (!isEmpty(p[field]) && typeof p[field] !== "string") problem(`"${field}" must be a string.`);
  }

  if (typeof p.id === "string" && p.id) {
    if (!slugRe.test(p.id)) problem(`"id" must be lowercase letters, numbers and hyphens, like trip-recap-2026.`);
    if (seen.has(p.id)) problem(`duplicate "id", already used by entry ${seen.get(p.id) + 1}.`);
    else seen.set(p.id, i);
  }
  if (!isEmpty(p.year) && !Number.isInteger(p.year)) problem(`"year" must be a whole number, like 2026.`);
  if (!isEmpty(p.builtWith)) {
    if (!Array.isArray(p.builtWith) || !p.builtWith.length || p.builtWith.some((t) => typeof t !== "string" || !t.trim())) {
      problem(`"builtWith" must be a non-empty list of strings.`);
    }
  }
  if (typeof p.color === "string" && p.color && !/^#[0-9A-Fa-f]{6}$/.test(p.color)) {
    problem(`"color" must be a hex color like #3A2FE0, not "${p.color}".`);
  }

  for (const field of ["url", "repo"]) {
    if (p[field] === undefined) continue;
    const v = p[field];
    const m = typeof v === "string" && v.match(hostedRe);
    if (m) {
      if (field === "url") {
        hosted.add(m[1]);
        if (!fs.existsSync(path.join(root, "p", m[1], "index.html"))) problem(`"url" is ${v} but p/${m[1]}/index.html doesn't exist.`);
      }
    } else if (typeof v !== "string" || !v.startsWith("https://")) {
      problem(`"${field}" must be /p/<slug>/ or start with https://, not ${JSON.stringify(v)}.`);
    }
  }
});

const wide = projects.map((p, i) => (p && p.wide === true ? i : -1)).filter((i) => i >= 0);
if (wide.length > 1) problems.push(`projects.json: only one entry can have "wide": true, found ${wide.length} (entries ${wide.map((i) => i + 1).join(", ")}).`);
else if (wide.length === 1 && wide[0] !== projects.length - 1) {
  problems.push(`projects.json entry ${wide[0] + 1}: the "wide" entry must be the last one, since it closes out the grid.`);
}

for (const d of fs.readdirSync(path.join(root, "p"), { withFileTypes: true })) {
  if (d.isDirectory() && !hosted.has(d.name)) problems.push(`p/${d.name}/: no entry in projects.json has "url": "/p/${d.name}/".`);
}

if (problems.length) {
  for (const msg of problems) console.error(msg);
  process.exit(1);
}
console.log(`projects.json: ${projects.length} entries OK.`);
