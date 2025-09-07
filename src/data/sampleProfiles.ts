export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  bio: string;
  year: number;
  branch: string;
  hometown: string;
  interests: string[];
  photos: { url: string; order: number }[];
  height?: string;
  looking_for?: string;
  prompts?: { question: string; answer: string }[];
  elo_rating?: number;
  last_active?: string;
  verified?: boolean;
}

export const SAMPLE_PROFILES: Profile[] = [
  {
    id: "1",
    user_id: "1",
    full_name: "Priya Sharma",
    age: 20,
    bio: "Computer Science enthusiast who loves coding, coffee, and deep conversations. Always up for exploring new places around Kurukshetra! Looking for someone who shares my passion for technology and adventure. 💻☕",
    year: 3,
    branch: "Computer Science",
    hometown: "Delhi",
    height: "5'6\"",
    looking_for: "Relationship",
    elo_rating: 1450,
    last_active: "2 hours ago",
    verified: true,
    interests: ["coding", "coffee", "photography", "travel", "books", "music", "hiking", "tech startups"],
    photos: [
      { url: "https://images.unsplash.com/photo-1494790108755-2616c64d5057?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face", order: 3 },
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face", order: 4 }
    ],
    prompts: [
      { question: "My ideal Sunday involves...", answer: "Coding a passion project while sipping artisan coffee, then exploring hidden cafes in Kurukshetra with someone special." },
      { question: "I'm looking for...", answer: "Someone who can match my energy for deep tech discussions and spontaneous adventures. Bonus points if you can debug my code! 😄" },
      { question: "My hidden talent is...", answer: "I can solve a Rubik's cube in under 60 seconds and make the perfect masala chai that'll change your life!" }
    ]
  },
  {
    id: "2", 
    user_id: "2",
    full_name: "Ankit Kumar",
    age: 21,
    bio: "Mechanical Engineering student with a passion for motorcycles and adventure. Weekend warrior who loves long rides to nowhere and deep conversations under starlit skies. Let's create some epic memories together! 🏍️⭐",
    year: 4,
    branch: "Mechanical Engineering",
    hometown: "Jaipur",
    height: "5'11\"",
    looking_for: "Dating",
    elo_rating: 1320,
    last_active: "1 hour ago",
    verified: true,
    interests: ["motorcycles", "adventure", "mechanics", "fitness", "travel", "photography", "rock music", "camping"],
    photos: [
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face", order: 3 }
    ],
    prompts: [
      { question: "I geek out on...", answer: "Vintage motorcycles and their engineering! I can talk about engines, gear systems, and the physics of speed for hours. It's pure poetry in motion." },
      { question: "You should NOT go out with me if...", answer: "You don't like spontaneous midnight rides to mountain peaks or getting your hands dirty fixing things. Adventure is non-negotiable!" },
      { question: "Together we could...", answer: "Build a custom motorcycle from scratch and take it on an epic road trip across India. Dreams are meant to be shared and lived!" }
    ]
  },
  {
    id: "3",
    user_id: "3", 
    full_name: "Sneha Patel",
    age: 19,
    bio: "Electrical Engineering student passionate about sustainable technology and making the world greener. Classical dancer, food enthusiast, and environmental activist. Let's change the world one small step at a time! 🌱💃",
    year: 2,
    branch: "Electrical Engineering",
    hometown: "Ahmedabad",
    height: "5'4\"",
    looking_for: "Friendship & Dating",
    elo_rating: 1380,
    last_active: "30 minutes ago",
    verified: true,
    interests: ["sustainability", "classical dance", "renewable energy", "cooking", "yoga", "environmental activism", "art", "volunteering"],
    photos: [
      { url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face", order: 3 },
      { url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face", order: 4 }
    ],
    prompts: [
      { question: "I'm passionate about...", answer: "Creating sustainable solutions through technology and inspiring others to join the green revolution. Every small action counts towards a better tomorrow!" },
      { question: "My hidden talent is...", answer: "I can cook amazing fusion dishes that blend traditional Gujarati flavors with continental techniques. Food is love made edible!" },
      { question: "A cause close to my heart is...", answer: "Environmental conservation and renewable energy adoption. I volunteer with local NGOs and dream of powering villages with solar energy." }
    ]
  },
  {
    id: "4",
    user_id: "4",
    full_name: "Rahul Mishra", 
    age: 22,
    bio: "Final year Civil Engineering student who loves building things - both structures and meaningful relationships. Guitarist, cricket enthusiast, and hopeless romantic. Looking for someone to build beautiful memories with! 🏗️🎸❤️",
    year: 4,
    branch: "Civil Engineering",
    hometown: "Lucknow",
    height: "6'0\"",
    looking_for: "Serious Relationship",
    elo_rating: 1290,
    last_active: "3 hours ago",
    verified: true,
    interests: ["architecture", "guitar", "cricket", "photography", "civil engineering", "music composition", "fitness", "volunteering"],
    photos: [
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face", order: 3 }
    ],
    prompts: [
      { question: "I know the best spot in town for...", answer: "Sunset views from the hostel terrace! I'll bring my guitar and play your favorite songs while we watch the sky paint masterpieces." },
      { question: "Together we could...", answer: "Build our dream home (literally - I'm an engineer!) and fill it with laughter, music, and endless conversations about everything and nothing." },
      { question: "I'm looking for someone who...", answer: "Believes in old-school romance, loves deep conversations, and isn't afraid to be vulnerable. Authenticity is incredibly attractive!" }
    ]
  },
  {
    id: "5",
    user_id: "5",
    full_name: "Kavya Singh",
    age: 20,
    bio: "Biotechnology student fascinated by the mysteries of life at molecular level. Aspiring researcher, amateur poet, and chai addict. Love discussing everything from quantum physics to philosophy! 🧬📖☕",
    year: 3,
    branch: "Biotechnology",
    hometown: "Chandigarh",
    height: "5'5\"",
    looking_for: "Meaningful Connections",
    elo_rating: 1420,
    last_active: "1 hour ago",
    verified: true,
    interests: ["biotechnology", "research", "poetry", "philosophy", "chai", "quantum physics", "reading", "nature walks"],
    photos: [
      { url: "https://images.unsplash.com/photo-1485875437342-9ba56309fff8?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=600&fit=crop&crop=face", order: 3 }
    ],
    prompts: [
      { question: "I'm passionate about...", answer: "Understanding life at the cellular level and writing poetry about the beauty I find in scientific discoveries. Science and art aren't opposites!" },
      { question: "My ideal conversation starter is...", answer: "What if consciousness is just an emergent property of complex neural networks? Let's dive deep into the mysteries of existence over chai!" },
      { question: "I'm looking for someone who...", answer: "Can appreciate both the elegance of a DNA helix and the beauty of a well-crafted verse. Intellectual curiosity is incredibly attractive!" }
    ]
  },
  {
    id: "6",
    user_id: "6",
    full_name: "Arjun Reddy",
    age: 23,
    bio: "Electronics & Communication Engineering graduate, now pursuing Masters. Tech entrepreneur in the making, cricket captain, and fitness enthusiast. Building the future one line of code at a time! 💪📱⚡",
    year: 5,
    branch: "Electronics & Communication",
    hometown: "Hyderabad",
    height: "5'10\"",
    looking_for: "Dating & Networking",
    elo_rating: 1510,
    last_active: "45 minutes ago",
    verified: true,
    interests: ["entrepreneurship", "cricket", "fitness", "IoT", "mobile development", "leadership", "public speaking", "investment"],
    photos: [
      { url: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=600&fit=crop&crop=face", order: 3 }
    ],
    prompts: [
      { question: "I geek out on...", answer: "IoT innovations and how they're reshaping our daily lives. I'm currently working on a smart campus project that could revolutionize student life!" },
      { question: "My biggest achievement so far...", answer: "Leading my cricket team to victory in inter-NIT championships and launching my first tech startup. Teamwork and persistence pay off!" },
      { question: "I'm looking for someone who...", answer: "Is ambitious, driven, and excited about creating something meaningful together. Whether it's a business or beautiful memories!" }
    ]
  },
  {
    id: "7",
    user_id: "7",
    full_name: "Isha Gupta",
    age: 19,
    bio: "Chemical Engineering student with dreams of working in sustainable manufacturing. Kathak dancer, amateur chef, and social media content creator. Let's create chemistry both in lab and in life! 💫🧪💃",
    year: 2,
    branch: "Chemical Engineering",
    hometown: "Mumbai",
    height: "5'3\"",
    looking_for: "Fun & Dating",
    elo_rating: 1365,
    last_active: "2 hours ago",
    verified: true,
    interests: ["chemical engineering", "kathak", "cooking", "content creation", "sustainable manufacturing", "fashion", "travel", "photography"],
    photos: [
      { url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=600&fit=crop&crop=face", order: 3 },
      { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop&crop=face", order: 4 }
    ],
    prompts: [
      { question: "My hidden talent is...", answer: "I can recreate any dish just by tasting it once! My friends call me the 'human recipe detector.' Food is my love language!" },
      { question: "You should NOT go out with me if...", answer: "You can't handle my spontaneous dance performances in random places or my obsession with trying new cuisines. Life's too short to be boring!" },
      { question: "My ideal date would be...", answer: "Cooking a new recipe together, then dancing to our favorite songs in the kitchen. Simple moments, genuine laughter, perfect chemistry!" }
    ]
  },
  {
    id: "8",
    user_id: "8",
    full_name: "Vikram Joshi",
    age: 21,
    bio: "Aerospace Engineering student reaching for the stars, literally! ISRO internship alumnus, space enthusiast, and amateur astronomer. Let's explore the cosmos and create our own constellation of memories! 🚀🌌⭐",
    year: 4,
    branch: "Aerospace Engineering",
    hometown: "Bengaluru",
    height: "6'1\"",
    looking_for: "Adventure & Romance",
    elo_rating: 1445,
    last_active: "1 hour ago",
    verified: true,
    interests: ["aerospace", "astronomy", "ISRO", "stargazing", "physics", "space exploration", "research", "trekking"],
    photos: [
      { url: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=600&fit=crop&crop=face", order: 3 }
    ],
    prompts: [
      { question: "I geek out on...", answer: "Rocket propulsion systems and the possibility of life on Mars! Did you know we're made of star dust? The universe is literally within us!" },
      { question: "My dream date would be...", answer: "Stargazing from a hill outside the city, sharing stories about constellations, and discussing our place in this infinite cosmos together." },
      { question: "Together we could...", answer: "Plan a mission to Mars! (Kidding) But seriously, let's explore earthly adventures while dreaming about the stars above." }
    ]
  },
  {
    id: "9",
    user_id: "9",
    full_name: "Nisha Kumari",
    age: 20,
    bio: "Mathematics student who finds beauty in equations and patterns. Part-time tutor, full-time dreamer, and weekend artist. Looking for someone who appreciates both logic and creativity! 📐🎨✨",
    year: 3,
    branch: "Mathematics",
    hometown: "Patna",
    height: "5'4\"",
    looking_for: "Intellectual Connection",
    elo_rating: 1335,
    last_active: "4 hours ago",
    verified: true,
    interests: ["mathematics", "tutoring", "painting", "patterns", "logic puzzles", "art", "teaching", "philosophy"],
    photos: [
      { url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=600&fit=crop&crop=face", order: 3 }
    ],
    prompts: [
      { question: "I'm passionate about...", answer: "Finding the golden ratio in nature and translating mathematical concepts into beautiful art. Numbers have souls, and I love bringing them to life!" },
      { question: "My ideal conversation involves...", answer: "Discussing the elegance of mathematical proofs over coffee, then debating whether infinity is a number or a concept. Deep thoughts welcome!" },
      { question: "I'm looking for someone who...", answer: "Can appreciate both the beauty of a perfectly solved equation and an abstract painting. Balance is key in life and love!" }
    ]
  },
  {
    id: "10",
    user_id: "10",
    full_name: "Dev Sharma",
    age: 22,
    bio: "Information Technology student and open-source contributor. Hackathon winner, coffee connoisseur, and midnight coder. Building digital solutions for real-world problems. Let's code our love story! 💻☕❤️",
    year: 4,
    branch: "Information Technology",
    hometown: "Pune",
    height: "5'9\"",
    looking_for: "Serious Relationship",
    elo_rating: 1465,
    last_active: "30 minutes ago",
    verified: true,
    interests: ["programming", "open source", "hackathons", "coffee", "AI/ML", "web development", "gaming", "tech communities"],
    photos: [
      { url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop&crop=face", order: 1 },
      { url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=600&fit=crop&crop=face", order: 2 },
      { url: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=600&fit=crop&crop=face", order: 3 }
    ],
    prompts: [
      { question: "I geek out on...", answer: "Clean code, elegant algorithms, and the satisfaction of solving complex problems with simple solutions. Code is poetry, and I'm a poet!" },
      { question: "My perfect weekend involves...", answer: "Contributing to open-source projects, discovering new coffee shops, and maybe teaching someone to code. Sharing knowledge is caring!" },
      { question: "I'm looking for someone who...", answer: "Understands that my love language includes well-commented code and appreciates late-night debugging sessions with good company!" }
    ]
  }
];