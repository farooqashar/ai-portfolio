(() => {
  const spots = window.SPOTS.map((s, i) => ({ ...s, id: i }));
  const AREAS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Long Island"];
  // One colour per cuisine so the map reads at a glance.
  const COLORS = {
    "Street cart": "#d9902a", "Middle Eastern": "#0e5c46", "South Asian": "#c2410c",
    "Afghan": "#7c3aed", "Turkish": "#b91c1c", "Central Asian": "#0369a1",
    "Yemeni": "#a16207", "West African": "#15803d", "Southeast Asian": "#be185d",
    "Burgers & chicken": "#374151",
  };
  const colorFor = (c) => COLORS[c] || "#0e5c46";

  const state = { q: "", areas: new Set(), prices: new Set(), cuisine: "", selected: null, me: null };
  const $ = (s) => document.querySelector(s);
  const app = $(".app");

  // ── Map ──
  const map = L.map("map", { zoomControl: false }).setView([40.73, -73.75], 10);
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const priceHTML = (p) => `<span aria-label="Price ${p} of 3">${"$".repeat(p)}<span class="off">${"$".repeat(3 - p)}</span></span>`;
  const directions = (s) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name}, ${s.address}`)}`;

  const markers = new Map();
  spots.forEach((s) => {
    const icon = L.divIcon({
      className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
      html: `<div class="pin" style="background:${colorFor(s.cuisine)}"><span class="pin-label">${"$".repeat(s.price)}</span></div>`,
    });
    const m = L.marker([s.lat, s.lng], { icon, title: s.name, alt: s.name, riseOnHover: true });
    m.bindPopup(`
      <div class="pop">
        <h3>${esc(s.name)}</h3>
        <div class="meta"><span><span class="dot" style="background:${colorFor(s.cuisine)}"></span>${esc(s.style)}</span><span class="price">${priceHTML(s.price)}</span><span>${esc(s.hood)}</span></div>
        <p>${esc(s.blurb)}</p>
        <p><b style="color:var(--accent)">Order:</b> ${esc(s.order)}</p>
        <p style="color:var(--muted)">${esc(s.address)}</p>
        <a class="dir" href="${directions(s)}" target="_blank" rel="noopener">Directions ↗</a>
      </div>`);
    m.on("click", () => select(s.id, { fromMap: true }));
    markers.set(s.id, m);
  });
  const layer = L.featureGroup().addTo(map);
  let meMarker = null;

  // ── Controls ──
  const chip = (label, pressed, onClick) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = label;
    b.setAttribute("aria-pressed", pressed);
    b.addEventListener("click", onClick);
    return b;
  };
  const toggle = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));

  function renderChips() {
    const areaEl = $("#areaChips"); areaEl.innerHTML = "";
    areaEl.append(chip("All", state.areas.size === 0, () => { state.areas.clear(); update(true); }));
    AREAS.forEach((a) => areaEl.append(chip(a, state.areas.has(a), () => { toggle(state.areas, a); update(true); })));
    const priceEl = $("#priceChips"); priceEl.innerHTML = "";
    [1, 2, 3].forEach((p) => priceEl.append(chip("$".repeat(p), state.prices.has(p), () => { toggle(state.prices, p); update(true); })));
  }

  const cuisineSel = $("#cuisine");
  cuisineSel.innerHTML = `<option value="">All cuisines</option>` +
    [...new Set(spots.map((s) => s.cuisine))].sort().map((c) => `<option>${esc(c)}</option>`).join("");
  cuisineSel.addEventListener("change", () => { state.cuisine = cuisineSel.value; update(true); });
  $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); update(true); });

  $("#reset").addEventListener("click", () => {
    Object.assign(state, { q: "", cuisine: "", selected: null });
    state.areas.clear(); state.prices.clear();
    $("#q").value = ""; cuisineSel.value = "";
    update(true);
  });

  // Distance in miles (haversine) — used to sort once the user shares location.
  const miles = (a, b) => {
    const R = 3958.8, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const nearBtn = $("#nearMe");
  nearBtn.dataset.html = nearBtn.innerHTML;
  nearBtn.addEventListener("click", () => {
    if (state.me) { // second click turns it off
      state.me = null; nearBtn.classList.remove("active");
      if (meMarker) { map.removeLayer(meMarker); meMarker = null; }
      return update(true);
    }
    if (!navigator.geolocation) return alert("Your browser can't share location.");
    nearBtn.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        nearBtn.innerHTML = nearBtn.dataset.html; nearBtn.classList.add("active");
        meMarker = L.marker([state.me.lat, state.me.lng], {
          icon: L.divIcon({ className: "", html: '<div class="you"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
          interactive: false, keyboard: false,
        }).addTo(map);
        update(false);
        const nearest = filtered().slice(0, 4).map((s) => [s.lat, s.lng]);
        map.fitBounds(L.latLngBounds([[state.me.lat, state.me.lng], ...nearest]).pad(0.2));
      },
      () => { nearBtn.innerHTML = nearBtn.dataset.html; alert("Couldn't get your location — check your browser's permission."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // ── Filtering & rendering ──
  function filtered() {
    let out = spots.filter((s) => {
      if (state.areas.size && !state.areas.has(s.area)) return false;
      if (state.prices.size && !state.prices.has(s.price)) return false;
      if (state.cuisine && s.cuisine !== state.cuisine) return false;
      if (state.q) {
        const hay = [s.name, s.hood, s.area, s.cuisine, s.style, s.order, s.blurb, ...s.tags].join(" ").toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
    if (state.me) {
      out.forEach((s) => (s.dist = miles(state.me, s)));
      out.sort((a, b) => a.dist - b.dist);
    }
    return out;
  }

  const list = $("#list");
  function renderList(items) {
    $("#count").textContent = `${items.length} spot${items.length === 1 ? "" : "s"}${state.me ? " · nearest first" : ""}`;
    if (!items.length) {
      list.innerHTML = `<li class="empty"><b>No spots match</b>Try another area or cuisine, or reset the filters.</li>`;
      return;
    }
    list.innerHTML = items.map((s) => `
      <li class="card${s.id === state.selected ? " selected" : ""}" data-id="${s.id}" tabindex="0" role="button" aria-label="${esc(s.name)}, show on map">
        <div class="card-top"><h2>${esc(s.name)}</h2><span class="price">${priceHTML(s.price)}</span></div>
        <div class="meta">
          <span><span class="dot" style="background:${colorFor(s.cuisine)}"></span>${esc(s.style)}</span>
          <span>${esc(s.hood)}, ${esc(s.area)}</span>
          ${state.me ? `<span class="dist">${s.dist.toFixed(1)} mi</span>` : ""}
        </div>
        <p class="blurb">${esc(s.blurb)}</p>
        <p class="order"><b>Order:</b> ${esc(s.order)}</p>
        <div class="tags">${s.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </li>`).join("");
  }

  list.addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) select(+c.dataset.id); });
  list.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const c = e.target.closest(".card"); if (!c) return;
    e.preventDefault(); select(+c.dataset.id);
  });

  function select(id, { fromMap = false } = {}) {
    state.selected = id;
    const s = spots[id];
    document.querySelectorAll(".card").forEach((c) => c.classList.toggle("selected", +c.dataset.id === id));
    document.querySelectorAll(".pin.selected").forEach((p) => p.classList.remove("selected"));
    const m = markers.get(id);
    m.getElement()?.querySelector(".pin")?.classList.add("selected");
    if (fromMap) {
      document.querySelector(`.card[data-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    setView("map");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    map[reduce ? "setView" : "flyTo"]([s.lat, s.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    setTimeout(() => m.openPopup(), reduce ? 0 : 850);
  }

  function update(fit) {
    renderChips();
    const items = filtered();
    if (state.selected != null && !items.some((s) => s.id === state.selected)) state.selected = null;
    renderList(items);
    layer.clearLayers();
    items.forEach((s) => layer.addLayer(markers.get(s.id)));
    if (fit && items.length) map.fitBounds(layer.getBounds().pad(0.12), { maxZoom: 14 });
  }

  // ── Mobile list/map switch ──
  function setView(v) {
    if (!matchMedia("(max-width: 820px)").matches) return;
    app.dataset.view = v;
    document.querySelectorAll(".view-toggle button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === v));
    if (v === "map") setTimeout(() => map.invalidateSize(), 0);
  }
  document.querySelectorAll(".view-toggle button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

  update(true);
})();
