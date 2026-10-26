# Made with AI

A gallery of the websites and automations I build with AI. Plain HTML, CSS and JavaScript, no build step.

## Add a project

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
