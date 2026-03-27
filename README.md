# Prepared statements (static site)

A small static site for GitHub Pages. Visitors pick a template, edit the subject and message, and open a pre-filled message in their mail app.

## How it works

- **`statements.json`** — Site copy and data: `advocacyHeadline`, `recipientEmail`, `defaultSubject`, and `statements` (each with `title` and `body`).
- **`config.js`** — Optional overrides while developing (see comment in file). Defaults are read from `statements.json`.
- **`index.html`**, **`app.js`**, **`styles.css`** — The page loads `statements.json` over HTTP and builds a `mailto:` link.

No server-side code runs on GitHub Pages; email is sent only when the user sends from their own client.

## Publish under `caseyjlaw` on GitHub

1. Create a new repository on GitHub (for example `prepared-statements-site`) under the **caseyjlaw** account. Do not initialize with a license if you plan to push this folder as-is (or add one later).

2. From the project directory (e.g. after cloning or if it lives under `~/code`):

   ```bash
   cd ~/code/prepared-statements-site
   # Omit the next line if this folder already has a .git directory.
   git init
   git add .
   git commit -m "Add static prepared-statements site for GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/caseyjlaw/prepared-statements-site.git
   git push -u origin main
   ```

   Replace the remote URL with your actual repository name if different.

3. In the repo on GitHub: **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main**, folder **`/` (root)**, save.

4. After a minute, the site will be at `https://caseyjlaw.github.io/<repo-name>/`.

5. Edit **`statements.json`** on GitHub or locally and push so `recipientEmail` and templates match your project.

## Local preview

From the project folder (`~/code/prepared-statements-site` on your machine), run any static file server so `fetch('statements.json')` works (opening `index.html` directly as a `file://` URL may block the fetch):

```bash
cd ~/code/prepared-statements-site
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Limitations

- Very long templates can make `mailto:` URLs too long for some clients; keep bodies reasonably short or split into shorter options.
