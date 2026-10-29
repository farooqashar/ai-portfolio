# Hosted sites

Each folder here is one small site, served at `/p/<folder>/`.

A site in this folder must:

- Have an `index.html` at the top of its folder.
- Use relative paths for its own files (`style.css`, `img/logo.png`). Paths starting with `/` point at the gallery's root instead.
- Be plain HTML, CSS and JavaScript. Anything with a build step, an `npm install` or a server gets its own repo and is linked from the gallery.

Libraries loaded from a CDN are fine.

Add a site with `node scripts/new-site.mjs`. See the [main README](../README.md).
