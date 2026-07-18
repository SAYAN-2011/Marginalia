/* ==========================================================================
   Marginalia — shared script for index.html (site) and admin.html (admin)
   No backend: posts.json seeds localStorage on first run; admin edits are
   saved to localStorage and can be exported back to posts.json.
   ========================================================================== */

const STORAGE_KEY = "marginalia_posts_v1";
const AUTH_KEY = "marginalia_admin_auth";
const ADMIN_PASSWORD = "Marmeli2026"; // demo-only client-side gate, not real security

/* Inline copy of posts.json. Browsers block fetch() of local files opened
   directly via file:// (no server), so this fallback keeps the site fully
   working even without one. If posts.json can be fetched (e.g. served over
   http/https, or via a local dev server), that copy is used instead so the
   file stays the single source of truth for anyone who edits it by hand. */
const SEED_DATA_FALLBACK = {
  posts: [
    {
      "id": "p1", "slug": "on-keeping-notes", "title": "On Keeping Notes",
      "excerpt": "Most of what I write starts as a note I didn't trust myself to remember. Here's why the margin is the most honest place to think.",
      "content": "Most of what I write starts as a note I didn't trust myself to remember.\n\nThere is a difference between writing to be read and writing to remember. The first wants an audience. The second just wants a witness — even if the witness is the version of you that shows up next Tuesday, tired, having forgotten the exact shape of the thought.\n\nI keep a folder of these. Half-sentences. Arguments with myself. A line about the weather that turned out to be about something else. **Marginalia**, in the old sense — not the finished book, but the commentary running alongside it.\n\nThe habit is simple: write it down before you decide if it's good. Sort later, if ever.",
      "tag": "Writing", "date": "2026-06-02", "status": "published", "image": "https://picsum.photos/seed/marginalia-notes/1000/700"
    },
    {
      "id": "p2", "slug": "the-tools-that-stuck", "title": "The Tools That Stuck",
      "excerpt": "A running list of the software and objects that survived every cleanup — and a theory for why they did.",
      "content": "Every year I clear out my tools — apps, notebooks, the odd gadget — and every year the same short list survives.\n\nA plain text editor. A mechanical pencil that needs no batteries and holds no opinions. A single notebook, not a system of them.\n\nWhat they share isn't minimalism for its own sake. It's that none of them asked me to learn *their* logic. They adapted to mine, or stayed out of the way entirely. That's the real test for a tool: does it recede, or does it keep asking to be noticed?\n\nThe ones that stuck all recede.",
      "tag": "Tools", "date": "2026-06-10", "status": "published", "image": "https://picsum.photos/seed/marginalia-tools/1000/700"
    },
    {
      "id": "p3", "slug": "small-rooms", "title": "Small Rooms",
      "excerpt": "A short essay on working in small spaces, physical and otherwise, and why constraint is a feature and not a bug.",
      "content": "I've written in a lot of small rooms — a corner desk, a train seat, the fifteen minutes before a call.\n\nThere's a temptation to blame the room for the work. Bigger desk, better light, more time — someday. But the small room has a virtue the big one doesn't: it forces a decision about what actually matters in the next hour.\n\nConstraint isn't the enemy of good work. It's often the reason the work gets *finished* at all. Give a project infinite room and it will happily take it, and give you nothing back.",
      "tag": "Life", "date": "2026-06-18", "status": "published", "image": ""
    },
    {
      "id": "p4", "slug": "building-in-public-quietly", "title": "Building in Public, Quietly",
      "excerpt": "You don't need an audience to build something well. You need a record — for yourself, first.",
      "content": "\"Build in public\" usually means a feed, an audience, a running commentary for other people.\n\nThere's a quieter version: build in public for an audience of one — future you. Write down why you made a choice, not just what the choice was. Screenshot the ugly version before you fix it. Keep the abandoned drafts.\n\nMonths later, when you've forgotten the reasoning, that record is worth more than any amount of polish. It's the difference between remembering *what* you built and remembering *how* you thought.",
      "tag": "Making", "date": "2026-06-25", "status": "published", "image": "https://picsum.photos/seed/marginalia-making/1000/700"
    },
    {
      "id": "p5", "slug": "the-unread-tab", "title": "The Unread Tab",
      "excerpt": "Every browser has one tab open for weeks. A short meditation on the things we mean to get back to.",
      "content": "There's always one tab. Weeks old, maybe months. You know exactly what it is without looking — it's become furniture.\n\nI used to think the unread tab was a failure of discipline. Now I think it's a kind of honesty: proof that intention and attention are different currencies, and that you can hold the first without spending the second.\n\nClose it or don't. Either way, it was never really about the article.",
      "tag": "Life", "date": "2026-07-01", "status": "published", "image": ""
    },
    {
      "id": "p6", "slug": "draft-zero", "title": "Draft Zero",
      "excerpt": "An unfinished note on starting before you're ready. Still working through this one.",
      "content": "This one isn't finished. Posting it anyway, because the idea of a 'draft zero' — the version before the first real draft, too rough to show anyone — deserves to exist somewhere other than a private file.\n\nMore soon.",
      "tag": "Writing", "date": "2026-07-05", "status": "draft", "image": ""
    }
  ],
  sponsors: [
    {
      "id": "s1", "name": "Fieldnote Supply Co.",
      "tagline": "Pocket notebooks made for margins, not just pages.",
      "imageUrl": "https://picsum.photos/seed/marginalia-sponsor-1/400/400",
      "linkUrl": "https://example.com", "status": "active"
    },
    {
      "id": "s2", "name": "Quiet Hours",
      "tagline": "A timer app for people who write better with a deadline they set themselves.",
      "imageUrl": "https://picsum.photos/seed/marginalia-sponsor-2/400/400",
      "linkUrl": "https://example.com", "status": "paused"
    }
  ]
};

