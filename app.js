(function () {
  const cfg = window.PREPARED_STATEMENTS_CONFIG || {};
  const DATA_URL = cfg.dataUrl || "statements.json";

  const FALLBACK = {
    recipientEmail: "ccpubliccomment@southpasadenaca.gov",
    defaultSubject: "Huntington and Fremont are for Everyone",
    advocacyHeadline: "Huntington and Fremont are for Everyone",
    advocacyIntro: "",
    statements: [],
  };

  const site = {
    recipientEmail: FALLBACK.recipientEmail,
    defaultSubject: FALLBACK.defaultSubject,
    advocacyHeadline: FALLBACK.advocacyHeadline,
    advocacyIntro: FALLBACK.advocacyIntro,
  };

  const messageField = document.getElementById("message");
  const subjectField = document.getElementById("email-subject");
  const composeBtn = document.getElementById("compose");
  const loadBtn = document.getElementById("load-template");
  const statusEl = document.getElementById("status");
  const templatePickerEl = document.getElementById("template-picker");
  const selectedTemplateLabelEl = document.getElementById("selected-template-label");
  const advocacyEl = document.getElementById("advocacy-headline");
  const advocacyIntroEl = document.getElementById("advocacy-intro");
  let selectedIndex = null;

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle("error", Boolean(isError));
  }

  function applyAdvocacyCopy() {
    if (advocacyEl) {
      advocacyEl.textContent = site.advocacyHeadline;
    }
    if (advocacyIntroEl) {
      advocacyIntroEl.textContent = site.advocacyIntro;
      advocacyIntroEl.hidden = !site.advocacyIntro;
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
      advocacyIntro:
        typeof data.advocacyIntro === "string" && data.advocacyIntro.trim()
          ? data.advocacyIntro.trim()
          : FALLBACK.advocacyIntro,
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
    site.advocacyIntro = cfg.advocacyIntro ?? parsed.advocacyIntro;
    site.recipientEmail = cfg.recipientEmail ?? parsed.recipientEmail;
    site.defaultSubject = cfg.defaultSubject ?? parsed.defaultSubject;

    window.__STATEMENTS__ = parsed.statements;
    applyAdvocacyCopy();
  }

  function populateTemplatePicker(statements) {
    if (!templatePickerEl) return;
    templatePickerEl.innerHTML = "";
    statements.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "template-option";
      btn.dataset.index = String(i);
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");

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
    selectedIndex = index;
    templatePickerEl.querySelectorAll(".template-option").forEach((el, idx) => {
      const isSelected = idx === index;
      el.classList.toggle("is-selected", isSelected);
      el.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
    if (selectedTemplateLabelEl) {
      selectedTemplateLabelEl.hidden = false;
      selectedTemplateLabelEl.textContent = `Selected: ${list[index].title}`;
    }
    if (loadBtn) {
      loadBtn.disabled = false;
      loadBtn.focus();
    }
    setStatus("Step 2: Click “Load selected template into draft,” then customize your message.", false);
  }

  function loadSelectedTemplate() {
    const list = window.__STATEMENTS__;
    if (selectedIndex === null || !list || !list[selectedIndex]) {
      setStatus("Step 1: Select a message template first.", true);
      return;
    }
    const st = list[selectedIndex];
    const useDefaultSubject = selectedIndex === list.length - 1;
    subjectField.value = useDefaultSubject ? site.defaultSubject : st.title;
    messageField.value = st.body;
    messageField.focus();
    setStatus("Step 3: Customize if you like, then send with your email client.", false);
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
    setStatus("Step 1: Select a message template.", false);
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", loadSelectedTemplate);
  }

  composeBtn.addEventListener("click", () => {
    if (!window.__STATEMENTS__ || window.__STATEMENTS__.length === 0) {
      setStatus("Templates are not loaded yet.", true);
      return;
    }

    const bodyText = messageField.value.trim();
    if (!bodyText) {
      setStatus("Step 2: Load a template into the draft first (or write your own message).", true);
      if (loadBtn && !loadBtn.disabled) {
        loadBtn.focus();
      } else if (templatePickerEl) {
        const first = templatePickerEl.querySelector(".template-option");
        if (first) first.focus();
      }
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
