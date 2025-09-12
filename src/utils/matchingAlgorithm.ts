interface UserProfile {
  id: string;
  interests: string[];
  age: number;
  year?: number;
  branch?: string;
  hometown?: string;
  elo_rating?: number;
  bio?: string;
}

export function calculateCompatibilityScore(
  userProfile: UserProfile,
  targetProfile: UserProfile
): { score: number; breakdown: { [key: string]: number } } {
  let totalScore = 0;
  const breakdown: { [key: string]: number } = {};

  // Interest similarity (40% weight)
  const interestScore = calculateInterestSimilarity(userProfile.interests, targetProfile.interests);
  breakdown.interests = Math.round(interestScore * 40);
  totalScore += breakdown.interests;

  // Age compatibility (20% weight)
  const ageScore = calculateAgeCompatibility(userProfile.age, targetProfile.age);
  breakdown.age = Math.round(ageScore * 20);
  totalScore += breakdown.age;

  // Academic year proximity (15% weight)
  const yearScore = calculateYearCompatibility(userProfile.year, targetProfile.year);
  breakdown.year = Math.round(yearScore * 15);
  totalScore += breakdown.year;

  // Branch compatibility (10% weight)
  const branchScore = calculateBranchCompatibility(userProfile.branch, targetProfile.branch);
  breakdown.branch = Math.round(branchScore * 10);
  totalScore += breakdown.branch;

  // ELO rating similarity (10% weight)
  const eloScore = calculateEloCompatibility(userProfile.elo_rating, targetProfile.elo_rating);
  breakdown.elo = Math.round(eloScore * 10);
  totalScore += breakdown.elo;

  // Bio keyword matching (5% weight)
  const bioScore = calculateBioCompatibility(userProfile.bio, targetProfile.bio);
  breakdown.bio = Math.round(bioScore * 5);
  totalScore += breakdown.bio;

  return {
    score: Math.min(Math.round(totalScore), 100),
    breakdown
  };
}

function calculateInterestSimilarity(interests1: string[], interests2: string[]): number {
  if (!interests1?.length || !interests2?.length) return 0;
  
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

function calculateAgeCompatibility(age1: number, age2: number): number {
  const ageDiff = Math.abs(age1 - age2);
  
  // Perfect match for same age, decreasing score for larger differences
  if (ageDiff === 0) return 1;
  if (ageDiff === 1) return 0.9;
  if (ageDiff === 2) return 0.7;
  if (ageDiff === 3) return 0.5;
  if (ageDiff <= 5) return 0.3;
  return 0.1;
}

function calculateYearCompatibility(year1?: number, year2?: number): number {
  if (!year1 || !year2) return 0.5; // Neutral if data missing
  
  const yearDiff = Math.abs(year1 - year2);
  
  if (yearDiff === 0) return 1; // Same year
  if (yearDiff === 1) return 0.8; // Adjacent years
  if (yearDiff === 2) return 0.5; // 2 years apart
  return 0.2; // 3+ years apart
}

function calculateBranchCompatibility(branch1?: string, branch2?: string): number {
  if (!branch1 || !branch2) return 0.5;
  
  // Exact match
  if (branch1.toLowerCase() === branch2.toLowerCase()) return 1;
  
  // Related engineering branches
  const relatedBranches: { [key: string]: string[] } = {
    'computer science': ['information technology', 'software engineering'],
    'electrical': ['electronics', 'electrical and electronics'],
    'mechanical': ['automobile', 'production'],
    'civil': ['architecture', 'environmental'],
  };
  
  const branch1Lower = branch1.toLowerCase();
  const branch2Lower = branch2.toLowerCase();
  
  for (const [main, related] of Object.entries(relatedBranches)) {
    if ((branch1Lower.includes(main) && related.some(r => branch2Lower.includes(r))) ||
        (branch2Lower.includes(main) && related.some(r => branch1Lower.includes(r)))) {
      return 0.7;
    }
  }
  
  return 0.3; // Different branches
}

function calculateEloCompatibility(elo1?: number, elo2?: number): number {
  if (!elo1 || !elo2) return 0.5;
  
  const eloDiff = Math.abs(elo1 - elo2);
  
  if (eloDiff <= 50) return 1;
  if (eloDiff <= 100) return 0.8;
  if (eloDiff <= 200) return 0.6;
  if (eloDiff <= 300) return 0.4;
  return 0.2;
}

function calculateBioCompatibility(bio1?: string, bio2?: string): number {
  if (!bio1 || !bio2) return 0.5;
  
  // Simple keyword matching
  const keywords1 = extractKeywords(bio1);
  const keywords2 = extractKeywords(bio2);
  
  if (keywords1.length === 0 || keywords2.length === 0) return 0.5;
  
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  return commonKeywords.length / Math.max(keywords1.length, keywords2.length);
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'love', 'like', 'enjoy']);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10); // Limit to top 10 keywords
}

export function getCompatibilityTier(score: number): {
  tier: string;
  color: string;
  description: string;
} {
  if (score >= 85) {
    return {
      tier: 'Perfect Match',
      color: 'text-green-600',
      description: 'Extremely compatible!'
    };
  } else if (score >= 70) {
    return {
      tier: 'Great Match',
      color: 'text-blue-600',
      description: 'Very compatible'
    };
  } else if (score >= 55) {
    return {
      tier: 'Good Match',
      color: 'text-yellow-600',
      description: 'Moderately compatible'
    };
  } else if (score >= 40) {
    return {
      tier: 'Fair Match',
      color: 'text-orange-600',
      description: 'Some compatibility'
    };
  } else {
    return {
      tier: 'Low Match',
      color: 'text-red-600',
      description: 'Limited compatibility'
    };
  }
}