const TOKEN_STOPWORDS = new Set([
  'from', 'your', 'you', 'with', 'this', 'that', 'have', 'will', 'been',
  'send', 'sent', 'token', 'code', 'otp', 'verify', 'verification', 'message',
  'deduct', 'debit', 'credit', 'amount', 'bank', 'account', 'status', 'click',
  'avlbal', 'ref', 'not', 'call', 'upi', 'neft', 'imps', 'rtgs',
]);

const SIX_DIGIT_OTP_RE = /\b(\d{6})\b/;
const KEYWORD_TOKEN_RE = /(?:otp|code|token|verify|verification|pin)\D{0,20}([A-Za-z0-9]{4,8})/i;

export function extractToken(inputText) {
  const text = String(inputText || '');

  const sixDigit = text.match(SIX_DIGIT_OTP_RE);
  if (sixDigit?.[1]) {
    return sixDigit[1];
  }

  const keywordMatch = text.match(KEYWORD_TOKEN_RE);
  if (keywordMatch?.[1]) {
    const candidate = keywordMatch[1].trim();
    const lower = candidate.toLowerCase();
    if (!TOKEN_STOPWORDS.has(lower)) {
      return candidate;
    }
  }

  return '';
}

export function normalizeRecipient(rawValue) {
  return String(rawValue || '').replace(/[^\d+]/g, '');
}

export function extractRecipient(rawValue) {
  const raw = String(rawValue || '');
  const numberCandidate = raw.match(/(?:\+?\d[\d\s-]{7,}\d)/);
  if (!numberCandidate?.[0]) {
    return '';
  }

  return normalizeRecipient(numberCandidate[0]);
}
