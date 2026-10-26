(async function () {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const group = document.getElementById("filter-group");
  const dialog = document.getElementById("detail");

  let projects = [];
  try {
    const res = await fetch("projects.json", { cache: "no-cache" });
    projects = await res.json();
  } catch (e) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = "Projects couldn't load. Refresh the page to try again.";
    return;
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

  // Filters, with counts
  const kinds = ["All", ...new Set(projects.map((p) => p.kind))];
  let active = "All";
  function renderFilters() {
    group.innerHTML = kinds.map((k) => {
      const n = k === "All" ? projects.length : projects.filter((p) => p.kind === k).length;
      const label = k === "All" ? "Everything" : k + "s";
      return `<button class="chip" type="button" data-kind="${esc(k)}" aria-pressed="${k === active}">${esc(label)}<span class="count">${n}</span></button>`;
    }).join("");
  }
  group.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    active = b.dataset.kind;
    renderFilters();
    renderGrid();
  });

  function renderGrid() {
    const list = projects.filter((p) => active === "All" || p.kind === active);
    empty.hidden = list.length > 0;
    grid.innerHTML = list.map((p) => {
      const where = p.url ? host(p.url) : p.schedule ? `Runs ${p.schedule.toLowerCase()}` : p.repo ? "Source on GitHub" : "";
      const cls = active !== "All" ? "" : p.wide ? "wide" : p.featured ? "featured" : "";
      return `<li class="${cls}">
        <button class="card" type="button" data-id="${esc(p.id)}" style="--c:${esc(p.color)}">
          <div class="cover" aria-hidden="true"><span class="kind">${esc(p.kind)}</span><span class="glyph">${esc(p.glyph || p.title[0])}</span></div>
          <div class="card-body">
            <h2>${esc(p.title)}</h2>
            <p>${esc(p.summary)}</p>
            ${where ? `<span class="where">${esc(where)}</span>` : ""}
          </div>
        </button>
      </li>`;
    }).join("");
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const p = projects.find((x) => x.id === card.dataset.id);
    if (p) openDetail(p);
  });

  function openDetail(p) {
    const cover = document.getElementById("detail-cover");
    cover.style.setProperty("--c", p.color);
    cover.innerHTML = `<span>${esc(p.glyph || p.title[0])}</span>`;
    document.getElementById("detail-meta").textContent = [p.kind, p.year, p.schedule && `Runs ${p.schedule.toLowerCase()}`].filter(Boolean).join(", ");
    document.getElementById("detail-title").textContent = p.title;
    document.getElementById("detail-summary").textContent = p.summary;
    document.getElementById("detail-notes").textContent = p.notes || "";
    document.getElementById("detail-tools").innerHTML = (p.builtWith || []).map((t) => `<li>${esc(t)}</li>`).join("");
    const actions = [];
    if (p.url) actions.push(`<a class="btn primary" href="${esc(p.url)}" target="_blank" rel="noopener">Visit site</a>`);
    if (p.repo) actions.push(`<a class="btn" href="${esc(p.repo)}" target="_blank" rel="noopener">View code</a>`);
    document.getElementById("detail-actions").innerHTML = actions.join("");
    dialog.showModal();
  }
  document.getElementById("detail-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  renderFilters();
  renderGrid();
})();
