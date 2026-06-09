import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, "..");
const DICTIONARY_PATH = resolve(
  ROOT_DIR,
  "private/prohibited-review-terms.local.txt"
);
const OUTPUT_PATH = resolve(
  ROOT_DIR,
  "server/moderation/prohibitedReviewTermHashes.ts"
);

const LATIN_DIGRAPH_REPLACEMENTS = [
  [/shch/g, "щ"],
  [/sch/g, "щ"],
  [/yo/g, "е"],
  [/jo/g, "е"],
  [/zh/g, "ж"],
  [/ch/g, "ч"],
  [/sh/g, "ш"],
  [/yu/g, "ю"],
  [/ju/g, "ю"],
  [/ya/g, "я"],
  [/ja/g, "я"],
  [/kh/g, "х"],
  [/ts/g, "ц"],
];

const HOMOGLYPH_CHARACTERS = {
  a: "а",
  b: "в",
  c: "с",
  e: "е",
  h: "н",
  i: "и",
  k: "к",
  m: "м",
  n: "п",
  o: "о",
  p: "р",
  r: "г",
  t: "т",
  u: "и",
  v: "в",
  x: "х",
  y: "у",
  "0": "о",
  "3": "з",
  "4": "ч",
  "6": "б",
  "9": "д",
  "@": "а",
  "$": "с",
  "Α": "а",
  "Β": "в",
  "Ε": "е",
  "Η": "н",
  "Κ": "к",
  "Μ": "м",
  "Ν": "п",
  "Ο": "о",
  "Ρ": "р",
  "Τ": "т",
  "Χ": "х",
  "Υ": "у",
  "α": "а",
  "β": "в",
  "ο": "о",
  "ρ": "р",
  "τ": "т",
  "χ": "х",
  "у": "у",
};

const LETTER_PATTERN = /^\p{L}$/u;

function applyLatinDigraphReplacements(value) {
  let result = value;

  for (const [pattern, replacement] of LATIN_DIGRAPH_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

function normalizeModerationCharacter(character) {
  const mappedCharacter = HOMOGLYPH_CHARACTERS[character] ?? character;

  if (mappedCharacter === "ё") {
    return "е";
  }

  if (mappedCharacter === "й") {
    return "и";
  }

  return mappedCharacter;
}

function normalizeProhibitedReviewTermForHash(value) {
  const preparedValue = applyLatinDigraphReplacements(
    value.normalize("NFKC").toLocaleLowerCase("ru")
  );
  let normalizedTerm = "";

  for (const rawCharacter of preparedValue) {
    const character = normalizeModerationCharacter(rawCharacter);

    if (LETTER_PATTERN.test(character)) {
      normalizedTerm += character;
    }
  }

  return normalizedTerm;
}

function createHashValue(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function readDictionary() {
  try {
    return await readFile(DICTIONARY_PATH, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(
        "Private moderation dictionary was not found. Create private/prohibited-review-terms.local.txt and run the generator again."
      );
    }

    throw error;
  }
}

async function main() {
  const rawDictionary = await readDictionary();
  const normalizedTerms = new Set();

  for (const rawLine of rawDictionary.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const normalizedTerm = normalizeProhibitedReviewTermForHash(trimmedLine);

    if (normalizedTerm) {
      normalizedTerms.add(normalizedTerm);
    }
  }

  const hashes = Array.from(normalizedTerms).map(createHashValue).sort();
  const fileContent = `export const prohibitedReviewTermHashes: readonly string[] = ${JSON.stringify(
    hashes,
    null,
    2
  )};\n`;

  await writeFile(OUTPUT_PATH, fileContent, "utf8");

  console.log(`Generated ${hashes.length} prohibited review term hashes.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
