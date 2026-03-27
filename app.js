(function () {
  const cfg = window.PREPARED_STATEMENTS_CONFIG || {};
  const recipient = cfg.recipientEmail || "you@example.com";
  const defaultSubject = cfg.defaultSubject || "Complete streets advocacy";
  const advocacyHeadline =
    cfg.advocacyHeadline ||
    "🚲🌳✨ Let your representatives know — complete streets & car-free living matter!";

  const senderOptionsRaw = cfg.senderEmailOptions;
  const senderOptions =
    Array.isArray(senderOptionsRaw) && senderOptionsRaw.length > 0
      ? senderOptionsRaw.map(String)
      : ["test@southpasadenaca.gov"];
  const defaultSender =
    cfg.defaultSenderEmail && senderOptions.includes(cfg.defaultSenderEmail)
      ? cfg.defaultSenderEmail
      : senderOptions[0];

  const messageField = document.getElementById("message");
  const senderSelect = document.getElementById("sender-email");
  const composeBtn = document.getElementById("compose");
  const statusEl = document.getElementById("status");
  const templatePickerEl = document.getElementById("template-picker");
  const advocacyEl = document.getElementById("advocacy-headline");

  let activeTemplateIndex = null;

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", Boolean(isError));
  }

  function applyAdvocacyHeadline() {
    if (advocacyEl) {
      advocacyEl.textContent = advocacyHeadline;
    }
  }

  function populateSenderSelect() {
    senderSelect.innerHTML = "";
    senderOptions.forEach((addr) => {
      const opt = document.createElement("option");
      opt.value = addr;
      opt.textContent = addr;
      senderSelect.appendChild(opt);
    });
    senderSelect.value = defaultSender;
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

  function firstMeaningfulLine(body) {
    const line = body.split(/\r?\n/).find((l) => l.trim().length > 0);
    return (line || body).trim();
  }

  function populateTemplatePicker(statements) {
    if (!templatePickerEl) return;
    templatePickerEl.innerHTML = "";
    statements.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "template-option";
      btn.dataset.index = String(i);

      const title = document.createElement("span");
      title.className = "template-option-title";
      title.textContent = s.title;

      const snip = document.createElement("span");
      snip.className = "template-option-snippet";
      snip.textContent = firstMeaningfulLine(s.body);

      btn.appendChild(title);
      btn.appendChild(snip);
      btn.addEventListener("click", () => selectTemplate(i));
      templatePickerEl.appendChild(btn);
    });
    templatePickerEl.hidden = false;
  }

  function selectTemplate(index) {
    const list = window.__STATEMENTS__;
    if (!list || !list[index]) return;
    activeTemplateIndex = index;
    messageField.value = list[index].body;
    templatePickerEl.querySelectorAll(".template-option").forEach((el, idx) => {
      el.classList.toggle("is-selected", idx === index);
    });
    messageField.focus();
  }

  function buildBody(messageText, senderEmail) {
    const contact = senderEmail.trim();
    const header =
      contact.length > 0
        ? `Sender contact email: ${contact}\n\n---\n\n`
        : "";
    return header + messageText.trim();
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

  function subjectForCompose() {
    const list = window.__STATEMENTS__;
    if (
      activeTemplateIndex !== null &&
      list &&
      list[activeTemplateIndex] &&
      list[activeTemplateIndex].title
    ) {
      return `${defaultSubject}: ${list[activeTemplateIndex].title}`;
    }
    return defaultSubject;
  }

  async function loadStatements() {
    setStatus("Loading templates…", false);
    const res = await fetch("statements.md", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Could not load statements.md (${res.status}).`);
    }
    const text = await res.text();
    const statements = parseStatements(text);
    window.__STATEMENTS__ = statements;
    populateTemplatePicker(statements);
    setStatus("Ready when you are — pick a template or write your message, then send.", false);
  }

  applyAdvocacyHeadline();
  populateSenderSelect();

  composeBtn.addEventListener("click", () => {
    if (!window.__STATEMENTS__ || window.__STATEMENTS__.length === 0) {
      setStatus("Templates are not loaded yet.", true);
      return;
    }

    const bodyText = messageField.value.trim();
    if (!bodyText) {
      setStatus("Add a message (use a template or write your own).", true);
      messageField.focus();
      return;
    }

    const senderEmail = senderSelect.value.trim();
    if (!senderEmail) {
      setStatus("Choose a contact email.", true);
      senderSelect.focus();
      return;
    }

    const subject = subjectForCompose();
    const body = buildBody(bodyText, senderEmail);
    const href = buildMailto(recipient, subject, body);

    if (href.length > 2000) {
      setStatus(
        "The composed message is very long; your mail app might truncate it. Consider shortening the text.",
        true
      );
    } else {
      setStatus(
        "Opening your email app… If nothing happens, check popup or mail client settings.",
        false
      );
    }

    openMailto(href);
  });

  loadStatements().catch((err) => {
    console.error(err);
    setStatus(err.message || "Failed to load templates.", true);
  });
})();
