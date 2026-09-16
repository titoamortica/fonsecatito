const configured =
  window.SUPABASE_URL &&
  window.SUPABASE_ANON_KEY &&
  !window.SUPABASE_URL.includes("PASTE_") &&
  !window.SUPABASE_ANON_KEY.includes("PASTE_") &&
  window.SUPABASE_OWNER_EMAIL &&
  !window.SUPABASE_OWNER_EMAIL.includes("YOUR_");

const db = configured ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

const galleryGrid = document.getElementById("galleryGrid");
const journalList = document.getElementById("journalList");
const loginModal = document.getElementById("loginModal");
const adminModal = document.getElementById("adminModal");
const journalGate = document.getElementById("journalGate");
const loginMsg = document.getElementById("loginMsg");
const adminMsg = document.getElementById("adminMsg");

function escapeHtml(value = "") {
  const d = document.createElement("div");
  d.textContent = value;
  return d.innerHTML;
}
function openModal(el) {
  el.classList.remove("hidden");
  document.body.classList.add("locked");
}
function closeModal(el) {
  el.classList.add("hidden");
  if (![loginModal, adminModal, journalGate].some(m => !m.classList.contains("hidden"))) {
    document.body.classList.remove("locked");
  }
}
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => closeModal(document.getElementById(btn.dataset.close)));
});
[loginModal, adminModal, journalGate].forEach(modal => {
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
});

document.getElementById("ownerLoginBtn").addEventListener("click", () => {
  loginMsg.textContent = configured ? "" : "Finish the one-time setup in README.md first.";
  document.getElementById("passcode").value = "";
  openModal(loginModal);
});

/* Journal gate: YES enters. NO sends them back to the top with the requested message. */
const journalNav = document.getElementById("journalNav");
let journalApproved = false;

journalNav.addEventListener("click", e => {
  e.preventDefault();
  if (journalApproved) {
    document.getElementById("journal").scrollIntoView({ behavior: "smooth" });
    return;
  }
  openModal(journalGate);
});

document.getElementById("journalYes").addEventListener("click", () => {
  journalApproved = true;
  closeModal(journalGate);
  document.getElementById("journal").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("journalNo").addEventListener("click", () => {
  closeModal(journalGate);
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => alert("You should've been sure if you wanted to see these things."), 250);
});

async function loadSite() {
  if (!db) {
    galleryGrid.innerHTML = localGallery();
    journalList.innerHTML = `<p class="empty-state">Journal entries will appear here once the archive is connected.</p>`;
    bindSocial();
    return;
  }

  const [photosResult, journalsResult] = await Promise.all([
    db.from("gallery_photos").select("*").order("created_at", { ascending: false }),
    db.from("journal_entries").select("*").order("created_at", { ascending: false })
  ]);

  if (photosResult.error) {
    galleryGrid.innerHTML = localGallery();
    bindSocial();
  } else {
    renderGallery(photosResult.data || []);
  }

  if (journalsResult.error) {
    journalList.innerHTML = `<p class="empty-state">Journal unavailable.</p>`;
  } else {
    renderJournal(journalsResult.data || []);
  }
}

function localGallery() {
  return `<article class="gallery-card">
    <img src="assets/tito-fonseca.png" alt="Tito Fonseca">
    <div class="photo-meta">
      <strong>TITO FONSECA</strong>
      <div class="social-row">
        <button class="like-btn" data-photo="local-main">♡ <span>0</span></button>
      </div>
      <div class="comments">
        <p class="empty-state">Connect Supabase to enable shared likes and comments.</p>
      </div>
    </div>
  </article>`;
}

function renderGallery(photos) {
  if (!photos.length) {
    galleryGrid.innerHTML = `<p class="empty-state">No photos yet.</p>`;
    return;
  }

  galleryGrid.innerHTML = photos.map(p => `
    <article class="gallery-card" data-id="${escapeHtml(p.id)}">
      <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" loading="lazy">
      <div class="photo-meta">
        <strong>${escapeHtml(p.title)}</strong>
        <div class="social-row">
          <button class="like-btn" data-photo="${escapeHtml(p.id)}">♡ <span id="likes-${escapeHtml(p.id)}">0</span></button>
          <button class="comment-toggle" data-target="comments-${escapeHtml(p.id)}">COMMENTS</button>
        </div>
      </div>
      <div class="comments hidden" id="comments-${escapeHtml(p.id)}">
        <div class="comment-list" id="comment-list-${escapeHtml(p.id)}"></div>
        <form class="comment-form" data-photo="${escapeHtml(p.id)}">
          <input name="name" maxlength="40" placeholder="Your name" required>
          <input name="body" maxlength="500" placeholder="Write a comment..." required>
          <button type="submit">POST</button>
        </form>
      </div>
    </article>
  `).join("");

  bindSocial();
  photos.forEach(p => loadSocial(p.id));
}

function renderJournal(entries) {
  journalList.innerHTML = entries.length
    ? entries.map(e => `
      <article class="journal-entry">
        <div class="journal-date">${new Date(e.created_at).toLocaleDateString("en-GB")}</div>
        <div>
          <h3>${escapeHtml(e.title)}</h3>
          <p>${escapeHtml(e.body).replace(/\n/g, "<br>")}</p>
        </div>
      </article>
    `).join("")
    : `<p class="empty-state">No journal entries yet.</p>`;
}

function bindSocial() {
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.addEventListener("click", () => likePhoto(btn.dataset.photo, btn));
  });
  document.querySelectorAll(".comment-toggle").forEach(btn => {
    btn.addEventListener("click", () => document.getElementById(btn.dataset.target)?.classList.toggle("hidden"));
  });
  document.querySelectorAll(".comment-form").forEach(form => {
    form.addEventListener("submit", postComment);
  });
}

