// "Vitamin C 15% Serum" → "VC": the first letter of the first two words that start with one.
export function productInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => Array.from(word)[0] ?? '')
    .filter((first) => /^\p{L}/u.test(first))
    .slice(0, 2)
    .map((letter) => letter.toUpperCase())
    .join('');
}

// Splits off the last word, which the title sets in italics; a one-word name is all last word.
export function splitLastWord(name: string): { head: string; last: string } {
  const trimmed = name.trim();
  const lastStart = trimmed.search(/\S+$/);
  return { head: trimmed.slice(0, lastStart), last: trimmed.slice(lastStart) };
}

export function noteLines(notes: string | null): string[] {
  return (notes ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
