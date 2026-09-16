// app/data/apps.js

// `icon` is a key into the icon map in components/Shell/AppIcon.vue.
// `phase` — v1: live now · soon: in development · future: roadmap.
export const apps = [
  // Intelligence
  {
    id: 'ai',
    name: 'AfroIntel',
    category: 'Intelligence',
    icon: 'Sparkles',
    route: '/workspace',
    phase: 'v1',
    blurb: 'African intelligence, offline first',
    accent: 'brand',
  },
  {
    id: 'models',
    name: 'AfroIntel Center',
    category: 'Intelligence',
    icon: 'Cpu',
    route: '/intel',
    phase: 'v1',
    blurb: 'Models sized for your device',
  },
  {
    id: 'modules',
    name: 'AI Modules',
    category: 'Intelligence',
    icon: 'Blocks',
    route: '/modules',
    phase: 'v1',
    blurb: 'Medicine, law, agriculture, more',
  },
  {
    id: 'research',
    name: 'Research',
    category: 'Knowledge',
    icon: 'FlaskConical',
    route: '/research',
    phase: 'soon',
    blurb: 'Papers, references, projects',
  },

  // Communication
  {
    id: 'messages',
    name: 'Messages',
    category: 'Communication',
    icon: 'MessageSquare',
    route: '/messages',
    phase: 'v1',
    blurb: 'Mesh messaging that waits for the network',
  },
  {
    id: 'contacts',
    name: 'Contacts',
    category: 'Communication',
    icon: 'Users',
    route: '/contacts',
    phase: 'v1',
    blurb: 'See who is reachable right now',
  },
  {
    id: 'phone',
    name: 'AfroPhone',
    category: 'Communication',
    icon: 'Phone',
    route: '/phone',
    phase: 'soon',
    blurb: 'Call by @username or Afronet number',
  },
  {
    id: 'mail',
    name: 'AfroMail',
    category: 'Communication',
    icon: 'Mail',
    route: '/mail',
    phase: 'soon',
    blurb: 'Mail that syncs when a path appears',
  },

  // Network
  {
    id: 'mesh',
    name: 'Afronet Network',
    category: 'Network',
    icon: 'Radio',
    route: '/network',
    phase: 'v1',
    blurb: 'Nearby devices, nodes and reach',
  },
  {
    id: 'files',
    name: 'Files & Drive',
    category: 'Productivity',
    icon: 'FolderOpen',
    route: '/files',
    phase: 'v1',
    blurb: 'Offline files, local transfer',
  },

  // Social
  {
    id: 'social',
    name: 'AfroSocial',
    category: 'Social',
    icon: 'Globe2',
    route: '/social',
    phase: 'soon',
    blurb: 'Feed, communities, creators',
  },
  {
    id: 'professional',
    name: 'Professional',
    category: 'Social',
    icon: 'Briefcase',
    route: '/professional',
    phase: 'soon',
    blurb: 'Work, skills and opportunities',
  },

  // Entertainment
  {
    id: 'afrotainment',
    name: 'Afrotainment',
    category: 'Entertainment',
    icon: 'Play',
    route: '/afrotainment',
    phase: 'soon',
    blurb: 'Cinema, series, shorts, music',
  },

  // Commerce
  {
    id: 'wallet',
    name: 'Wallet',
    category: 'Commerce',
    icon: 'Wallet',
    route: '/wallet',
    phase: 'soon',
    blurb: 'Pay anyone with an African ID',
  },
  {
    id: 'market',
    name: 'Marketplace',
    category: 'Commerce',
    icon: 'Store',
    route: '/marketplace',
    phase: 'soon',
    blurb: 'Buy, sell, discover businesses',
  },

  // Knowledge
  {
    id: 'learning',
    name: 'Learning',
    category: 'Knowledge',
    icon: 'GraduationCap',
    route: '/learning',
    phase: 'soon',
    blurb: 'Courses with an offline tutor',
  },
  {
    id: 'news',
    name: 'News',
    category: 'Knowledge',
    icon: 'Newspaper',
    route: '/news',
    phase: 'soon',
    blurb: 'Africa first, verified sources',
  },
  {
    id: 'settings',
    name: 'Settings',
    category: 'System',
    icon: 'Settings',
    route: '/settings',
    phase: 'v1',
    blurb: 'Identity, network, models, privacy',
  },
]

export const appCategories = [
  'Intelligence',
  'Communication',
  'Social',
  'Entertainment',
  'Commerce',
  'Productivity',
  'Knowledge',
  'Network',
  'System',
]

export const defaultPinned = ['ai', 'messages', 'mesh', 'files', 'mail', 'afrotainment', 'wallet']

export function findApp(id) {
  return apps.find((a) => a.id === id)
}
