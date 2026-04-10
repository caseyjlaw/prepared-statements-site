(function () {
  const cfg = window.PREPARED_STATEMENTS_CONFIG || {};
  const DATA_URL = cfg.dataUrl || "statements.json";

  const FALLBACK = {
    recipientEmail: "ccpubliccomment@southpasadenaca.gov",
    defaultSubject: "Public comment",
    advocacyHeadline:
      "Public comment",
    statements: [],
  };

  const site = {
    recipientEmail: FALLBACK.recipientEmail,
    defaultSubject: FALLBACK.defaultSubject,
    advocacyHeadline: FALLBACK.advocacyHeadline,
  };

  const messageField = document.getElementById("message");
  const subjectField = document.getElementById("email-subject");
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
    };
  }

  function applySiteData(parsed) {
    site.advocacyHeadline = cfg.advocacyHeadline ?? parsed.advocacyHeadline;
    site.recipientEmail = cfg.recipientEmail ?? parsed.recipientEmail;
    site.defaultSubject = cfg.defaultSubject ?? parsed.defaultSubject;

    window.__STATEMENTS__ = parsed.statements;
    applyAdvocacyHeadline();
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

      btn.appendChild(title);
      btn.addEventListener("click", () => selectTemplate(i));
      templatePickerEl.appendChild(btn);
    });
    templatePickerEl.hidden = false;
  }

  function selectTemplate(index) {
    const list = window.__STATEMENTS__;
    if (!list || !list[index]) return;
    const st = list[index];
    const useDefaultSubject = index === list.length - 1;
    subjectField.value = useDefaultSubject ? site.defaultSubject : st.title;
    messageField.value = st.body;
    templatePickerEl.querySelectorAll(".template-option").forEach((el, idx) => {
      el.classList.toggle("is-selected", idx === index);
    });
    subjectField.focus();
  }

  function buildBody(messageText) {
    return messageText.trim();
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
    setStatus("Pick a template from the set above or write your message, then click the button below to send the email.", false);
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

    const subjectLine = subjectField.value.trim() || site.defaultSubject;
    const body = buildBody(bodyText);
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
