import { 
  Workspace, 
  Brand, 
  ContentItem, 
  Concept, 
  MediaItem, 
  AutomationConfig, 
  SocialAccount, 
  AIConnectionConfig, 
  ActivityItem 
} from '../../domain/models/types';

export const SEED_WORKSPACE: Workspace = {
  id: 'ws_northstar_01',
  name: 'Northstar Coffee Co.',
  businessName: 'Northstar Artisanal Coffee Roasters',
  website: 'https://northstarcoffee.co',
  industry: 'Food & Beverage / Specialty Coffee',
  isCompletedOnboarding: true,
  createdAt: '2026-10-01T08:00:00.000Z'
};

export const SEED_BRAND: Brand = {
  id: 'brand_northstar_01',
  workspaceId: 'ws_northstar_01',
  logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80',
  primaryColor: '#7C6CF2',
  secondaryColor: '#171B21',
  accentColor: '#5DA9FF',
  description: 'Northstar Coffee is an independent specialty coffee roaster dedicated to ethical sourcing, precision roasting, and elevated morning rituals.',
  targetAudience: 'Specialty coffee enthusiasts, remote professionals, home baristas, and conscious consumers aged 22-45.',
  brandTone: 'Intelligent, warm, calm, artisanal, and authentic.',
  visualStyle: 'Minimalist editorial photography, warm natural lighting, earthy ceramic textures, deep espresso tones, clean typography.',
  contentRules: [
    'Always emphasize fresh bean origin and roast date',
    'Include practical home barista tips in captions',
    'Never use hyper-salesy or aggressive promotional language',
    'Use clear calls-to-action to save or share posts'
  ]
};

export const SEED_AI_CONNECTION: AIConnectionConfig = {
  id: 'ai_conn_01',
  providerType: 'local_session',
  providerName: 'Local AI Session (Connected)',
  status: 'connected',
  modelName: 'Avenzaq Local Model 2.5',
  lastTested: 'Just now',
  environmentName: 'Mac Studio Local Workstation',
  isSessionActive: true
};

export const SEED_SOCIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'soc_insta',
    platform: 'instagram',
    platformName: 'Instagram',
    handle: '@northstarcoffee',
    status: 'connected',
    accountType: 'Business Profile',
    followerCount: '14.2k',
    connectedAt: '2026-10-01T10:00:00.000Z',
    isAvailableInPhase1: true
  },
  {
    id: 'soc_fb',
    platform: 'facebook',
    platformName: 'Facebook Page',
    status: 'not_connected',
    isAvailableInPhase1: false
  },
  {
    id: 'soc_li',
    platform: 'linkedin',
    platformName: 'LinkedIn Business',
    status: 'not_connected',
    isAvailableInPhase1: false
  },
  {
    id: 'soc_tiktok',
    platform: 'tiktok',
    platformName: 'TikTok Profile',
    status: 'not_connected',
    isAvailableInPhase1: false
  },
  {
    id: 'soc_x',
    platform: 'twitter',
    platformName: 'X (Twitter)',
    status: 'not_connected',
    isAvailableInPhase1: false
  }
];

export const SEED_AUTOMATION: AutomationConfig = {
  id: 'auto_config_01',
  workspaceId: 'ws_northstar_01',
  isEnabled: true,
  frequency: '3x per week',
  postingDays: ['Monday', 'Wednesday', 'Friday'],
  postingTime: '09:00 AM',
  contentQuantity: 5,
  approvalRequired: true,
  localModeNotice: 'Local automation runs while Avenzaq is active on your machine.'
};

