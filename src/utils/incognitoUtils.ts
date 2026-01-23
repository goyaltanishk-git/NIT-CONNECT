import type { DatabaseProfile } from "@/hooks/useProfiles";

export interface AnonymousProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  photos: string[];
  year_of_study: string;
  branch: string;
  hometown: string;
  age?: number;
  height?: number;
  gender: "male" | "female";
  interested_in: "male" | "female";
  isIncognito: boolean;
  originalProfile?: DatabaseProfile;
}

// Random anonymous names for incognito users
const ANONYMOUS_NAMES = [
  "Mystery Girl",
  "Hidden Girl", 
  "Secret Angel",
  "Anonymous Beauty",
  "Enigma Girl",
  "Phantom Lady",
  "Veiled Rose",
  "Shadow Princess",
  "Masked Butterfly",
  "Silent Star",
  "Mysterious Soul",
  "Hidden Gem"
];

// Emoji avatars for incognito users
const EMOJI_AVATARS = [
  "👤", "🎭", "💫", "🌟", "✨", "🔮", "🦋", "🌸", "🌹", "💎", "🎪", "🎨"
];

// Convert emoji to data URL for avatar display
function emojiToDataUrl(emoji: string): string {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 100;
  canvas.height = 100;
  
  if (context) {
    context.font = '60px serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(emoji, 50, 50);
  }
  
  return canvas.toDataURL();
}

// Get a consistent random name based on user ID
function getRandomAnonymousName(userId: string): string {
  return "Anonymous";
}

// Get a consistent random emoji based on user ID
function getRandomEmoji(userId: string): string {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 7) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const index = Math.abs(hash) % EMOJI_AVATARS.length;
  return EMOJI_AVATARS[index];
}

/**
 * Transform a regular profile into an anonymous version for incognito mode
 */
export function createAnonymousProfile(profile: DatabaseProfile): AnonymousProfile {
  const anonymousName = getRandomAnonymousName(profile.user_id || profile.email);
  const emojiAvatar = getRandomEmoji(profile.user_id || profile.email);
  
  return {
    user_id: profile.user_id || profile.email,
    first_name: anonymousName,
    last_name: "",
    bio: "This user has turned on their incognito mode",
    photos: [emojiToDataUrl(emojiAvatar)], // Use emoji avatar
    year_of_study: "Hidden", 
    branch: "Hidden",
    hometown: "Hidden",
    age: undefined, // Hide age
    height: undefined, // Hide height
    gender: profile.gender as "male" | "female",
    interested_in: profile.interested_in as "male" | "female",
    isIncognito: true,
    originalProfile: profile
  };
}

/**
 * Check if a user should be displayed anonymously
 */
export function shouldDisplayAnonymously(profile: DatabaseProfile): boolean {
  return Boolean(profile.incognito_mode);
}

/**
 * Get display name for a user (handles incognito mode)
 */
export function getDisplayName(profile: DatabaseProfile): string {
  // If incognito_mode is true, this will now strictly return "Anonymous"
  if (shouldDisplayAnonymously(profile)) {
    return getRandomAnonymousName(profile.user_id || profile.email);
  }
  
  // Standard naming logic for active users
  return `${profile.first_name} ${profile.last_name}`.trim();
}

/**
 * Get display photos for a user (handles incognito mode)
 */
export function getDisplayPhotos(profile: DatabaseProfile, photos: string[] = []): string[] {
  if (shouldDisplayAnonymously(profile)) {
    const emoji = getRandomEmoji(profile.user_id || profile.email);
    return [emojiToDataUrl(emoji)];
    
  }
  return photos.length > 0 ? photos : [];
}

/**
 * Get display bio for a user (handles incognito mode)
 */
export function getDisplayBio(profile: DatabaseProfile): string {
  if (shouldDisplayAnonymously(profile)) {
    return "This user is browsing anonymously. Match to start a conversation!";
  }
  return profile.bio || "No bio available";
}

/**
 * Get display details for a user (handles incognito mode)
 */
export function getDisplayDetails(profile: DatabaseProfile): {
  year: string;
  branch: string;
  hometown: string;
  age?: number;
  height?: number;
} {
  if (shouldDisplayAnonymously(profile)) {
    return {
      year: "Hidden",
      branch: "Hidden", 
      hometown: "Hidden",
      age: undefined,
      height: undefined
    };
  }

  // Calculate age from date_of_birth
  let age: number | undefined;
  if (profile.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(profile.date_of_birth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  return {
    year: profile.year_of_study || "Unknown",
    branch: profile.branch || "Unknown",
    hometown: profile.hometown || "Unknown", 
    age,
    height: profile.height || undefined
  };
}

/**
 * Check if current user can reveal their identity (only for incognito users)
 */
export function canRevealIdentity(currentUserProfile:   DatabaseProfile): boolean {
  return Boolean(currentUserProfile.incognito_mode);
}

/**
 * Create a revealed profile message for chat
 */
export function createRevealMessage(profile: DatabaseProfile): string {
  const displayDetails = getDisplayDetails(profile);
  return `🎭 I've revealed my identity!

Hi, I'm ${profile.first_name} ${profile.last_name}
${displayDetails.age ? `Age: ${displayDetails.age}\n` : ''}${displayDetails.year !== 'Hidden' ? `Year: ${displayDetails.year}\n` : ''}${displayDetails.branch !== 'Hidden' ? `Branch: ${displayDetails.branch}\n` : ''}${displayDetails.hometown !== 'Hidden' ? `From: ${displayDetails.hometown}\n` : ''}${profile.bio ? `\nAbout me: ${profile.bio}` : ''}`;
}