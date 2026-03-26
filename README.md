# Prepared statements (static site)

A small static site for GitHub Pages. Visitors choose a prepared statement (defined in Markdown), enter their email, and open a pre-filled message in their mail app to send to a fixed address.

## How it works

- **`statements.md`** — Each `## Heading` is a statement title; lines below the heading are the message body until the next `##`.
- **`config.js`** — Set `recipientEmail` to the inbox that should receive these messages. Optionally change `defaultSubject`.
- **`index.html`**, **`app.js`**, **`styles.css`** — The page loads the Markdown over HTTP, parses it in the browser, and builds a `mailto:` link (subject + body). The visitor’s email is included at the top of the body so the recipient can reply.

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

5. Edit **`config.js`** on GitHub or locally and push so `recipientEmail` is your real inbox.

## Local preview

From the project folder (`~/code/prepared-statements-site` on your machine), run any static file server so `fetch('statements.md')` works (opening `index.html` directly as a `file://` URL may block the fetch):

```bash
cd ~/code/prepared-statements-site
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Limitations

- Very long templates can make `mailto:` URLs too long for some clients; keep bodies reasonably short or split into shorter options.
