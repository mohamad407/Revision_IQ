export const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam'];

// Only allow-listed names ever reach a prompt (the value comes from the user's profile).
export function languageRule(language) {
  if (!LANGUAGES.includes(language) || language === 'English') return '';
  return `\nLANGUAGE: Write ALL student-facing text in ${language}. Keep JSON keys, option letters and numbers in English. Keep widely used technical terms in English where students normally use them.`;
}
