/// <reference types="node" />

import { createHash } from "node:crypto";

import { prohibitedReviewTermHashes } from "./prohibitedReviewTermHashes.js";

export type ProhibitedContentFilterSettings = {
  enabled: boolean;
  mode: "strict";
  maxRepeatedCharacterCount: number;
  maxRepeatedWordCount: number;
};

export type ProhibitedContentViolation =
  | "prohibited_term"
  | "repeated_character"
  | "repeated_word";

export type ProhibitedContentCheckResult =
  | { ok: true }
  | { ok: false; violation: ProhibitedContentViolation };

type NormalizedContent = {
  letters: string[];
  tokens: string[];
};

type CheckProhibitedContentOptions = {
  termHashes?: readonly string[];
};

const LATIN_DIGRAPH_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
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

const HOMOGLYPH_CHARACTERS: Record<string, string> = {
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
const MAX_JOINED_TOKEN_COUNT = 32;
const MAX_CANDIDATE_LENGTH = 128;

function applyLatinDigraphReplacements(value: string): string {
  let result = value;

  for (const [pattern, replacement] of LATIN_DIGRAPH_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

function normalizeModerationCharacter(character: string): string {
  const mappedCharacter = HOMOGLYPH_CHARACTERS[character] ?? character;

  if (mappedCharacter === "ё") {
    return "е";
  }

  if (mappedCharacter === "й") {
    return "и";
  }

  return mappedCharacter;
}

function isModerationLetter(character: string): boolean {
  return LETTER_PATTERN.test(character);
}

function normalizeContent(value: string): NormalizedContent {
  const preparedValue = applyLatinDigraphReplacements(
    value.normalize("NFKC").toLocaleLowerCase("ru")
  );
  const letters: string[] = [];
  const tokens: string[] = [];
  let currentToken = "";

  for (const rawCharacter of preparedValue) {
    const character = normalizeModerationCharacter(rawCharacter);

    if (isModerationLetter(character)) {
      letters.push(character);
      currentToken += character;
      continue;
    }

    if (currentToken) {
      tokens.push(currentToken);
      currentToken = "";
    }
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return { letters, tokens };
}

function collapseRepeatedCharacters(value: string): string {
  let result = "";
  let previousCharacter = "";

  for (const character of value) {
    if (character !== previousCharacter) {
      result += character;
      previousCharacter = character;
    }
  }

  return result;
}

function hashNormalizedTerm(normalizedTerm: string): string {
  return createHash("sha256").update(normalizedTerm, "utf8").digest("hex");
}

export function normalizeProhibitedReviewTermForHash(value: string): string {
  return normalizeContent(value).tokens.join("");
}

export function createProhibitedReviewTermHash(value: string): string {
  return hashNormalizedTerm(normalizeProhibitedReviewTermForHash(value));
}

function hasRepeatedCharacterViolation(
  letters: readonly string[],
  maxRepeatedCharacterCount: number
): boolean {
  if (maxRepeatedCharacterCount < 1) {
    return false;
  }

  let previousLetter = "";
  let repeatedCount = 0;

  for (const letter of letters) {
    if (letter === previousLetter) {
      repeatedCount += 1;
    } else {
      previousLetter = letter;
      repeatedCount = 1;
    }

    if (repeatedCount > maxRepeatedCharacterCount) {
      return true;
    }
  }

  return false;
}

function hasRepeatedWordViolation(
  tokens: readonly string[],
  maxRepeatedWordCount: number
): boolean {
  if (maxRepeatedWordCount < 1) {
    return false;
  }

  let previousToken = "";
  let repeatedCount = 0;

  for (const token of tokens) {
    if (token === previousToken) {
      repeatedCount += 1;
    } else {
      previousToken = token;
      repeatedCount = 1;
    }

    if (repeatedCount > maxRepeatedWordCount) {
      return true;
    }
  }

  return false;
}

function hasProhibitedTermViolation(
  tokens: readonly string[],
  termHashes: ReadonlySet<string>
): boolean {
  if (termHashes.size === 0 || tokens.length === 0) {
    return false;
  }

  for (let startIndex = 0; startIndex < tokens.length; startIndex += 1) {
    let candidate = "";

    for (
      let endIndex = startIndex;
      endIndex < tokens.length &&
      endIndex < startIndex + MAX_JOINED_TOKEN_COUNT;
      endIndex += 1
    ) {
      const nextCandidate = `${candidate}${tokens[endIndex]}`;

      if (nextCandidate.length > MAX_CANDIDATE_LENGTH) {
        break;
      }

      candidate = nextCandidate;

      if (termHashes.has(hashNormalizedTerm(candidate))) {
        return true;
      }

      const collapsedCandidate = collapseRepeatedCharacters(candidate);

      if (
        collapsedCandidate !== candidate &&
        termHashes.has(hashNormalizedTerm(collapsedCandidate))
      ) {
        return true;
      }
    }
  }

  return false;
}

export function checkProhibitedContent(
  value: string,
  settings: ProhibitedContentFilterSettings,
  options: CheckProhibitedContentOptions = {}
): ProhibitedContentCheckResult {
  if (!settings.enabled) {
    return { ok: true };
  }

  const normalizedContent = normalizeContent(value);

  if (
    hasRepeatedCharacterViolation(
      normalizedContent.letters,
      settings.maxRepeatedCharacterCount
    )
  ) {
    return { ok: false, violation: "repeated_character" };
  }

  if (
    hasRepeatedWordViolation(
      normalizedContent.tokens,
      settings.maxRepeatedWordCount
    )
  ) {
    return { ok: false, violation: "repeated_word" };
  }

  const termHashes = new Set(options.termHashes ?? prohibitedReviewTermHashes);

  if (hasProhibitedTermViolation(normalizedContent.tokens, termHashes)) {
    return { ok: false, violation: "prohibited_term" };
  }

  return { ok: true };
}
