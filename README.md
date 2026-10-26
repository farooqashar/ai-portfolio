# Made with AI

A gallery of the websites and automations I build with AI. Plain HTML, CSS and JavaScript, no build step.

## Host a frontend site here

Simple AI-generated sites (plain HTML, CSS and JavaScript) live in `p/<slug>/` and are served at `ai.asharfarooq.xyz/p/<slug>/`. One command creates the folder and the gallery entry:

```sh
# Start from a blank starter page
node scripts/new-site.mjs trip-recap "Trip recap" "One-line summary"

# Or bring in an HTML file or a folder with an index.html
node scripts/new-site.mjs trip-recap "Trip recap" "One-line summary" --from ~/Downloads/recap.html
```

Then fill in `notes` and `builtWith` for that entry in `projects.json`, commit and push.

Sites with a build step or npm dependencies get their own repo and Vercel project; add those as an outside link below. See `p/README.md` for the rules a hosted site needs to follow.

## Add a project hosted elsewhere

1. Deploy the project wherever it runs (Vercel, Cloudflare, a Claude artifact link).
2. Add an entry to `projects.json`:

```json
{
  "id": "short-slug",
  "title": "Project name",
  "kind": "Website",
  "year": 2026,
  "summary": "One or two sentences on what it does.",
  "builtWith": ["Claude", "Vercel"],
  "url": "https://live-link",
  "repo": "https://github.com/...",
  "color": "#3A2FE0",
  "glyph": "P",
  "featured": false,
  "notes": "How it was built: the problem, what AI did, what I did."
}
```

`kind` becomes a filter automatically (Website, Automation, Tool, anything new). `url`, `repo`, `schedule`, `featured` and `glyph` are optional.

3. Commit and push. Vercel redeploys.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000 (opening `index.html` directly won't load the JSON).

## Deploy

Import the repo in Vercel as a static site (no framework, no build command), then add a domain such as `ai.asharfarooq.xyz`.
