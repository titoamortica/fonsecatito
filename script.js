```js
const configured =
  window.SUPABASE_URL &&
  window.SUPABASE_ANON_KEY &&
  !window.SUPABASE_URL.includes("PASTE_") &&
  !window.SUPABASE_ANON_KEY.includes("PASTE_") &&
  window.SUPABASE_OWNER_EMAIL &&
  !window.SUPABASE_OWNER_EMAIL.includes("YOUR_");

const db = configured
  ? window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    )
  : null;

const galleryGrid = document.getElementById("galleryGrid");
const journalList = document.getElementById("journalList");
const loginModal = document.getElementById("loginModal");
const adminModal = document.getElementById("adminModal");
const journalGate = document.getElementById("journalGate");
const loginMsg = document.getElementById("loginMsg");
const adminMsg = document.getElementById("adminMsg");


/* =========================================================
   BASIC HELPERS
========================================================= */

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

  if (
    ![loginModal, adminModal, journalGate].some(
      m => !m.classList.contains("hidden")
    )
  ) {
    document.body.classList.remove("locked");
  }
}


/* =========================================================
   MODALS
========================================================= */

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => {
    closeModal(document.getElementById(btn.dataset.close));
  });
});

[loginModal, adminModal, journalGate].forEach(modal => {
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal(modal);
  });
});


/* =========================================================
   OWNER LOGIN
========================================================= */

document.getElementById("ownerLoginBtn").addEventListener("click", () => {
  loginMsg.textContent = configured
    ? ""
    : "Finish the one-time setup in README.md first.";

  document.getElementById("passcode").value = "";

  openModal(loginModal);
});


document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!configured) {
    loginMsg.textContent =
      "Supabase is not configured correctly.";
    return;
  }

  const password = document.getElementById("passcode").value;

  if (!password) {
    loginMsg.textContent = "Enter your passcode.";
    return;
  }

  loginMsg.textContent = "Checking…";

  try {
    const { error } = await db.auth.signInWithPassword({
      email: window.SUPABASE_OWNER_EMAIL,
      password
    });

    if (error) {
      console.error("LOGIN ERROR:", error);
      loginMsg.textContent = "That passcode didn't work.";
      return;
    }

    closeModal(loginModal);

    await openAdmin();

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    loginMsg.textContent =
      error?.message || "Something went wrong while logging in.";
  }
});


document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (db) {
    await db.auth.signOut();
  }

  closeModal(adminModal);
});


/* =========================================================
   JOURNAL GATE
========================================================= */

const journalNav = document.getElementById("journalNav");

let journalApproved = false;

journalNav.addEventListener("click", e => {
  e.preventDefault();

  if (journalApproved) {
    document
      .getElementById("journal")
      .scrollIntoView({ behavior: "smooth" });

    return;
  }

  openModal(journalGate);
});


document.getElementById("journalYes").addEventListener("click", () => {
  journalApproved = true;

  closeModal(journalGate);

  document
    .getElementById("journal")
    .scrollIntoView({ behavior: "smooth" });
});


document.getElementById("journalNo").addEventListener("click", () => {
  closeModal(journalGate);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  setTimeout(() => {
    alert(
      "You should've been sure if you wanted to see these things."
    );
  }, 250);
});


/* =========================================================
   LOAD WEBSITE
========================================================= */

async function loadSite() {
  if (!db) {
    galleryGrid.innerHTML = localGallery();

    journalList.innerHTML = `
      <p class="empty-state">
        Journal entries will appear here once the archive is connected.
      </p>
    `;

    bindSocial();

    return;
  }

  try {
    const [photosResult, journalsResult] = await Promise.all([
      db
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false }),

      db
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
    ]);

    if (photosResult.error) {
      console.error("GALLERY ERROR:", photosResult.error);

      galleryGrid.innerHTML = localGallery();

      bindSocial();
    } else {
      renderGallery(photosResult.data || []);
    }

    if (journalsResult.error) {
      console.error("JOURNAL ERROR:", journalsResult.error);

      journalList.innerHTML = `
        <p class="empty-state">
          Journal unavailable.
        </p>
      `;
    } else {
      renderJournal(journalsResult.data || []);
    }

  } catch (error) {
    console.error("LOAD SITE ERROR:", error);

    galleryGrid.innerHTML = localGallery();

    journalList.innerHTML = `
      <p class="empty-state">
        Archive temporarily unavailable.
      </p>
    `;

    bindSocial();
  }
}
```

  }

  try {
    const [photosResult, journalsResult] = await Promise.all([
      db
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false }),

      db
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
    ]);

    if (photosResult.error) {
      console.error("GALLERY ERROR:", photosResult.error);

      galleryGrid.innerHTML = localGallery();

      bindSocial();
    } else {
      renderGallery(photosResult.data || []);
    }

    if (journalsResult.error) {
      console.error("JOURNAL ERROR:", journalsResult.error);

      journalList.innerHTML = `
        <p class="empty-state">
          Journal unavailable.
        </p>
      `;
    } else {
      renderJournal(journalsResult.data || []);
    }

  } catch (error) {
    console.error("LOAD SITE ERROR:", error);

    galleryGrid.innerHTML = localGallery();

    journalList.innerHTML = `
      <p class="empty-state">
        Archive temporarily unavailable.
      </p>
    `;

    bindSocial();
  }
}