export const SEED_CONCEPTS: Concept[] = [
  {
    id: 'cncpt_01',
    conceptNumber: 1,
    title: '3 Ways to Improve Your Morning Coffee',
    hook: 'Stop burning your beans! Here is why your morning cup tastes bitter.',
    captionPreview: 'The temperature of your water matters more than you think. Ideal brewing sits between 195°F and 205°F...',
    fullCaption: "The temperature of your water matters more than you think. Ideal brewing sits between 195°F and 205°F. Boil your water, let it rest for 45 seconds, then pour.\n\n3 Quick Fixes:\n1. Grind fresh right before brewing\n2. Use filtered water\n3. Maintain a 1:16 coffee-to-water ratio\n\nWhat's your current morning brewing method? Drop it in the comments! 👇",
    cta: 'Save this post for tomorrow morning!',
    hashtags: ['#SpecialtyCoffee', '#CoffeeLovers', '#MorningRitual', '#BaristaTips', '#HomeBrew'],
    contentType: 'Carousel Post',
    visualDirection: 'Macro shot of fresh espresso extraction with rich crema pouring into a clear glass cup.',
    platform: 'instagram',
    status: 'approved',
    visualUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    objective: 'Educational',
    style: 'Minimal',
    scheduledDate: '2026-10-05',
    scheduledTime: '09:00 AM'
  },
  {
    id: 'cncpt_02',
    conceptNumber: 2,
    title: 'Meet Our New Winter Blend: Aurora',
    hook: 'Dark chocolate notes meets hints of dried cranberry and toasted hazelnut.',
    captionPreview: 'Designed specifically for frosty early mornings. Sourced ethically from high-altitude farms in Huehuetenango...',
    fullCaption: "Designed specifically for frosty early mornings. Sourced ethically from high-altitude farms in Huehuetenango, Guatemala.\n\nRoasted to a medium dark profile that brings out deep caramel sweet notes without any burnt bitterness.\n\nPairs perfectly with oat milk or served straight black.",
    cta: 'Order a 12oz bag now via link in bio.',
    hashtags: ['#WinterBlend', '#SingleOrigin', '#RoasterChoice', '#GuatemalaCoffee', '#CoffeeBeans'],
    contentType: 'Single Image Post',
    visualDirection: 'Minimalist layout of dark roasted beans spilling out of a matte black coffee bag onto raw oak wood.',
    platform: 'instagram',
    status: 'scheduled',
    visualUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    objective: 'Product Promotion',
    style: 'Editorial',
    scheduledDate: '2026-10-07',
    scheduledTime: '08:30 AM'
  },
  {
    id: 'cncpt_03',
    conceptNumber: 3,
    title: 'Behind the Roast: First Crack Science',
    hook: 'Hear that distinct popping sound? That is where magic happens in roasting.',
    captionPreview: 'As heat builds inside the coffee bean, water turns to steam, creating pressure until the cell structure opens...',
    fullCaption: "As heat builds inside the coffee bean, water turns to steam, creating pressure until the cell structure opens up with an audible crack!\n\nThis is known as First Crack. It signals the beginning of sugar caramelization and delicate flavor development.\n\nTiming the dump right after first crack preserves bright citrus notes, while continuing yields rich dark cocoa notes.",
    cta: 'Follow @northstarcoffee for more coffee science!',
    hashtags: ['#BehindTheRoast', '#CoffeeScience', '#RoasteryLife', '#CraftCoffee', '#FirstCrack'],
    contentType: 'Carousel Post',
    visualDirection: 'Close-up shot of roaster viewing window revealing glowing roasted coffee beans under high heat.',
    platform: 'instagram',
    status: 'pending',
    visualUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    objective: 'Brand Awareness',
    style: 'Bold',
    scheduledDate: '2026-10-09',
    scheduledTime: '10:00 AM'
  },
  {
    id: 'cncpt_04',
    conceptNumber: 4,
    title: 'Why Freshly Ground Coffee Matters',
    hook: 'If your coffee grounds are pre-packed, you are missing 50% of the flavor.',
    captionPreview: 'Once coffee beans are ground, oxidation occurs instantly. Within 15 minutes, volatile aromatics dissipate...',
    fullCaption: "Once coffee beans are ground, oxidation occurs instantly. Within 15 minutes, volatile aromatics dissipate into the air.\n\nInvesting in even a modest hand grinder will elevate your morning cup more than a thousand-dollar espresso machine.\n\nGrind right before brewing — your taste buds will thank you.",
    cta: 'Double tap if you grind your own beans!',
    hashtags: ['#FreshGrind', '#CoffeeSecrets', '#BaristaLife', '#CoffeeAroma', '#SpecialtyCoffee'],
    contentType: 'Single Image Post',
    visualDirection: 'Artistic shot of stainless steel burr grinder with ground coffee resting on dark slate.',
    platform: 'instagram',
    status: 'pending',
    visualUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    objective: 'Educational',
    style: 'Lifestyle',
    scheduledDate: '2026-10-11',
    scheduledTime: '09:15 AM'
  },
  {
    id: 'cncpt_05',
    conceptNumber: 5,
    title: 'Cold Brew Steep Guide: 18-Hour Patience',
    hook: 'Smooth, chocolatey, low-acidity cold brew made right in your kitchen.',
    captionPreview: 'Coarse grind size, 1:8 ratio, 18 hours in the fridge. No heat, no bitter bite...',
    fullCaption: "Coarse grind size, 1:8 coffee to cold water ratio, 18 hours in the fridge.\n\nNo heat means no harsh acids extracted. Strain through fine mesh, pour over clear ice cubes, and top with oat milk foam.",
    cta: 'Save this guide for the weekend!',
    hashtags: ['#ColdBrewGuide', '#IcedCoffeeTime', '#WeekendVibes', '#HomeBarista'],
    contentType: 'Carousel Post',
    visualDirection: 'Pours of dark amber cold brew splashing over clear ice in a ribbed highball glass.',
    platform: 'instagram',
    status: 'draft',
    visualUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    objective: 'Engagement',
    style: 'Minimal',
    scheduledDate: '2026-10-13',
    scheduledTime: '11:00 AM'
  }
];