/* ---------------------------- data layer --------------------------------- */

function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(text){
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "entry";
}

// Splits a comma-separated tag string (or array) into individual, trimmed,
// deduplicated tags. Dedupe is case-insensitive but keeps the first casing seen.
function parseTags(raw){
  const source = Array.isArray(raw) ? raw.join(",") : String(raw || "");
  const seen = [];
  source.split(",").forEach(part => {
    const t = part.trim();
    if (!t) return;
    if (!seen.some(s => s.toLowerCase() === t.toLowerCase())) seen.push(t);
  });
  return seen;
}

// Normalizes raw tag input back into a clean, deduped, comma-joined string for storage.
function normalizeTagInput(raw){
  return parseTags(raw).join(", ");
}

function tagChipsHtml(post, extraClass){
  return parseTags(post.tag)
    .map(t => `<span class="post-tag${extraClass ? " " + extraClass : ""}">${escapeHtml(t)}</span>`)
    .join("");
}

function readTime(content){
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(iso){
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const SPONSOR_STORAGE_KEY = "marginalia_sponsors_v1";
let _seedDataCache = null;

async function fetchSeedData(){
  if (_seedDataCache) return _seedDataCache;
  try{
    const res = await fetch("posts.json");
    if (!res.ok) throw new Error("posts.json not reachable");
    _seedDataCache = await res.json();
  } catch(err){
    // fetch() of local files is blocked by browsers when opened via file://
    // (no server). Fall back to the copy embedded in this script instead.
    _seedDataCache = JSON.parse(JSON.stringify(SEED_DATA_FALLBACK));
  }
  return _seedDataCache;
}

async function loadPosts(){
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached){
    try { return JSON.parse(cached); } catch(e) { /* fall through to reseed */ }
  }
  const seed = (await fetchSeedData()).posts || [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function savePosts(posts){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

async function loadSponsors(){
  const cached = localStorage.getItem(SPONSOR_STORAGE_KEY);
  if (cached){
    try { return JSON.parse(cached); } catch(e) { /* fall through to reseed */ }
  }
  const seed = (await fetchSeedData()).sponsors || [];
  localStorage.setItem(SPONSOR_STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveSponsors(sponsors){
  localStorage.setItem(SPONSOR_STORAGE_KEY, JSON.stringify(sponsors));
}

const THUMB_PALETTE = ["#1F4B43", "#A8452F", "#C98A2B", "#565F58"];
function tagColor(tag){
  let hash = 0;
  for (let i = 0; i < String(tag).length; i++) hash = String(tag).charCodeAt(i) + ((hash << 5) - hash);
  return THUMB_PALETTE[Math.abs(hash) % THUMB_PALETTE.length];
}

function thumbHtml(post, sizeClass){
  const initial = escapeHtml((post.title || "?").trim().charAt(0).toUpperCase() || "?");
  const color = tagColor(parseTags(post.tag)[0] || post.tag);
  const placeholder = `<span class="${sizeClass} thumb-placeholder" style="background:${color}">${initial}</span>`;
  if (!post.image){
    return placeholder;
  }
  const safeUrl = escapeHtml(post.image);
  return `<img class="${sizeClass}" src="${safeUrl}" alt="" loading="lazy" onerror="this.outerHTML='${placeholder.replace(/'/g, "\\'")}'">`;
}

function renderMarkdownish(content){
  return String(content)
    .split(/\n\s*\n/)
    .map(para => {
      let html = escapeHtml(para.trim());
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
      html = html.replace(/`(.+?)`/g, "<code>$1</code>");
      return `<p>${html}</p>`;
    })
    .join("");
}

/* ============================== SITE ===================================== */

let SITE_POSTS = [];
let SITE_SPONSORS = [];
let ACTIVE_TAG = "All";
let ACTIVE_QUERY = "";

async function initSite(){
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav){
    navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
    mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => mainNav.classList.remove("open")));
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput){
    searchInput.addEventListener("input", (e) => {
      ACTIVE_QUERY = e.target.value.trim().toLowerCase();
      renderArchive();
    });
  }

  try{
    SITE_POSTS = (await loadPosts()).filter(p => p.status === "published");
  } catch(err){
    console.error("Could not load posts", err);
    SITE_POSTS = [];
  }

  try{
    SITE_SPONSORS = (await loadSponsors()).filter(s => s.status === "active");
  } catch(err){
    console.error("Could not load sponsors", err);
    SITE_SPONSORS = [];
  }

  renderHero();
  renderTagRail();
  renderArchive();
  renderSponsorSlot();

  window.addEventListener("hashchange", routeSite);
  routeSite();
}

function renderSponsorSlot(){
  const el = document.getElementById("sponsor-slot");
  if (!el) return;

  if (SITE_SPONSORS.length === 0){
    el.innerHTML = `
      <div class="sponsor-block sponsor-empty">
        <p class="sponsor-label">Sponsored</p>
        <p class="sponsor-empty-text">This spot is open. <a href="#contact-anchor">Get in touch</a> to sponsor an issue of Marginalia.</p>
      </div>
    `;
    return;
  }

  const sponsor = SITE_SPONSORS[Math.floor(Math.random() * SITE_SPONSORS.length)];
  const initial = escapeHtml((sponsor.name || "?").trim().charAt(0).toUpperCase() || "?");
  const placeholder = `<span class="sponsor-logo thumb-placeholder" style="background:${tagColor(sponsor.name)}">${initial}</span>`;
  const logo = sponsor.imageUrl
    ? `<img class="sponsor-logo" src="${escapeHtml(sponsor.imageUrl)}" alt="" loading="lazy" onerror="this.outerHTML='${placeholder.replace(/'/g, "\\'")}'">`
    : placeholder;

  el.innerHTML = `
    <div class="sponsor-block">
      <p class="sponsor-label">Sponsored</p>
      <a class="sponsor-card" href="${escapeHtml(sponsor.linkUrl || "#")}" target="_blank" rel="noopener sponsored">
        ${logo}
        <span class="sponsor-copy">
          <span class="sponsor-name">${escapeHtml(sponsor.name)}</span>
          <span class="sponsor-tagline">${escapeHtml(sponsor.tagline || "")}</span>
        </span>
        <span class="sponsor-cta">Visit &rarr;</span>
      </a>
    </div>
  `;
}

function renderHero(){
  const latest = [...SITE_POSTS].sort((a,b) => new Date(b.date) - new Date(a.date))[0];
  const textEl = document.getElementById("hero-featured");
  const imageEl = document.getElementById("hero-image");
  if (!textEl) return;
  if (!latest){
    textEl.innerHTML = `<p class="lede">No entries published yet. Add the first one from the admin panel.</p>`;
    if (imageEl) imageEl.style.display = "none";
    return;
  }
  textEl.innerHTML = `
    <p class="hero-eyebrow">Latest entry — № ${String(SITE_POSTS.indexOf(latest) + 1).padStart(3,"0")}</p>
    <h1><a href="#post/${escapeHtml(latest.slug)}" style="text-decoration:none;color:inherit;">${escapeHtml(latest.title)}</a></h1>
    <p class="lede">${escapeHtml(latest.excerpt)}</p>
  `;
  if (imageEl){
    if (latest.image){
      imageEl.style.display = "block";
      imageEl.innerHTML = `<a href="#post/${escapeHtml(latest.slug)}">${thumbHtml(latest, "hero-image-img")}</a>`;
    } else {
      imageEl.style.display = "none";
      imageEl.innerHTML = "";
    }
  }
}

function renderTagRail(){
  const rail = document.getElementById("tag-rail");
  if (!rail) return;
  const allTags = [];
  SITE_POSTS.forEach(p => {
    parseTags(p.tag).forEach(t => {
      if (!allTags.some(x => x.toLowerCase() === t.toLowerCase())) allTags.push(t);
    });
  });
  const tags = ["All", ...allTags];
  rail.innerHTML = tags.map(tag => `
    <button class="tag-chip${tag.toLowerCase() === ACTIVE_TAG.toLowerCase() ? " active" : ""}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>
  `).join("");
  rail.querySelectorAll(".tag-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      ACTIVE_TAG = btn.dataset.tag;
      renderTagRail();
      renderArchive();
    });
  });
}

