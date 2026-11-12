(async function () {
  const list = document.getElementById("releases");
  const loading = document.getElementById("loading");
  const notice = document.getElementById("notice");
  const group = document.getElementById("filter-group");

  const CACHE_KEY = "changelog:v1";
  const CACHE_MS = 10 * 60 * 1000;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const releasesUrl = (r) => `https://github.com/${r.repo}/releases`;
  const repoLinks = (repos) => `<ul>${repos.map((r) => `<li><a href="${esc(releasesUrl(r))}">${esc(r.label)}</a> on GitHub</li>`).join("")}</ul>`;

  let repos = [];
  try {
    const res = await fetch("../changelog.json", { cache: "no-cache" });
    repos = await res.json();
  } catch (e) {
    loading.textContent = "The changelog couldn't load. Refresh the page to try again.";
    return;
  }

  // Each repo is fetched on its own, so one failure doesn't hide the others
  async function fetchRepo(r) {
    const res = await fetch(`https://api.github.com/repos/${r.repo}/releases?per_page=20`, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`${r.repo}: HTTP ${res.status}`);
    const data = await res.json();
    return data
      .filter((x) => !x.draft && !x.prerelease && x.published_at)
      .map((x) => ({ repo: r.repo, name: x.name, tag: x.tag_name, date: x.published_at, body: x.body || "", url: x.html_url }));
  }

  function readCache() {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      const sameRepos = c && JSON.stringify(c.repos) === JSON.stringify(repos.map((r) => r.repo));
      return sameRepos && Date.now() - c.at < CACHE_MS ? c.releases : null;
    } catch { return null; }
  }
  function writeCache(releases) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos: repos.map((r) => r.repo), releases }));
    } catch {}
  }

  let releases = readCache();
  let failed = [];
  if (!releases) {
    const results = await Promise.allSettled(repos.map(fetchRepo));
    releases = [];
    results.forEach((res, i) => res.status === "fulfilled" ? releases.push(...res.value) : failed.push(repos[i]));
    releases.sort((a, b) => b.date.localeCompare(a.date));
    // Only a complete result is cached, so a failed repo is tried again on the next visit
    if (!failed.length) writeCache(releases);
  }
  loading.hidden = true;

  if (failed.length) {
    notice.hidden = false;
    notice.innerHTML = `<p>${failed.length === repos.length ? "Release notes couldn't load right now" : "Some release notes couldn't load right now"}. GitHub may be limiting requests, so try again in a few minutes, or read them on GitHub:</p>${repoLinks(failed)}`;
  }

  const labelOf = (repo) => (repos.find((r) => r.repo === repo) || {}).label || repo;
  const date = (iso) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const canRender = typeof marked !== "undefined" && typeof DOMPurify !== "undefined";
  const renderBody = (md) => canRender
    ? DOMPurify.sanitize(marked.parse(md))
    : `<p style="white-space:pre-wrap">${esc(md)}</p>`;

  // Filters, with counts, same as the gallery
  let active = "All";
  function renderFilters() {
    const options = [{ repo: "All", label: "Everything" }, ...repos];
    group.innerHTML = options.map((r) => {
      const n = r.repo === "All" ? releases.length : releases.filter((x) => x.repo === r.repo).length;
      return `<button class="chip" type="button" data-repo="${esc(r.repo)}" aria-pressed="${r.repo === active}">${esc(r.label)}<span class="count">${n}</span></button>`;
    }).join("");
  }
  group.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    active = b.dataset.repo;
    renderFilters();
    renderList();
  });

  function renderList() {
    const shown = releases.filter((x) => active === "All" || x.repo === active);
    list.innerHTML = shown.map((x) => `<li>
      <article class="release">
        <div class="release-head">
          <span class="release-repo">${esc(labelOf(x.repo))}</span>
          <time datetime="${esc(x.date)}">${esc(date(x.date))}</time>
        </div>
        <h2><a href="${esc(x.url)}">${esc(x.name || x.tag)}</a>${x.name && x.name !== x.tag ? `<span class="release-tag">${esc(x.tag)}</span>` : ""}</h2>
        ${x.body.trim() ? `<div class="release-body">${renderBody(x.body)}</div>` : ""}
        <a class="release-link" href="${esc(x.url)}">View on GitHub</a>
      </article>
    </li>`).join("");

    if (!shown.length) {
      const ok = repos.filter((r) => !failed.includes(r) && (active === "All" || r.repo === active));
      loading.hidden = !ok.length;
      if (ok.length) loading.innerHTML = `No releases yet. Follow along on GitHub:${repoLinks(ok)}`;
    } else {
      loading.hidden = true;
    }
  }

  renderFilters();
  renderList();
})();