export const SEED_MEDIA: MediaItem[] = [
  {
    id: 'med_01',
    workspaceId: 'ws_northstar_01',
    name: 'Espresso_Extraction_Macro.jpg',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    category: 'generated',
    isUsed: true,
    fileSize: '2.4 MB',
    createdAt: '2026-10-01'
  },
  {
    id: 'med_02',
    workspaceId: 'ws_northstar_01',
    name: 'Roasted_Beans_Editorial.jpg',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    category: 'uploaded',
    isUsed: true,
    fileSize: '3.1 MB',
    createdAt: '2026-10-01'
  },
  {
    id: 'med_03',
    workspaceId: 'ws_northstar_01',
    name: 'Roastery_First_Crack.jpg',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    category: 'generated',
    isUsed: false,
    fileSize: '1.9 MB',
    createdAt: '2026-10-02'
  },
  {
    id: 'med_04',
    workspaceId: 'ws_northstar_01',
    name: 'Burr_Grinder_CloseUp.jpg',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    category: 'generated',
    isUsed: false,
    fileSize: '2.8 MB',
    createdAt: '2026-10-02'
  },
  {
    id: 'med_05',
    workspaceId: 'ws_northstar_01',
    name: 'Cold_Brew_Highball.jpg',
    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    category: 'uploaded',
    isUsed: true,
    fileSize: '4.0 MB',
    createdAt: '2026-10-02'
  }
];

export const SEED_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act_01',
    type: 'concept_generated',
    title: 'Batch Concepts Generated',
    description: 'Generated 5 new content concepts for Instagram under Educational theme.',
    timestamp: '10 mins ago'
  },
  {
    id: 'act_02',
    type: 'approved',
    title: 'Content Approved',
    description: 'Approved concept #1 "3 Ways to Improve Your Morning Coffee".',
    timestamp: '1 hour ago'
  },
  {
    id: 'act_03',
    type: 'scheduled',
    title: 'Local Schedule Updated',
    description: 'Scheduled "Winter Blend: Aurora" post for Oct 7 at 08:30 AM.',
    timestamp: '2 hours ago'
  },
  {
    id: 'act_04',
    type: 'account_connected',
    title: 'Instagram Connected',
    description: 'Verified local session metadata for @northstarcoffee.',
    timestamp: 'Yesterday'
  }
];