function visitorId() {
  let id = localStorage.getItem("tito_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tito_visitor_id", id);
  }
  return id;
}

function likedKey(photoId) {
  return `tito_liked_${photoId}`;
}

async function loadSocial(photoId) {
  if (!db) return;

  const { count } = await db.from("photo_likes")
    .select("*", { count: "exact", head: true })
    .eq("photo_id", photoId);

  const likeEl = document.getElementById(`likes-${photoId}`);
  if (likeEl) likeEl.textContent = count || 0;

  const likeBtn = document.querySelector(`.like-btn[data-photo="${CSS.escape(photoId)}"]`);
  if (likeBtn && localStorage.getItem(likedKey(photoId))) {
    likeBtn.classList.add("liked");
    likeBtn.firstChild.textContent = "♥ ";
  }

  const { data: comments } = await db.from("photo_comments")
    .select("*")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: true });

  const list = document.getElementById(`comment-list-${photoId}`);
  if (list) {
    list.innerHTML = (comments || []).map(c => `
      <div class="comment">
        <b>${escapeHtml(c.author_name)}</b>
        <span>${escapeHtml(c.body)}</span>
      </div>
    `).join("");
  }
}

async function likePhoto(photoId, btn) {
  if (!db) {
    const span = btn.querySelector("span");
    span.textContent = Number(span.textContent || 0) + 1;
    btn.classList.add("liked");
    btn.firstChild.textContent = "♥ ";
    return;
  }

  if (localStorage.getItem(likedKey(photoId))) return;

  const { error } = await db.from("photo_likes").insert({
    photo_id: photoId,
    visitor_id: visitorId()
  });

  if (error) {
    if (String(error.message).toLowerCase().includes("duplicate")) {
      localStorage.setItem(likedKey(photoId), "1");
    } else {
      alert("Couldn't add your like right now.");
      return;
    }
  } else {
    localStorage.setItem(likedKey(photoId), "1");
  }

  await loadSocial(photoId);
}

async function postComment(e) {
  e.preventDefault();
  if (!db) return;

  const form = e.currentTarget;
  const name = form.elements.name.value.trim().slice(0, 40);
  const body = form.elements.body.value.trim().slice(0, 500);
  if (!name || !body) return;

  const { error } = await db.from("photo_comments").insert({
    photo_id: form.dataset.photo,
    author_name: name,
    body
  });

  if (error) {
    alert("Couldn't post the comment right now.");
    return;
  }

  form.reset();
  await loadSocial(form.dataset.photo);
}

/* OWNER AUTH */
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!configured) {
    loginMsg.textContent = "Finish the one-time setup in README.md first.";
    return;
  }

  const password = document.getElementById("passcode").value;
  loginMsg.textContent = "Checking…";

  const { error } = await db.auth.signInWithPassword({
    email: window.SUPABASE_OWNER_EMAIL,
    password
  });

  if (error) {
    loginMsg.textContent = "That passcode didn't work.";
    return;
  }

  closeModal(loginModal);
  await openAdmin();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (db) await db.auth.signOut();
  closeModal(adminModal);
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".admin-tab-content").forEach(x => x.classList.add("hidden"));
    document.getElementById(`${tab.dataset.tab}Tab`).classList.remove("hidden");
  });
});

async function openAdmin() {
  openModal(adminModal);
  await refreshAdmin();
}

async function refreshAdmin() {
  if (!db) return;

  const [photosResult, journalsResult] = await Promise.all([
    db.from("gallery_photos").select("*").order("created_at", { ascending: false }),
    db.from("journal_entries").select("*").order("created_at", { ascending: false })
  ]);

  const photos = photosResult.data || [];
  const journals = journalsResult.data || [];

  document.getElementById("adminPhotos").innerHTML = photos.length
    ? photos.map(p => `
      <div class="admin-item">
        <div class="admin-item-main">
          <b>${escapeHtml(p.title)}</b>
          <small>Photo</small>
        </div>
        <div class="admin-actions">
          <button onclick="editPhoto('${p.id}')">EDIT</button>
          <button class="danger" onclick="deletePhoto('${p.id}', '${escapeHtml(p.image_path || "")}')">DELETE</button>
        </div>
      </div>
    `).join("")
    : `<p class="empty-state">No photos yet.</p>`;

  document.getElementById("adminJournals").innerHTML = journals.length
    ? journals.map(j => `
      <div class="admin-item">
        <div class="admin-item-main">
          <b>${escapeHtml(j.title)}</b>
          <small>${new Date(j.created_at).toLocaleDateString("en-GB")}</small>
        </div>
        <div class="admin-actions">
          <button onclick="editJournal('${j.id}', '${escapeHtml(j.title).replace(/'/g, "\\'")}', '${escapeHtml(j.body).replace(/'/g, "\\'").replace(/\n/g, "\\n")}')">EDIT</button>
          <button class="danger" onclick="deleteJournal('${j.id}')">DELETE</button>
        </div>
      </div>
    `).join("")
    : `<p class="empty-state">No entries yet.</p>`;
}

