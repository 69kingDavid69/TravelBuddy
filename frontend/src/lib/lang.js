/**
 * Heuristic language detection for the per-message "ES"/"EN" pill rendered
 * above user messages.
 *
 * The real language detection lives on the backend (langdetect) and drives TTS
 * voice selection — this is only a lightweight UI cue based on common Spanish
 * keywords.
 *
 * @param {string} text - The user's message text.
 * @returns {"es"|"en"} The detected language code.
 */
export function detectLang(text) {
  if (!text) return "en";
  const es = /\b(qué|cuánto|cómo|cuál|dónde|cuándo|por|hola|gracias|euros?|pesos?|fin de semana|este|hoy|mañana)\b/i;
  return es.test(text) ? "es" : "en";
}
