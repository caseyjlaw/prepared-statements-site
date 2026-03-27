// Set recipientEmail to the inbox that should receive composed messages.
// Templates live in statements.md; sender options are preset below (no personal email required).
window.PREPARED_STATEMENTS_CONFIG = {
  recipientEmail: "you@example.com",
  defaultSubject: "Complete streets advocacy",

  advocacyHeadline:
    "🚲🌳✨ Placeholder: Let your representatives know how you feel — safer complete streets, walkable neighborhoods, and car-free ways of living build healthier, happier communities. You’ve got this!",

  /** Preset addresses (e.g. city or role inboxes). Shown in a dropdown; must include defaultSenderEmail. */
  senderEmailOptions: ["test@southpasadenaca.gov"],
  defaultSenderEmail: "test@southpasadenaca.gov",
};
