// NSFW and inappropriate content filtering
const NSFW_KEYWORDS = [
  // Explicit sexual terms
  'sex', 'sexy', 'hot', 'nude', 'naked', 'porn', 'adult', 'xxx', 'nsfw',
  // Inappropriate requests
  'hookup', 'fwb', 'one night', 'casual sex', 'netflix and chill',
  // Body parts (contextual)
  'boobs', 'ass', 'dick', 'penis', 'vagina', 'breast',
  // Dating red flags
  'sugar daddy', 'sugar baby', 'escort', 'massage',
  // Drugs/illegal
  'weed', 'drugs', 'cocaine', 'marijuana', 'pills'
];

const INAPPROPRIATE_PHRASES = [
  'want to see more',
  'send pics',
  'send photos',
  'show me your',
  'what are you wearing',
  'are you alone',
  'come over',
  'my place or yours',
  'dtf',
  'looking for fun',
  'no strings attached'
];

const SCAM_INDICATORS = [
  'whatsapp',
  'telegram',
  'kik',
  'snapchat',
  'instagram',
  'follow me',
  'add me',
  'text me',
  'call me',
  'my number',
  'verification',
  'click here',
  'link in bio',
  'onlyfans',
  'premium'
];

export interface ContentFilterResult {
  isAppropriate: boolean;
  flaggedContent: string[];
  severity: 'low' | 'medium' | 'high';
  reason?: string;
}

export function filterContent(text: string): ContentFilterResult {
  if (!text || text.trim().length === 0) {
    return {
      isAppropriate: true,
      flaggedContent: [],
      severity: 'low'
    };
  }

  const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalizedText.split(/\s+/);
  const flaggedContent: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check for explicit NSFW content
  const nsfwMatches = NSFW_KEYWORDS.filter(keyword => 
    normalizedText.includes(keyword.toLowerCase())
  );
  
  if (nsfwMatches.length > 0) {
    flaggedContent.push(...nsfwMatches);
    severity = 'high';
  }

  // Check for inappropriate phrases
  const phraseMatches = INAPPROPRIATE_PHRASES.filter(phrase =>
    normalizedText.includes(phrase.toLowerCase())
  );
  
  if (phraseMatches.length > 0) {
    flaggedContent.push(...phraseMatches);
    severity = severity === 'high' ? 'high' : 'medium';
  }

  // Check for scam indicators
  const scamMatches = SCAM_INDICATORS.filter(indicator =>
    normalizedText.includes(indicator.toLowerCase())
  );
  
  if (scamMatches.length > 0) {
    flaggedContent.push(...scamMatches);
    severity = severity === 'high' ? 'high' : 'medium';
  }

  // Check for excessive capitalization (potential spam)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    flaggedContent.push('excessive capitalization');
    severity = severity === 'high' ? 'high' : 'low';
  }

  // Check for repeated characters (spam pattern)
  const repeatedPattern = /(.)\1{4,}/g;
  if (repeatedPattern.test(text)) {
    flaggedContent.push('repeated characters');
    severity = severity === 'high' ? 'high' : 'low';
  }

  const isAppropriate = flaggedContent.length === 0;
  
  let reason;
  if (!isAppropriate) {
    if (severity === 'high') {
      reason = 'Contains explicit or inappropriate content';
    } else if (severity === 'medium') {
      reason = 'Contains potentially inappropriate or spam content';
    } else {
      reason = 'Contains minor content issues';
    }
  }

  return {
    isAppropriate,
    flaggedContent,
    severity,
    reason
  };
}

export function filterProfile(profile: {
  bio?: string;
  interests?: string[];
  prompts?: { question: string; answer: string }[];
}): ContentFilterResult {
  const allText = [
    profile.bio || '',
    ...(profile.interests || []),
    ...(profile.prompts || []).map(p => `${p.question} ${p.answer}`)
  ].join(' ');

  return filterContent(allText);
}

export function generateContentWarning(result: ContentFilterResult): string {
  if (result.isAppropriate) return '';
  
  switch (result.severity) {
    case 'high':
      return '⚠️ This profile contains inappropriate content and has been hidden.';
    case 'medium':
      return '⚠️ This profile may contain inappropriate content. Proceed with caution.';
    case 'low':
      return 'ℹ️ This profile has been flagged for minor content issues.';
    default:
      return '';
  }
}