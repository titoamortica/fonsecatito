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

    await openA
```
