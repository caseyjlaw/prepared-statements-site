(function () {
  const cfg = window.PREPARED_STATEMENTS_CONFIG || {};
  const recipient = cfg.recipientEmail || "you@example.com";
  const defaultSubject = cfg.defaultSubject || "Prepared statement";

  const statementSelect = document.getElementById("statement");
  const emailInput = document.getElementById("email");
  const composeBtn = document.getElementById("compose");
  const statusEl = document.getElementById("status");
  const introEl = document.getElementById("intro");
  const statementListEl = document.getElementById("statement-list");

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", Boolean(isError));
  }

  function parseStatements(markdown) {
    const lines = markdown.split(/\r?\n/);
    const statements = [];
    let current = null;
    let bodyLines = [];

    function flush() {
      if (!current) return;
      const body = bodyLines.join("\n").trim();
      statements.push({ title: current, body });
      current = null;
      bodyLines = [];
    }

    for (const line of lines) {
      const h2 = line.match(/^##\s+(.+)/);
      if (h2) {
        flush();
        current = h2[1].trim();
        continue;
      }
      if (current !== null) {
        if (line.startsWith("# ")) continue;
        bodyLines.push(line);
      }
    }
    flush();

    if (statements.length === 0) {
      throw new Error('No statements found. Add sections with "## Title" in statements.md.');
    }
    return statements;
  }

  function populateSelect(statements) {
    statementSelect.innerHTML = "";
    statements.forEach((s, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = s.title;
      statementSelect.appendChild(opt);
    });
  }

  function populateStatementList(statements) {
    if (!statementListEl) return;
    statementListEl.innerHTML = "";
    statements.forEach((s) => {
      const item = document.createElement("div");
      item.className = "statement-list-item";

      const label = document.createElement("span");
      label.className = "statement-list-label";
      label.textContent = s.title;

      const body = document.createElement("p");
      body.className = "statement-list-body";
      body.textContent = s.body;

      item.appendChild(label);
      item.appendChild(body);
      statementListEl.appendChild(item);
    });
    statementListEl.hidden = false;
  }

  function buildBody(template, userEmail) {
    const contact = userEmail.trim();
    const header =
      contact.length > 0
        ? `Sender contact email: ${contact}\n\n---\n\n`
        : "";
    return header + template;
  }

  function buildMailto(recipientAddr, subject, body) {
    const s = encodeURIComponent(subject);
    const b = encodeURIComponent(body);
    return `mailto:${recipientAddr}?subject=${s}&body=${b}`;
  }

  function openMailto(href) {
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function loadStatements() {
    setStatus("Loading statements…", false);
    const res = await fetch("statements.md", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Could not load statements.md (${res.status}).`);
    }
    const text = await res.text();
    const statements = parseStatements(text);
    window.__STATEMENTS__ = statements;
    populateSelect(statements);
    populateStatementList(statements);

    const first = statements[0];
    if (introEl && first) {
      introEl.textContent = first.body.split("\n")[0] || "";
    }

    statementSelect.addEventListener("change", () => {
      const idx = Number.parseInt(statementSelect.value, 10);
      const s = window.__STATEMENTS__[idx];
      if (introEl && s) {
        introEl.textContent = s.body.split("\n")[0] || "";
      }
    });

    setStatus("Choose a statement and enter your email, then open your mail app.", false);
  }

  composeBtn.addEventListener("click", () => {
    const list = window.__STATEMENTS__;
    if (!list || list.length === 0) {
      setStatus("Statements are not loaded yet.", true);
      return;
    }

    const idx = Number.parseInt(statementSelect.value, 10);
    const chosen = list[idx];
    const userEmail = emailInput.value.trim();

    if (!userEmail) {
      setStatus("Please enter your email address.", true);
      emailInput.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      setStatus("That does not look like a valid email address.", true);
      emailInput.focus();
      return;
    }

    const subject =
      chosen && chosen.title
        ? `${defaultSubject}: ${chosen.title}`
        : defaultSubject;
    const body = buildBody(chosen.body, userEmail);
    const href = buildMailto(recipient, subject, body);

    if (href.length > 2000) {
      setStatus(
        "The composed message is very long; your mail app might truncate it. Consider shortening the template.",
        true
      );
    } else {
      setStatus("Opening your email app… If nothing happens, check popup or mail client settings.", false);
    }

    openMailto(href);
  });

  loadStatements().catch((err) => {
    console.error(err);
    setStatus(err.message || "Failed to load statements.", true);
  });
})();
