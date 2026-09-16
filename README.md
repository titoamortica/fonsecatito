# Tito Fonseca Archive — SUPER EASY SETUP

This folder is ready for GitHub Pages.

It has:
- Tito's actual Roblox screenshot in `assets/tito-fonseca.png`
- The Midori Mantises logo in `assets/midori-mantises.png`
- Shared online likes
- Shared online comments
- A private owner area
- Photo add / edit / replace / delete
- Journal add / edit / delete
- The passcode is whatever password you give Tito's Supabase owner account. Use `ilovevalencia` if you want the exact passcode requested.
- A journal warning: visitors must click YES before entering. Clicking NO sends them out and tells them: "You should've been sure if you wanted to see these things."

## IMPORTANT: GitHub alone cannot store likes/comments

So this version uses Supabase. You only have to connect it once.

### STEP 1 — Make a Supabase account

Go to https://supabase.com and create a free account.

Create a **New project**.

You can call the project:
`Tito Fonseca Archive`

Wait for the project to finish creating.

### STEP 2 — Put the database in

Inside your Supabase project:

1. Click **SQL Editor** on the left.
2. Click **New query**.
3. Open this folder's `schema.sql`.
4. Copy EVERYTHING inside it.
5. Paste it into the SQL Editor.
6. Click **Run**.

You do not need to understand the SQL. Just copy it all and press Run.

### STEP 3 — Make Tito's owner login

In Supabase:

1. Go to **Authentication**.
2. Go to **Users**.
3. Click **Add user** / **Create user**.
4. Create an email you control.
5. Set the password to:

`ilovevalencia`

If Supabase asks you to confirm the email, confirm it, or turn off email confirmation for this owner account.

### STEP 4 — Stop random people creating accounts

In Supabase Authentication settings, disable public email sign-ups.

The website only needs your one owner account.

### STEP 5 — Copy your Supabase keys

In Supabase, open your project's API / Connect settings.

You need:
- Project URL
- Public `anon` key

Open:

`supabase-config.js`

Replace:

`PASTE_YOUR_SUPABASE_PROJECT_URL_HERE`

with your Project URL.

Replace:

`PASTE_YOUR_SUPABASE_ANON_KEY_HERE`

with your public anon key.

Then replace:

`YOUR_OWNER_EMAIL_HERE`

with the email you used in Step 3.

DO NOT put a `service_role` key in the website.

### STEP 6 — Put the files on GitHub

Upload ALL of these:

- `index.html`
- `style.css`
- `script.js`
- `supabase-config.js`
- `schema.sql`
- `README.md`
- the whole `assets` folder

Then wait for GitHub Pages to publish.

## HOW YOU EDIT THE SITE

At the bottom of the website, click:

`OWNER`

Enter:

`ilovevalencia`

Inside Tito's Control Room:

### PHOTOS
- Add a photo
- Edit its title
- Replace its actual image
- Delete it

### JOURNAL
- Add an entry
- Edit an entry
- Delete an entry

Normal visitors do NOT see the owner controls.

## HOW LIKES WORK

Each visitor gets a browser ID. A person can like each photo once from that browser.

The like count is stored online in Supabase, so people see the same total.

## HOW COMMENTS WORK

People enter a name and comment directly underneath a photo.

Comments are stored online in Supabase, so everyone sees them.

## If a picture ever shows as broken

Make sure the file is inside:

`assets/`

and that the name is exactly:

`assets/tito-fonseca.png`

GitHub is case-sensitive.

The included images are already named correctly, so you should not need to change them.