/* Add or edit photos */
document.getElementById("photoForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!db) return;

  const file = document.getElementById("photoFile").files[0];
  const title = document.getElementById("photoTitle").value.trim();
  const editingId = e.currentTarget.dataset.editingId || "";
  const oldPath = e.currentTarget.dataset.oldPath || "";

  if (!file && !editingId) return;

  adminMsg.textContent = editingId ? "Replacing photo…" : "Uploading photo…";

  let imagePath = oldPath;
  let imageUrl = "";

  if (file) {
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const upload = await db.storage.from("gallery").upload(path, file);
    if (upload.error) {
      adminMsg.textContent = upload.error.message;
      return;
    }
    imagePath = path;
    imageUrl = db.storage.from("gallery").getPublicUrl(path).data.publicUrl;
  }

  let result;
  if (editingId) {
    const update = { title };
    if (file) {
      update.image_url = imageUrl;
      update.image_path = imagePath;
    }
    result = await db.from("gallery_photos").update(update).eq("id", editingId);
  } else {
    result = await db.from("gallery_photos").insert({ title, image_url: imageUrl, image_path: imagePath });
  }

  if (result.error) {
    adminMsg.textContent = result.error.message;
    return;
  }

  if (editingId && file && oldPath) {
    await db.storage.from("gallery").remove([oldPath]);
  }

  e.currentTarget.reset();
  delete e.currentTarget.dataset.editingId;
  delete e.currentTarget.dataset.oldPath;
  e.currentTarget.querySelector("button").textContent = "ADD PHOTO";
  adminMsg.textContent = editingId ? "Photo updated." : "Photo added.";
  await refreshAdmin();
  await loadSite();
});

window.editPhoto = async id => {
  const { data, error } = await db.from("gallery_photos").select("*").eq("id", id).single();
  if (error || !data) return;

  document.querySelector('.tab[data-tab="photos"]').click();
  const form = document.getElementById("photoForm");
  form.dataset.editingId = data.id;
  form.dataset.oldPath = data.image_path || "";
  document.getElementById("photoTitle").value = data.title;
  document.getElementById("photoFile").value = "";
  form.querySelector("button").textContent = "SAVE PHOTO";
  document.getElementById("photoTitle").focus();
  adminMsg.textContent = "Editing photo. Choose a new file only if you want to replace the image.";
};

window.deletePhoto = async (id, path) => {
  if (!confirm("Delete this photo and its comments/likes?")) return;
  const result = await db.from("gallery_photos").delete().eq("id", id);
  if (result.error) { alert(result.error.message); return; }
  if (path) await db.storage.from("gallery").remove([path]);
  await refreshAdmin();
  await loadSite();
};

/* Add or edit journals */
document.getElementById("journalForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!db) return;

  const title = document.getElementById("journalTitle").value.trim();
  const body = document.getElementById("journalBody").value.trim();
  const editingId = e.currentTarget.dataset.editingId || "";

  const result = editingId
    ? await db.from("journal_entries").update({ title, body }).eq("id", editingId)
    : await db.from("journal_entries").insert({ title, body });

  if (result.error) {
    adminMsg.textContent = result.error.message;
    return;
  }

  e.currentTarget.reset();
  delete e.currentTarget.dataset.editingId;
  e.currentTarget.querySelector("button").textContent = "ADD ENTRY";
  adminMsg.textContent = editingId ? "Journal entry updated." : "Journal entry added.";
  await refreshAdmin();
  await loadSite();
});

window.editJournal = (id, title, body) => {
  document.querySelector('.tab[data-tab="journals"]').click();
  const form = document.getElementById("journalForm");
  form.dataset.editingId = id;
  document.getElementById("journalTitle").value = title;
  document.getElementById("journalBody").value = body.replace(/\\n/g, "\n");
  form.querySelector("button").textContent = "SAVE ENTRY";
  document.getElementById("journalTitle").focus();
  adminMsg.textContent = "Editing journal entry.";
};

window.deleteJournal = async id => {
  if (!confirm("Delete this journal entry?")) return;
  const result = await db.from("journal_entries").delete().eq("id", id);
  if (result.error) { alert(result.error.message); return; }
  await refreshAdmin();
  await loadSite();
};

loadSite();
