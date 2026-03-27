// Set recipientEmail to the inbox that should receive composed messages.
// Templates live in statements.md; sender options are preset below (no personal email required).
window.PREPARED_STATEMENTS_CONFIG = {
  recipientEmail: "you@example.com",
  defaultSubject: "Prepared statement",

  advocacyHeadline: "Placeholder: Let Your Representatives Know How You Feel",

  formInstructions: [
    "Click a template in the box below to load it into the message field. You can edit the text before sending.",
    "Choose a contact email from the list, then use the button to open your mail app. The message is sent only when you send from your own device.",
  ],

  /** Preset addresses (e.g. city or role inboxes). Shown in a dropdown; must include defaultSenderEmail. */
  senderEmailOptions: ["test@southpasadenaca.gov"],
  defaultSenderEmail: "test@southpasadenaca.gov",
};