function renderArchive(){
  const list = document.getElementById("archive-list");
  const countEl = document.getElementById("archive-count");
  if (!list) return;

  let posts = [...SITE_POSTS].sort((a,b) => new Date(b.date) - new Date(a.date));
  if (ACTIVE_TAG !== "All"){
    posts = posts.filter(p => parseTags(p.tag).some(t => t.toLowerCase() === ACTIVE_TAG.toLowerCase()));
  }
  if (ACTIVE_QUERY){
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(ACTIVE_QUERY) ||
      p.excerpt.toLowerCase().includes(ACTIVE_QUERY) ||
      parseTags(p.tag).some(t => t.toLowerCase().includes(ACTIVE_QUERY))
    );
  }

  if (countEl) countEl.textContent = `${posts.length} ${posts.length === 1 ? "entry" : "entries"}`;

  if (posts.length === 0){
    list.innerHTML = `<div class="empty-state"><strong>Nothing here yet</strong>Try a different tag or search term.</div>`;
    return;
  }

  list.innerHTML = posts.map((p, i) => `
    <a class="post-row" href="#post/${escapeHtml(p.slug)}">
      <span class="post-num">№ ${String(i + 1).padStart(3,"0")}</span>
      <span class="post-row-thumb-wrap">${thumbHtml(p, "post-row-thumb")}</span>
      <span>
        <p class="post-row-title">${escapeHtml(p.title)}</p>
        <p class="post-row-excerpt">${escapeHtml(p.excerpt)}</p>
        <span class="post-row-meta">
          ${tagChipsHtml(p)}
          <span>${formatDate(p.date)}</span>
        </span>
      </span>
      <span class="post-row-side">${readTime(p.content)} min read</span>
    </a>
  `).join("");
}

