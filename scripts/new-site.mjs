#!/usr/bin/env node
// Add a frontend site to the portfolio: creates p/<slug>/ and a gallery entry.
//
//   node scripts/new-site.mjs <slug> "Title" "One-line summary" [--from <file-or-folder>]
//
// --from copies an existing HTML file (becomes index.html) or a whole folder
// (must contain index.html). Without it, a starter page is created.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const fromIdx = args.indexOf("--from");
const from = fromIdx >= 0 ? args.splice(fromIdx, 2)[1] : null;
const [slug, title, summary = ""] = args;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!slug || !title) fail('Usage: node scripts/new-site.mjs <slug> "Title" "Summary" [--from <file-or-folder>]');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail("Slug must be lowercase letters, numbers and hyphens, like trip-recap-2026.");

const dest = path.join(root, "p", slug);
if (fs.existsSync(dest)) fail(`p/${slug} already exists. Pick another slug or edit that folder directly.`);

const projectsFile = path.join(root, "projects.json");
const projects = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
if (projects.some((p) => p.id === slug)) fail(`projects.json already has an entry with id "${slug}".`);

fs.mkdirSync(dest, { recursive: true });

if (from) {
  const src = path.resolve(from);
  if (!fs.existsSync(src)) fail(`Nothing found at ${from}.`);
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(path.join(src, "index.html"))) fail(`${from} has no index.html.`);
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.copyFileSync(src, path.join(dest, "index.html"));
  }
  // Add the link back to the gallery, unless the page already has one
  const indexPath = path.join(dest, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  if (!html.includes('class="home-link"')) {
    const link =
      '\n<a class="home-link" href="/" style="position:fixed;right:16px;bottom:16px;z-index:9999;' +
      "padding:8px 14px;border-radius:999px;background:#15192B;color:#fff;" +
      'font:600 14px/1 system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.2)">' +
      "More things I made with AI</a>\n";
    const out = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, link + "</body>") : html + link;
    fs.writeFileSync(indexPath, out);
  }
} else {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tpl = fs.readFileSync(path.join(root, "templates", "site", "index.html"), "utf8");
  fs.writeFileSync(path.join(dest, "index.html"), tpl.replaceAll("{{TITLE}}", esc(title)).replaceAll("{{SUMMARY}}", esc(summary)));
}

// Pick a cover color not already used in the gallery
const palette = ["#E4572E", "#1B998B", "#3A2FE0", "#F2B134", "#C1292E", "#5B8E7D", "#7B5EA7", "#00798C", "#D1495B", "#3D5A80", "#EDAE49", "#2A9D8F", "#E76F51", "#4A1942", "#6D6875"];
const used = new Set(projects.map((p) => p.color));
const color = palette.find((c) => !used.has(c)) || palette[projects.length % palette.length];

const entry = {
  id: slug,
  title,
  kind: "Website",
  year: new Date().getFullYear(),
  summary,
  builtWith: ["Claude"],
  url: `/p/${slug}/`,
  color,
  glyph: title.trim()[0].toUpperCase(),
  notes: "",
};

// New sites go just before "This portfolio", which closes out the grid
const lastIdx = projects.findIndex((p) => p.id === "this-site");
projects.splice(lastIdx >= 0 ? lastIdx : projects.length, 0, entry);
fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2) + "\n");

console.log(`Created p/${slug}/ and added "${title}" to projects.json.`);
console.log(`Fill in "notes" and "builtWith" in projects.json, then commit and push.`);
console.log(`It will be live at /p/${slug}/`);
