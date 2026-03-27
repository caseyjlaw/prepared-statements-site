(function () {
  const cfg = window.PREPARED_STATEMENTS_CONFIG || {};
  const DATA_URL = cfg.dataUrl || "statements.json";

  const FALLBACK = {
    recipientEmail: "you@example.com",
    defaultSubject: "Complete streets advocacy",
    advocacyHeadline:
      "🚲🌳✨ Let your representatives know — complete streets & car-free living matter!",
    statements: [],
    senderOptions: ["test@southpasadenaca.gov"],
    defaultSender: "test@southpasadenaca.gov",
  };

  const site = {
    recipientEmail: FALLBACK.recipientEmail,
    defaultSubject: FALLBACK.defaultSubject,
    advocacyHeadline: FALLBACK.advocacyHeadline,
    senderOptions: [...FALLBACK.senderOptions],
    defaultSender: FALLBACK.defaultSender,
  };

  const messageField = document.getElementById("message");
  const subjectField = document.getElementById("email-subject");
  const senderSelect = document.getElementById("sender-email");
  const composeBtn = document.getElementById("compose");
  const statusEl = document.getElementById("status");
  const templatePickerEl = document.getElementById("template-picker");
  const advocacyEl = document.getElementById("advocacy-headline");

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", Boolean(isError));
  }

  function applyAdvocacyHeadline() {
    if (advocacyEl) {
      advocacyEl.textContent = site.advocacyHeadline;
    }
  }

  function populateSenderSelect() {
    senderSelect.innerHTML = "";
    site.senderOptions.forEach((addr) => {
      const opt = document.createElement("option");
      opt.value = addr;
      opt.textContent = addr;
      senderSelect.appendChild(opt);
    });
    if (site.senderOptions.includes(site.defaultSender)) {
      senderSelect.value = site.defaultSender;
    } else if (site.senderOptions.length > 0) {
      senderSelect.value = site.senderOptions[0];
      site.defaultSender = site.senderOptions[0];
    }
  }

  function parseSiteJson(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(
        "statements.json must contain valid JSON. Check for trailing commas or missing quotes."
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error("statements.json must be a JSON object at the root.");
    }

    const statements = data.statements;
    if (!Array.isArray(statements) || statements.length === 0) {
      throw new Error('JSON must include a non-empty "statements" array.');
    }

    const normalized = [];
    for (let i = 0; i < statements.length; i++) {
      const s = statements[i];
      if (!s || typeof s !== "object") {
        throw new Error(`statements[${i}] must be an object with "title" and "body".`);
      }
      const title = String(s.title || "").trim();
      const body = String(s.body || "").trim();
      if (!title || !body) {
        throw new Error(`statements[${i}] needs non-empty "title" and "body".`);
      }
      normalized.push({ title, body });
    }

    const emailSection = data.emailAddressOptions;
    if (!emailSection || typeof emailSection !== "object") {
      throw new Error('JSON must include an "emailAddressOptions" object.');
    }

    const rawOptions = emailSection.options || emailSection.addresses;
    if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
      throw new Error(
        'emailAddressOptions must include a non-empty "options" (or "addresses") array.'
      );
    }

    const senderOptions = rawOptions.map((a) => String(a).trim()).filter(Boolean);
    if (senderOptions.length === 0) {
      throw new Error("emailAddressOptions.options must contain at least one email.");
    }

    let defaultSender = String(emailSection.default || "").trim();
    if (!defaultSender || !senderOptions.includes(defaultSender)) {
      defaultSender = senderOptions[0];
    }

    return {
      advocacyHeadline:
        typeof data.advocacyHeadline === "string" && data.advocacyHeadline.trim()
          ? data.advocacyHeadline.trim()
          : FALLBACK.advocacyHeadline,
      recipientEmail:
        typeof data.recipientEmail === "string" && data.recipientEmail.trim()
          ? data.recipientEmail.trim()
          : FALLBACK.recipientEmail,
      defaultSubject:
        typeof data.defaultSubject === "string" && data.defaultSubject.trim()
          ? data.defaultSubject.trim()
          : FALLBACK.defaultSubject,
      statements: normalized,
      senderOptions,
      defaultSender,
    };
  }

  function applySiteData(parsed) {
    site.advocacyHeadline = cfg.advocacyHeadline ?? parsed.advocacyHeadline;
    site.recipientEmail = cfg.recipientEmail ?? parsed.recipientEmail;
    site.defaultSubject = cfg.defaultSubject ?? parsed.defaultSubject;
    site.senderOptions =
      Array.isArray(cfg.senderEmailOptions) && cfg.senderEmailOptions.length > 0
        ? cfg.senderEmailOptions.map(String)
        : parsed.senderOptions;
    const desiredDefault = cfg.defaultSenderEmail ?? parsed.defaultSender;
    site.defaultSender = site.senderOptions.includes(desiredDefault)
      ? desiredDefault
      : site.senderOptions[0];

    window.__STATEMENTS__ = parsed.statements;
    applyAdvocacyHeadline();
    populateSenderSelect();
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
    const st = list[index];
    subjectField.value = st.title;
    messageField.value = st.body;
    templatePickerEl.querySelectorAll(".template-option").forEach((el, idx) => {
      el.classList.toggle("is-selected", idx === index);
    });
    subjectField.focus();
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

  async function loadSiteData() {
    setStatus("Loading…", false);
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Could not load ${DATA_URL} (${res.status}).`);
    }
    const text = (await res.text()).trim();
    const parsed = parseSiteJson(text);
    applySiteData(parsed);
    populateTemplatePicker(window.__STATEMENTS__);
    setStatus("Ready when you are — pick a template or write your message, then send.", false);
  }

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

    const subjectLine = subjectField.value.trim() || site.defaultSubject;
    const body = buildBody(bodyText, senderEmail);
    const href = buildMailto(site.recipientEmail, subjectLine, body);

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

  loadSiteData().catch((err) => {
    console.error(err);
    setStatus(err.message || "Failed to load site data.", true);
  });
})();