function routeSite(){
  const hash = window.location.hash.replace(/^#/, "");
  const home = document.getElementById("home-view");
  const detail = document.getElementById("post-view");
  if (!home || !detail) return;

  if (hash.startsWith("post/")){
    const slug = decodeURIComponent(hash.slice(5));
    const post = SITE_POSTS.find(p => p.slug === slug);
    if (post){
      renderPostDetail(post);
      home.style.display = "none";
      detail.style.display = "block";
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      return;
    }
  }
  home.style.display = "block";
  detail.style.display = "none";
}

function renderPostDetail(post){
  const detail = document.getElementById("post-view");
  const bannerHtml = post.image
    ? `<div class="post-banner">${thumbHtml(post, "post-banner-img")}</div>`
    : "";
  detail.innerHTML = `
    <div class="wrap post-detail">
      <button class="back-link" onclick="window.location.hash='';return false;">&larr; Back to all entries</button>
      <div class="post-detail-meta">
        ${tagChipsHtml(post)}
        <span>${formatDate(post.date)}</span>
        <span>${readTime(post.content)} min read</span>
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      ${bannerHtml}
      <div class="post-body">${renderMarkdownish(post.content)}</div>
    </div>
  `;
}

/* ============================== ADMIN ===================================== */

let ADMIN_POSTS = [];
let ADMIN_SPONSORS = [];
let EDITING_ID = null;
let EDITING_SPONSOR_ID = null;

function initAdmin(){
  const isAuthed = sessionStorage.getItem(AUTH_KEY) === "true";
  if (isAuthed){
    showAdminDashboard();
  } else {
    showLoginScreen();
  }
}

function showLoginScreen(){
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("admin-main").style.display = "none";

  const form = document.getElementById("login-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = document.getElementById("login-password").value;
    const error = document.getElementById("login-error");
    if (value === ADMIN_PASSWORD){
      sessionStorage.setItem(AUTH_KEY, "true");
      error.classList.remove("show");
      showAdminDashboard();
    } else {
      error.textContent = "Incorrect password.";
      error.classList.add("show");
    }
  });
}