/* =========================================================
   LOCAL FALLBACK GALLERY
========================================================= */

function localGallery() {
  return `
    <article class="gallery-card">

      <img
        src="assets/tito-fonseca.png"
        alt="Tito Fonseca"
      >

      <div class="photo-meta">

        <strong>TITO FONSECA</strong>

        <div class="social-row">

          <button
            class="like-btn"
            data-photo="local-main"
          >
            ♡ <span>0</span>
          </button>

        </div>

        <div class="comments">

          <p class="empty-state">
            Connect Supabase to enable shared likes and comments.
          </p>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   GALLERY
========================================================= */

function renderGallery(photos) {

  if (!photos.length) {

    galleryGrid.innerHTML = `
      <p class="empty-state">
        No photos yet.
      </p>
    `;

    return;
  }

  galleryGrid.innerHTML = photos
    .map(p => `
      <article
        class="gallery-card"
        data-id="${escapeHtml(p.id)}"
      >

        <img
          src="${escapeHtml(p.image_url)}"
          alt="${escapeHtml(p.title)}"
          loading="lazy"
        >

        <div class="photo-meta">

          <strong>
            ${escapeHtml(p.title)}
          </strong>

          <div class="social-row">

            <button
              class="like-btn"
              data-photo="${escapeHtml(p.id)}"
            >
              ♡
              <span id="likes-${escapeHtml(p.id)}">
                0
              </span>
            </button>

            <button
              class="comment-toggle"
              data-target="comments-${escapeHtml(p.id)}"
            >
              COMMENTS
            </button>

          </div>

        </div>

        <div
          class="comments hidden"
          id="comments-${escapeHtml(p.id)}"
        >

          <div
            class="comment-list"
            id="comment-list-${escapeHtml(p.id)}"
          ></div>

          <form
            class="comment-form"
            data-photo="${escapeHtml(p.id)}"
          >

            <input
              name="name"
              maxlength="40"
              placeholder="Your name"
              required
            >

            <input
              name="body"
              maxlength="500"
              placeholder="Write a comment..."
              required
            >

            <button type="submit">
              POST
            </button>

          </form>

        </div>

      </article>
    `)
    .join("");

  bindSocial();

  photos.forEach(p => {
    loadSocial(p.id);
  });
}


/* =========================================================
   JOURNAL
========================================================= */

function renderJournal(entries) {

  journalList.innerHTML = entries.length

    ? entries
        .map(e => `
          <article class="journal-entry">

            <div class="journal-date">
              ${new Date(e.created_at).toLocaleDateString("en-GB")}
            </div>

            <div>

              <h3>
                ${escapeHtml(e.title)}
              </h3>

              <p>
                ${escapeHtml(e.body).replace(/\n/g, "<br>")}
              </p>

            </div>

          </article>
        `)
        .join("")

    : `
      <p class="empty-state">
        No journal entries yet.
      </p>
    `;
}


/* =========================================================
   SOCIAL FEATURES
========================================================= */

function bindSocial() {

  document.querySelectorAll(".like-btn").forEach(btn => {

    btn.addEventListener("click", () => {
      likePhoto(btn.dataset.photo, btn);
    });

  });


  document.querySelectorAll(".comment-toggle").forEach(btn => {

    btn.addEventListener("click", () => {

      document
        .getElementById(btn.dataset.target)
        ?.classList.toggle("hidden");

    });

  });


  document.querySelectorAll(".comment-form").forEach(form => {

    form.addEventListener("submit", postComment);

  });
}


function visitorId() {

  let id = localStorage.getItem("tito_visitor_id");

  if (!id) {

    id = crypto.randomUUID();

    localStorage.setItem(
      "tito_visitor_id",
      id
    );
  }

  return id;
}


function likedKey(photoId) {
  return `tito_liked_${photoId}`;
}


async function loadSocial(photoId) {

  if (!db) return;

  try {

    const { count } = await db
      .from("photo_likes")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("photo_id", photoId);


    const likeEl =
      document.getElementById(`likes-${photoId}`);

    if (likeEl) {
      likeEl.textContent = count || 0;
    }


    const likeBtn =
      document.querySelector(
        `.like-btn[data-photo="${CSS.escape(photoId)}"]`
      );


    if (
      likeBtn &&
      localStorage.getItem(likedKey(photoId))
    ) {

      likeBtn.classList.add("liked");

      likeBtn.firstChild.textContent = "♥ ";
    }


    const { data: comments } = await db
      .from("photo_comments")
      .select("*")
      .eq("photo_id", photoId)
      .order("created_at", {
        ascending: true
      });


    const list =
      document.getElementById(
        `comment-list-${photoId}`
      );


    if (list) {

      list.innerHTML = (comments || [])
        .map(c => `
          <div class="comment">

            <b>
              ${escapeHtml(c.author_name)}
            </b>

            <span>
              ${escapeHtml(c.body)}
            </span>

          </div>
        `)
        .join("");
    }

  } catch (error) {

    console.error(
      "SOCIAL ERROR:",
      error
    );

  }
}


async function likePhoto(photoId, btn) {

  if (!db) {

    const span = btn.querySelector("span");

    span.textContent =
      Number(span.textContent || 0) + 1;

    btn.classList.add("liked");

    btn.firstChild.textContent = "♥ ";

    return;
  }


  if (localStorage.getItem(likedKey(photoId))) {
    return;
  }


  try {

    const { error } = await db
      .from("photo_likes")
      .insert({
        photo_id: photoId,
        visitor_id: visitorId()
      });


    if (error) {

      if (
        String(error.message)
          .toLowerCase()
          .includes("duplicate")
      ) {

        localStorage.setItem(
          likedKey(photoId),
          "1"
        );

      } else {

        alert(
          "Couldn't add your like right now."
        );

        return;
      }

    } else {

      localStorage.setItem(
        likedKey(photoId),
        "1"
      );

    }


    await loadSocial(photoId);

  } catch (error) {

    console.error(
      "LIKE ERROR:",
      error
    );

    alert(
      "Couldn't add your like right now."
    );
  }
}


async function postComment(e) {

  e.preventDefault();

  if (!db) return;

  const form = e.currentTarget;

  const name =
    form.elements.name.value
      .trim()
      .slice(0, 40);

  const body =
    form.elements.body.value
      .trim()
      .slice(0, 500);


  if (!name || !body) return;


  try {

    const { error } = await db
      .from("photo_comments")
      .insert({
        photo_id: form.dataset.photo,
        author_name: name,
        body
      });


    if (error) {

      alert(
        "Couldn't post the comment right now."
      );

      return;
    }


    form.reset();

    await loadSocial(
      form.dataset.photo
    );

  } catch (error) {

    console.error(
      "COMMENT ERROR:",
      error
    );

    alert(
      "Couldn't post the comment right now."
    );
  }
}


/* =========================================================
   ADMIN TABS
========================================================= */

document.querySelectorAll(".tab").forEach(tab => {

  tab.addEventListener("click", () => {

    document
      .querySelectorAll(".tab")
      .forEach(x =>
        x.classList.remove("active")
      );


    tab.classList.add("active");


    document
      .querySelectorAll(".admin-tab-content")
      .forEach(x =>
        x.classList.add("hidden")
      );


    document
      .getElementById(`${tab.dataset.tab}Tab`)
      .classList.remove("hidden");

  });

});


/* =========================================================
   OPEN ADMIN
========================================================= */

async function openAdmin() {

  openModal(adminModal);

  await refreshAdmin();
}


/* =========================================================
   REFRESH ADMIN
========================================================= */

async function refreshAdmin() {

  if (!db) return;


  try {

    const [photosResult, journalsResult] =
      await Promise.all([

        db
          .from("gallery_photos")
          .select("*")
          .order("created_at", {
            ascending: false
          }),

        db
          .from("journal_entries")
          .select("*")
          .order("created_at", {
            ascending: false
          })

      ]);


    const photos =
      photosResult.data || [];

    const journals =
      journalsResult.data || [];


    if (photosResult.error) {

      console.error(
        "ADMIN PHOTOS ERROR:",
        photosResult.error
      );

      document.getElementById(
        "adminPhotos"
      ).innerHTML = `
        <p class="empty-state">
          Couldn't load photos.
        </p>
      `;

    } else {

      document.getElementById(
        "adminPhotos"
      ).innerHTML = photos.length

        ? photos
            .map(p => `
              <div class="admin-item">

                <div class="admin-item-main">

                  <b>
                    ${escapeHtml(p.title)}
                  </b>

                  <small>
                    Photo
                  </small>

                </div>

                <div class="admin-actions">

                  <button
                    onclick="editPhoto('${p.id}')"
                  >
                    EDIT
                  </button>

                  <button
                    class="danger"
                    onclick="deletePhoto('${p.id}', '${escapeHtml(p.image_path || "")}')"
                  >
                    DELETE
                  </button>

                </div>

              </div>
            `)
            .join("")

        : `
          <p class="empty-state">
            No photos yet.
          </p>
        `;
    }


    if (journalsResult.error) {

      console.error(
        "ADMIN JOURNAL ERROR:",
        journalsResult.error
      );

      document.getElementById(
        "adminJournals"
      ).innerHTML = `
        <p class="empty-state">
          Couldn't load journal entries.
        </p>
      `;

    } else {

      document.getElementById(
        "adminJournals"
      ).innerHTML = journals.length

        ? journals
            .map(j => `
              <div class="admin-item">

                <div class="admin-item-main">

                  <b>
                    ${escapeHtml(j.title)}
                  </b>

                  <small>
                    ${new Date(
                      j.created_at
                    ).toLocaleDateString("en-GB")}
                  </small>

                </div>

                <div class="admin-actions">

                  <button
                    onclick="editJournal(
                      '${j.id}',
                      '${escapeHtml(j.title).replace(/'/g, "\\'")}',
                      '${escapeHtml(j.body)
                        .replace(/'/g, "\\'")
                        .replace(/\n/g, "\\n")}'
                    )"
                  >
                    EDIT
                  </button>

                  <button
                    class="danger"
                    onclick="deleteJournal('${j.id}')"
                  >
                    DELETE
                  </button>

                </div>

              </div>
            `)
            .join("")

        : `
          <p class="empty-state">
            No entries yet.
          </p>
        `;
    }

  } catch (error) {

    console.error(
      "ADMIN REFRESH ERROR:",
      error
    );

    adminMsg.textContent =
      error?.message ||
      "Couldn't refresh the editor.";
  }
}


/* =========================================================
   ADD / EDIT PHOTOS
   FIXED VERSION
========================================================= */

document
  .getElementById("photoForm")
  .addEventListener("submit", async e => {

    e.preventDefault();


    if (!db) {

      adminMsg.textContent =
        "Supabase is not connected.";

      return;
    }


    const file =
      document.getElementById("photoFile")
        .files[0];


    const title =
      document.getElementById("photoTitle")
        .value
        .trim();


    const editingId =
      e.currentTarget.dataset.editingId ||
      "";


    const oldPath =
      e.currentTarget.dataset.oldPath ||
      "";


    if (!title) {

      adminMsg.textContent =
        "Please give the photo a title.";

      return;
    }


    if (!file && !editingId) {

      adminMsg.textContent =
        "Please choose a photo.";

      return;
    }


    /* Maximum image size: 25 MB */

    const maxSize =
      25 * 1024 * 1024;


    if (
      file &&
      file.size > maxSize
    ) {

      adminMsg.textContent =
        "That image is too large. Please use an image under 25 MB.";

      return;
    }


    const button =
      e.currentTarget.querySelector(
        "button"
      );


    button.disabled = true;


    adminMsg.textContent =
      editingId
        ? "Replacing photo…"
        : "Uploading photo…";


    try {

      let imagePath =
        oldPath;


      let imageUrl =
        "";


      /* -----------------------------------------
         UPLOAD NEW IMAGE
      ----------------------------------------- */

      if (file) {

        const safeName =
          file.name
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "-"
            )
            .replace(
              /-+/g,
              "-"
            );


        const path =
          `${crypto.randomUUID()}-${safeName}`;


        /*
          Supabase upload request.
          If it takes longer than 60 seconds,
          we stop instead of leaving the page
          stuck forever.
        */

        const uploadPromise =
          db
            .storage
            .from("gallery")
            .upload(
              path,
              file,
              {
                cacheControl: "3600",
                upsert: false
              }
            );


        const timeoutPromise =
          new Promise((_, reject) => {

            setTimeout(() => {

              reject(
                new Error(
                  "The image upload timed out after 60 seconds. Check your internet connection and try again."
                )
              );

            }, 60000);

          });


        const upload =
          await Promise.race([
            uploadPromise,
            timeoutPromise
          ]);


        if (upload.error) {

          throw new Error(
            `Image upload failed: ${upload.error.message}`
          );

        }


        imagePath =
          path;


        const publicUrlResult =
          db
            .storage
            .from("gallery")
            .getPublicUrl(path);


        imageUrl =
          publicUrlResult
            .data
            .publicUrl;


        if (!imageUrl) {

          throw new Error(
            "The image uploaded, but Supabase did not return an image URL."
          );

        }

      }


      /* -----------------------------------------
         SAVE PHOTO TO DATABASE
      ----------------------------------------- */

      let result;


      if (editingId) {

        const updateData = {
          title
        };


        if (file) {

          updateData.image_url =
            imageUrl;

          updateData.image_path =
            imagePath;

        }


        result =
          await db
            .from("gallery_photos")
            .update(updateData)
            .eq("id", editingId);

      } else {

        result =
          await db
            .from("gallery_photos")
            .insert({
              title,
              image_url: imageUrl,
              image_path: imagePath
            });

      }


      if (result.error) {

        throw new Error(
          `Database error: ${result.error.message}`
        );

      }


      /* -----------------------------------------
         DELETE OLD IMAGE AFTER SUCCESSFUL REPLACE
      ----------------------------------------- */

      if (
        editingId &&
        file &&
        oldPath
      ) {

        const removeResult =
          await db
            .storage
            .from("gallery")
            .remove([
              oldPath
            ]);


        if (removeResult.error) {

          console.warn(
            "New photo saved, but old image could not be deleted:",
            removeResult.error.message
          );

        }

      }


      /* -----------------------------------------
         SUCCESS
      ----------------------------------------- */

      e.currentTarget.reset();


      delete e.currentTarget.dataset.editingId;
      delete e.currentTarget.dataset.oldPath;


      button.textContent =
        "ADD PHOTO";


      button.disabled =
        false;


      adminMsg.textContent =
        editingId
          ? "Photo updated successfully."
          : "Photo added successfully.";


      await refreshAdmin();

      await loadSite();


    } catch (error) {

      console.error(
        "PHOTO UPLOAD ERROR:",
        error
      );


      button.disabled =
        false;


      adminMsg.textContent =
        error?.message ||
        "Something went wrong while uploading the photo.";

    }

  });


/* =========================================================
   EDIT PHOTO
========================================================= */

window.editPhoto = async id => {

  if (!db) return;


  const {
    data,
    error
  } = await db
    .from("gallery_photos")
    .select("*")
    .eq("id", id)
    .single();


  if (error || !data) {

    adminMsg.textContent =
      error?.message ||
      "Couldn't load that photo.";

    return;
  }


  document
    .querySelector(
      '.tab[data-tab="photos"]'
    )
    .click();


  const form =
    document.getElementById(
      "photoForm"
    );


  form.dataset.editingId =
    data.id;


  form.dataset.oldPath =
    data.image_path || "";


  document.getElementById(
    "photoTitle"
  ).value =
    data.title;


  document.getElementById(
    "photoFile"
  ).value =
    "";


  form.querySelector(
    "button"
  ).textContent =
    "SAVE PHOTO";


  document.getElementById(
    "photoTitle"
  ).focus();


  adminMsg.textContent =
    "Editing photo. Choose a new file only if you want to replace the image.";
};


/* =========================================================
   DELETE PHOTO
========================================================= */

window.deletePhoto = async (
  id,
  path
) => {

  if (
    !confirm(
      "Delete this photo and its comments/likes?"
    )
  ) {
    return;
  }


  if (!db) return;


  try {

    const result =
      await db
        .from("gallery_photos")
        .delete()
        .eq("id", id);


    if (result.error) {

      alert(
        result.error.message
      );

      return;
    }


    if (path) {

      const removeResult =
        await db
          .storage
          .from("gallery")
          .remove([
            path
          ]);


      if (removeResult.error) {

        console.warn(
          "Photo deleted from database but storage file could not be removed:",
          removeResult.error.message
        );

      }

    }


    await refreshAdmin();

    await loadSite();


  } catch (error) {

    console.error(
      "DELETE PHOTO ERROR:",
      error
    );

    alert(
      error?.message ||
      "Couldn't delete the photo."
    );
  }
};


/* =========================================================
   ADD / EDIT JOURNAL
========================================================= */

document
  .getElementById("journalForm")
  .addEventListener("submit", async e => {

    e.preventDefault();


    if (!db) {

      adminMsg.textContent =
        "Supabase is not connected.";

      return;
    }


    const title =
      document
        .getElementById("journalTitle")
        .value
        .trim();


    const body =
      document
        .getElementById("journalBody")
        .value
        .trim();


    const editingId =
      e.currentTarget.dataset.editingId ||
      "";


    if (!title || !body) {

      adminMsg.textContent =
        "Please fill in the title and journal entry.";

      return;
    }


    try {

      const result =
        editingId

          ? await db
              .from("journal_entries")
              .update({
                title,
                body
              })
              .eq(
                "id",
                editingId
              )

          : await db
              .from("journal_entries")
              .insert({
                title,
                body
              });


      if (result.error) {

        adminMsg.textContent =
          result.error.message;

        return;
      }


      e.currentTarget.reset();


      delete e.currentTarget.dataset.editingId;


      e.currentTarget.querySelector(
        "button"
      ).textContent =
        "ADD ENTRY";


      adminMsg.textContent =
        editingId
          ? "Journal entry updated."
          : "Journal entry added.";


      await refreshAdmin();

      await loadSite();


    } catch (error) {

      console.error(
        "JOURNAL ERROR:",
        error
      );

      adminMsg.textContent =
        error?.message ||
        "Something went wrong with the journal.";
    }

  });


/* =========================================================
   EDIT JOURNAL
========================================================= */

window.editJournal = (
  id,
  title,
  body
) => {

  document
    .querySelector(
      '.tab[data-tab="journals"]'
    )
    .click();


  const form =
    document.getElementById(
      "journalForm"
    );


  form.dataset.editingId =
    id;


  document.getElementById(
    "journalTitle"
  ).value =
    title;


  document.getElementById(
    "journalBody"
  ).value =
    body.replace(
      /\\n/g,
      "\n"
    );


  form.querySelector(
    "button"
  ).textContent =
    "SAVE ENTRY";


  document.getElementById(
    "journalTitle"
  ).focus();


  adminMsg.textContent =
    "Editing journal entry.";
};


/* =========================================================
   DELETE JOURNAL
========================================================= */

window.deleteJournal = async id => {

  if (
    !confirm(
      "Delete this journal entry?"
    )
  ) {
    return;
  }


  if (!db) return;


  try {

    const result =
      await db
        .from("journal_entries")
        .delete()
        .eq("id", id);


    if (result.error) {

      alert(
        result.error.message
      );

      return;
    }


    await refreshAdmin();

    await loadSite();


  } catch (error) {

    console.error(
      "DELETE JOURNAL ERROR:",
      error
    );

    alert(
      error?.message ||
      "Couldn't delete the journal entry."
    );
  }
};


/* =========================================================
   START WEBSITE
========================================================= */

loadSite();
```
