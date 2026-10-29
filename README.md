# Made with AI

A gallery of the things I build with AI: websites, tools, agents, knowledge bases and the automations I run every day.

**Live:** [ai.asharfarooq.xyz](https://ai.asharfarooq.xyz)

The site is plain HTML, CSS and JavaScript with no build step. Every card on the page comes from one entry in `projects.json`, so adding a project means adding one entry.

## What's in the repo

```
index.html, styles.css, app.js   the gallery page
projects.json                    every project shown on the page
p/<slug>/                        small sites hosted here, served at /p/<slug>/
scripts/new-site.mjs             adds a hosted site and its gallery entry
templates/site/                  starter page for a new hosted site
vercel.json, .vercelignore       deploy settings
```

## Add a project

There are two ways, depending on where the project lives.

### A small site hosted here

Use this for single-page sites in plain HTML, CSS and JavaScript. One command creates `p/<slug>/` and the gallery entry:

```sh
# Start from a blank page
node scripts/new-site.mjs trip-recap "Trip recap" "One-line summary"

# Or bring in an existing HTML file, or a folder with an index.html
node scripts/new-site.mjs trip-recap "Trip recap" "One-line summary" --from ~/Downloads/recap.html
```

The script also adds a "More things I made with AI" link back to the gallery. Afterwards, fill in `notes` and `builtWith` for the new entry in `projects.json`, then commit and push.

A hosted site must have an `index.html` at the top of its folder and use relative paths for its own files. See [`p/README.md`](p/README.md).

### Anything else

Sites with a build step, apps with a server, repos and automations stay where they are. Add an entry to `projects.json` by hand:

```json
{
  "id": "short-slug",
  "title": "Project name",
  "kind": "Website",
  "year": 2026,
  "summary": "One or two sentences on what it does.",
  "builtWith": ["Claude", "Vercel"],
  "url": "https://live-link",
  "repo": "https://github.com/farooqashar/...",
  "color": "#3A2FE0",
  "glyph": "P",
  "notes": "How it was built: the problem, what AI did, what I did."
}
```

Then commit and push. Vercel redeploys on every push to `main`.

## Entry fields

| Field | Required | What it does |
|---|---|---|
| `id` | yes | Unique slug. For hosted sites it matches the folder name. |
| `title`, `summary` | yes | Card title and one- or two-sentence description. |
| `kind` | yes | Becomes a filter: Website, Tool, Agent, Knowledge base, Automation. A new value adds a new filter. |
| `year` | yes | Shown in the detail view. |
| `builtWith` | yes | Tools and tech, shown as tags in the detail view. |
| `notes` | yes | The "How it's built" paragraph in the detail view. |
| `color`, `glyph` | yes | Card cover color and the large character on it. |
| `url` | no | Live link. Use `/p/<slug>/` for hosted sites. |
| `repo` | no | Source link, shown as "View code". |
| `schedule` | no | For automations, e.g. "Every day" or "Weekly". |
| `featured` | no | Makes the card twice as wide. |
| `wide` | no | Makes the card span the full row. Used for the last card. |

On a wide screen the grid has four columns, and a featured card takes two. If cards and featured cards don't add up to a multiple of four, the last row comes out short, so balance them by featuring or unfeaturing a card.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` directly won't work, because the page loads `projects.json` with `fetch`.

## Deploy

The repo is a Vercel project with no framework and no build command, deploying from `main` to `ai.asharfarooq.xyz`. The domain's DNS is managed outside Vercel, with a CNAME record for `ai` pointing at Vercel.