fetch("data/data.json")
  .then(response => response.json())
  .then(data => {
      const posts = data.posts;

      // 👇 Add this here
      const allTags = [...new Set(
          posts.flatMap(post =>
              post.tag.split(",").map(tag => tag.trim())
          )
      )];

      console.log(allTags);

      // Render your posts
      renderPosts(posts);
  });

async function showAdminDashboard(){
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("admin-main").style.display = "block";

  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
  });

  const newPostBtn = document.getElementById("new-post-btn");
  if (newPostBtn) newPostBtn.addEventListener("click", () => startNewPost());
  document.getElementById("reset-seed-btn").addEventListener("click", resetToSeed);
  document.getElementById("export-btn").addEventListener("click", exportJson);
  document.getElementById("post-form").addEventListener("submit", handleFormSubmit);
  document.getElementById("cancel-edit-btn").addEventListener("click", () => startNewPost());

  const newSponsorBtn = document.getElementById("new-sponsor-btn");
  if (newSponsorBtn) newSponsorBtn.addEventListener("click", () => startNewSponsor());
  document.getElementById("sponsor-form").addEventListener("submit", handleSponsorFormSubmit);
  document.getElementById("cancel-sponsor-edit-btn").addEventListener("click", () => startNewSponsor());

  ADMIN_POSTS = await loadPosts();
  ADMIN_SPONSORS = await loadSponsors();
  renderAdminList();
  renderSponsorAdminList();
  renderStats();
  startNewPost();
  startNewSponsor();
}

function renderStats(){
  const wrap = document.getElementById("stat-row");
  if (!wrap) return;
  const published = ADMIN_POSTS.filter(p => p.status === "published").length;
  const drafts = ADMIN_POSTS.filter(p => p.status === "draft").length;
  const activeSponsors = ADMIN_SPONSORS.filter(s => s.status === "active").length;
  wrap.innerHTML = `
    <div class="stat"><span class="num">${ADMIN_POSTS.length}</span><span class="label">Total entries</span></div>
    <div class="stat"><span class="num">${published}</span><span class="label">Published</span></div>
    <div class="stat"><span class="num">${drafts}</span><span class="label">Drafts</span></div>
    <div class="stat"><span class="num">${activeSponsors}</span><span class="label">Active sponsors</span></div>
  `;
}

