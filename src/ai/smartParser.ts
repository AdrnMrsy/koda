import {
  EXPENSE_KEYWORDS,
  INCOME_KEYWORDS,
  EXPENSE_TRIGGERS,
  INCOME_TRIGGERS,
} from './categoryKeywords';

// ── Types ─────────────────────────────────────────────────────────

export interface ParsedTransaction {
  amount: number | null;
  type: 'income' | 'expense';
  categoryName: string | null;
  description: string | null;
  confidence: number; // 0 to 1
  source: 'smart_parser' | 'llm';
}

// ── Amount Extraction ─────────────────────────────────────────────

/**
 * Extracts numeric amounts from natural language text.
 * Handles: "500", "₱500", "P500", "500 pesos", "1,500.50", "1.5k"
 */
function extractAmount(text: string): number | null {
  const cleanText = text.toLowerCase().trim();

  // Pattern: "1.5k", "2k", "1.5K"
  const kMatch = cleanText.match(/(\d+\.?\d*)\s*k\b/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  // Pattern: "₱1,500.50", "P1500", "php 500", "1,500 pesos"
  const amountPatterns = [
    /[₱p][\s]*([\d,]+\.?\d*)/i,
    /php[\s]*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*(?:pesos?|php|₱)/i,
    /([\d,]+\.?\d*)/,
  ];

  for (const pattern of amountPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return null;
}

// ── Type Detection ────────────────────────────────────────────────

/**
 * Determines if the input describes income or expense.
 */
function detectType(text: string): 'income' | 'expense' {
  const lower = text.toLowerCase();

  let expenseScore = 0;
  let incomeScore = 0;

  for (const trigger of EXPENSE_TRIGGERS) {
    if (lower.includes(trigger)) expenseScore += 2;
  }

  for (const trigger of INCOME_TRIGGERS) {
    if (lower.includes(trigger)) incomeScore += 2;
  }

  // Check category keywords for additional signal
  for (const keywords of Object.values(EXPENSE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        expenseScore += 1;
        break;
      }
    }
  }

  for (const keywords of Object.values(INCOME_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        incomeScore += 1;
        break;
      }
    }
  }

  return incomeScore > expenseScore ? 'income' : 'expense';
}

// ── Category Matching ─────────────────────────────────────────────

/**
 * Finds the best matching category for the input text.
 * Returns the category name and a match score.
 */
function matchCategory(
  text: string,
  type: 'income' | 'expense'
): { name: string; score: number } | null {
  const lower = text.toLowerCase();
  const keywordsMap = type === 'expense' ? EXPENSE_KEYWORDS : INCOME_KEYWORDS;

  let bestMatch: { name: string; score: number } | null = null;

  for (const [categoryName, keywords] of Object.entries(keywordsMap)) {
    let score = 0;

    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Longer keyword matches are more specific, so score higher
        score += keyword.length;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: categoryName, score };
    }
  }

  return bestMatch;
}

// ── Description Extraction ────────────────────────────────────────

/**
 * Extracts a meaningful description from the text by removing
 * the amount and common filler words.
 */
function extractDescription(text: string, amount: number | null): string | null {
  let desc = text.trim();

  // Remove amount patterns
  if (amount) {
    const amountStr = amount.toString();
    desc = desc
      .replace(new RegExp(`[₱Pp]?\\s*${amountStr.replace('.', '\\.')}`, 'gi'), '')
      .replace(/\d+\.?\d*\s*k\b/gi, '')
      .replace(/\d[\d,]*\.?\d*\s*(pesos?|php)?/gi, '');
  }

  // Remove trigger words
  const allTriggers = [...EXPENSE_TRIGGERS, ...INCOME_TRIGGERS];
  for (const trigger of allTriggers) {
    desc = desc.replace(new RegExp(`\\b${trigger}\\b`, 'gi'), '');
  }

  // Remove common filler
  desc = desc
    .replace(/\b(on|for|at|in|from|to|my|the|a|an|i|and|or|sa|ng|ko|na)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (desc.length > 0) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return desc.length > 1 ? desc : null;
}

// ── Main Parser ───────────────────────────────────────────────────

/**
 * Parse a natural language string into a structured transaction.
 *
 * Examples:
 *   "spent 500 on groceries" → { amount: 500, type: 'expense', categoryName: 'Groceries', ... }
 *   "earned 2000 from freelance" → { amount: 2000, type: 'income', categoryName: 'Freelance', ... }
 *   "100 grab" → { amount: 100, type: 'expense', categoryName: 'Transport', ... }
 *   "jollibee 250" → { amount: 250, type: 'expense', categoryName: 'Food & Drinks', ... }
 */
export function parseTransaction(input: string): ParsedTransaction {
  const text = input.trim();

  if (!text) {
    return {
      amount: null,
      type: 'expense',
      categoryName: null,
      description: null,
      confidence: 0,
      source: 'smart_parser',
    };
  }

  // Step 1: Extract amount
  const amount = extractAmount(text);

  // Step 2: Detect type (income vs expense)
  const type = detectType(text);

  // Step 3: Match category
  const categoryMatch = matchCategory(text, type);
  const categoryName = categoryMatch?.name || null;

  // Step 4: Extract description
  const description = extractDescription(text, amount);

  // Step 5: Calculate confidence
  let confidence = 0;
  if (amount) confidence += 0.4;
  if (categoryName) confidence += 0.35;
  if (description) confidence += 0.15;
  if (type) confidence += 0.1;

  // Boost confidence if category match was strong
  if (categoryMatch && categoryMatch.score > 5) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  return {
    amount,
    type,
    categoryName,
    description,
    confidence: Math.round(confidence * 100) / 100,
    source: 'smart_parser',
  };
}

/**
 * Quick check if a string looks like a natural language transaction input
 * vs a simple number.
 */
export function isNaturalLanguageInput(text: string): boolean {
  const trimmed = text.trim();
  // If it's just a number, it's not NL
  if (/^\d[\d,.]*$/.test(trimmed)) return false;
  // If it contains letters, it's probably NL
  return /[a-zA-Z]/.test(trimmed) && trimmed.length > 2;
}
