# Hosted sites

Each folder here is one frontend site, served at `/p/<folder>/`.

Rules for a site in this folder:

- It must have an `index.html` at the top of its folder.
- Use relative paths for its own files (`style.css`, `img/logo.png`), not paths starting with `/`, which point at the gallery's root.
- Plain HTML, CSS and JavaScript only. Anything with a build step or an npm install gets its own repo instead.

Add a new one with `node scripts/new-site.mjs` (see the main README).