function renderAdminList(){
  const list = document.getElementById("admin-post-list");
  if (!list) return;

  const posts = [...ADMIN_POSTS].sort((a,b) => new Date(b.date) - new Date(a.date));

  if (posts.length === 0){
    list.innerHTML = `<div class="empty-state"><strong>No entries yet</strong>Use the form to add your first one.</div>`;
    return;
  }

  list.innerHTML = posts.map(p => `
    <div class="admin-post-item" data-id="${escapeHtml(p.id)}">
      ${thumbHtml(p, "admin-thumb")}
      <div class="admin-item-body">
        <p class="admin-post-title">${escapeHtml(p.title)}</p>
        <div class="admin-post-meta">
          <span class="status-pill ${p.status}">${p.status}</span>
          <span>${escapeHtml(parseTags(p.tag).join(", "))}</span>
          <span>${formatDate(p.date)}</span>
        </div>
      </div>
      <div class="admin-post-actions">
        <button class="icon-btn" title="Edit" data-action="edit" aria-label="Edit entry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn" title="Toggle status" data-action="toggle" aria-label="Toggle publish status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="icon-btn danger" title="Delete" data-action="delete" aria-label="Delete entry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".admin-post-item").forEach(item => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => editPost(id));
    item.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleStatus(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deletePost(id));
  });
}

function startNewPost(){
  EDITING_ID = null;
  document.getElementById("form-heading").textContent = "New entry";
  document.getElementById("post-form").reset();
  document.getElementById("post-date").value = new Date().toISOString().slice(0,10);
  document.getElementById("cancel-edit-btn").style.display = "none";
  document.getElementById("submit-btn").textContent = "Save entry";
}

function editPost(id){
  const post = ADMIN_POSTS.find(p => p.id === id);
  if (!post) return;
  EDITING_ID = id;
  document.getElementById("form-heading").textContent = "Edit entry";
  document.getElementById("post-title").value = post.title;
  document.getElementById("post-excerpt").value = post.excerpt;
  document.getElementById("post-content").value = post.content;
  document.getElementById("post-tag").value = parseTags(post.tag).join(", ");
  document.getElementById("post-date").value = post.date;
  document.getElementById("post-status").value = post.status;
  document.getElementById("post-image").value = post.image || "";
  document.getElementById("cancel-edit-btn").style.display = "inline-flex";
  document.getElementById("submit-btn").textContent = "Update entry";
  document.getElementById("post-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleStatus(id){
  const post = ADMIN_POSTS.find(p => p.id === id);
  if (!post) return;
  post.status = post.status === "published" ? "draft" : "published";
  savePosts(ADMIN_POSTS);
  renderAdminList();
  renderStats();
  showToast(`Marked as ${post.status}`);
}

function deletePost(id){
  const post = ADMIN_POSTS.find(p => p.id === id);
  if (!post) return;
  if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return;
  ADMIN_POSTS = ADMIN_POSTS.filter(p => p.id !== id);
  savePosts(ADMIN_POSTS);
  renderAdminList();
  renderStats();
  if (EDITING_ID === id) startNewPost();
  showToast("Entry deleted");
}

function handleFormSubmit(e){
  e.preventDefault();
  const title = document.getElementById("post-title").value.trim();
  const excerpt = document.getElementById("post-excerpt").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const tag = normalizeTagInput(document.getElementById("post-tag").value) || "General";
  const date = document.getElementById("post-date").value || new Date().toISOString().slice(0,10);
  const status = document.getElementById("post-status").value;
  const image = document.getElementById("post-image").value.trim();

  if (!title || !excerpt || !content){
    showToast("Title, excerpt, and content are required");
    return;
  }

  if (EDITING_ID){
    const post = ADMIN_POSTS.find(p => p.id === EDITING_ID);
    Object.assign(post, { title, excerpt, content, tag, date, status, image, slug: slugify(title) });
    showToast("Entry updated");
  } else {
    ADMIN_POSTS.unshift({
      id: "p" + Date.now(),
      slug: slugify(title),
      title, excerpt, content, tag, date, status, image
    });
    showToast("Entry saved");
  }

  savePosts(ADMIN_POSTS);
  renderAdminList();
  renderStats();
  startNewPost();
}

/* ---------------------------- sponsors (admin) ---------------------------- */

function renderSponsorAdminList(){
  const list = document.getElementById("admin-sponsor-list");
  if (!list) return;

  if (ADMIN_SPONSORS.length === 0){
    list.innerHTML = `<div class="empty-state"><strong>No sponsors yet</strong>Add one to fill the sponsored slot on the site.</div>`;
    return;
  }

  list.innerHTML = ADMIN_SPONSORS.map(s => {
    const initial = escapeHtml((s.name || "?").trim().charAt(0).toUpperCase() || "?");
    const color = tagColor(s.name);
    const placeholder = `<span class="admin-thumb thumb-placeholder" style="background:${color}">${initial}</span>`;
    const logo = s.imageUrl
      ? `<img class="admin-thumb" src="${escapeHtml(s.imageUrl)}" alt="" loading="lazy" onerror="this.outerHTML='${placeholder.replace(/'/g, "\\'")}'">`
      : placeholder;
    return `
      <div class="admin-post-item" data-id="${escapeHtml(s.id)}">
        ${logo}
        <div class="admin-item-body">
          <p class="admin-post-title">${escapeHtml(s.name)}</p>
          <div class="admin-post-meta">
            <span class="status-pill ${s.status === "active" ? "published" : "draft"}">${escapeHtml(s.status)}</span>
            <span>${escapeHtml(s.tagline || "")}</span>
          </div>
        </div>
        <div class="admin-post-actions">
          <button class="icon-btn" title="Edit" data-action="edit" aria-label="Edit sponsor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn" title="Toggle active" data-action="toggle" aria-label="Toggle sponsor status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="icon-btn danger" title="Delete" data-action="delete" aria-label="Delete sponsor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".admin-post-item").forEach(item => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => editSponsor(id));
    item.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleSponsorStatus(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteSponsor(id));
  });
}

function startNewSponsor(){
  EDITING_SPONSOR_ID = null;
  document.getElementById("sponsor-form-heading").textContent = "New sponsor";
  document.getElementById("sponsor-form").reset();
  document.getElementById("sponsor-status").value = "active";
  document.getElementById("cancel-sponsor-edit-btn").style.display = "none";
  document.getElementById("sponsor-submit-btn").textContent = "Save sponsor";
}

function editSponsor(id){
  const sponsor = ADMIN_SPONSORS.find(s => s.id === id);
  if (!sponsor) return;
  EDITING_SPONSOR_ID = id;
  document.getElementById("sponsor-form-heading").textContent = "Edit sponsor";
  document.getElementById("sponsor-name").value = sponsor.name;
  document.getElementById("sponsor-tagline").value = sponsor.tagline || "";
  document.getElementById("sponsor-image").value = sponsor.imageUrl || "";
  document.getElementById("sponsor-link").value = sponsor.linkUrl || "";
  document.getElementById("sponsor-status").value = sponsor.status;
  document.getElementById("cancel-sponsor-edit-btn").style.display = "inline-flex";
  document.getElementById("sponsor-submit-btn").textContent = "Update sponsor";
  document.getElementById("sponsor-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleSponsorStatus(id){
  const sponsor = ADMIN_SPONSORS.find(s => s.id === id);
  if (!sponsor) return;
  sponsor.status = sponsor.status === "active" ? "paused" : "active";
  saveSponsors(ADMIN_SPONSORS);
  renderSponsorAdminList();
  renderStats();
  showToast(`Sponsor marked ${sponsor.status}`);
}

function deleteSponsor(id){
  const sponsor = ADMIN_SPONSORS.find(s => s.id === id);
  if (!sponsor) return;
  if (!window.confirm(`Delete sponsor "${sponsor.name}"? This can't be undone.`)) return;
  ADMIN_SPONSORS = ADMIN_SPONSORS.filter(s => s.id !== id);
  saveSponsors(ADMIN_SPONSORS);
  renderSponsorAdminList();
  renderStats();
  if (EDITING_SPONSOR_ID === id) startNewSponsor();
  showToast("Sponsor deleted");
}

function handleSponsorFormSubmit(e){
  e.preventDefault();
  const name = document.getElementById("sponsor-name").value.trim();
  const tagline = document.getElementById("sponsor-tagline").value.trim();
  const imageUrl = document.getElementById("sponsor-image").value.trim();
  const linkUrl = document.getElementById("sponsor-link").value.trim();
  const status = document.getElementById("sponsor-status").value;

  if (!name){
    showToast("Sponsor name is required");
    return;
  }

  if (EDITING_SPONSOR_ID){
    const sponsor = ADMIN_SPONSORS.find(s => s.id === EDITING_SPONSOR_ID);
    Object.assign(sponsor, { name, tagline, imageUrl, linkUrl, status });
    showToast("Sponsor updated");
  } else {
    ADMIN_SPONSORS.unshift({ id: "s" + Date.now(), name, tagline, imageUrl, linkUrl, status });
    showToast("Sponsor saved");
  }

  saveSponsors(ADMIN_SPONSORS);
  renderSponsorAdminList();
  renderStats();
  startNewSponsor();
}

/* ---------------------------- reset / export ------------------------------ */

async function resetToSeed(){
  if (!window.confirm("Reset all entries and sponsors back to the original demo content? Your edits will be lost.")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SPONSOR_STORAGE_KEY);
  _seedDataCache = null;
  const seed = await fetchSeedData();
  ADMIN_POSTS = seed.posts || [];
  ADMIN_SPONSORS = seed.sponsors || [];
  savePosts(ADMIN_POSTS);
  saveSponsors(ADMIN_SPONSORS);
  renderAdminList();
  renderSponsorAdminList();
  renderStats();
  startNewPost();
  startNewSponsor();
  showToast("Reset to original demo content");
}

function exportJson(){
  const payload = { posts: ADMIN_POSTS, sponsors: ADMIN_SPONSORS };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "posts.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("posts.json downloaded — replace the file to publish these changes permanently");
}

let toastTimer = null;
function showToast(message){
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---------------------------- bootstrap ----------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "site") initSite();
  if (page === "admin") initAdmin();
});
