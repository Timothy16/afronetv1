// app/data/landing.js
//
// Copy for the public landing page at /. Everything here is written from the
// campus position: students first, institutions second, communities beyond
// that.
//
// The availability badges carry real weight on this page. Afronet does not
// provide free internet, and not every feature works offline everywhere, so
// each claim is tagged with what it actually needs rather than being left to
// read as a blanket promise.

export const availability = {
  available: { label: 'Available Now', icon: 'fa-circle-check', tone: 'brand' },
  devices: { label: 'Available on Supported Devices', icon: 'fa-mobile-screen', tone: 'outline' },
  local: { label: 'Requires Local Afronet Connectivity', icon: 'fa-tower-broadcast', tone: 'gold' },
  soon: { label: 'Coming Soon', icon: 'fa-clock', tone: 'dashed' },
}

// Served by this app rather than a CDN: the landing page then owns its own assets, and the
// hero is the page's largest image, so it should not wait on someone else's host.
export const images = {
  hero: '/images/landingpageHero.jpg',
  campus: '/images/campus.jpg',
}

export const hero = {
  titleLead: 'Your Digital World.',
  titleAccent: 'Even Without the Internet.',
  body:
    'Afronet brings personalised AI, student communication and digital services together in one network designed for campuses and communities across Africa.',
  imageAlt: 'Three students on campus steps sharing a phone, laptop and tablet',
  chip: 'Study model ready offline',
}

export const offlinePanel = {
  title: 'Connect once. Keep using Afronet offline.',
  body:
    'You need internet to register and set up. After that, downloaded AI models and available local Afronet services can keep working without conventional internet or mobile data — within their supported capabilities and coverage.',
  footnote:
    'Not every feature works everywhere offline. Afronet does not provide free conventional internet access.',
  rows: [
    {
      title: 'Online once',
      description: 'Register your account and download what you need while connected.',
      icon: 'fa-wifi',
    },
    {
      title: 'AI that stays with you',
      description: 'Compatible downloaded models keep working without mobile data.',
      icon: 'fa-brain',
      status: 'devices',
    },
    {
      title: 'Talk on the network',
      description: 'Messages and calls reach other Afronet users where local connectivity exists.',
      icon: 'fa-tower-broadcast',
      status: 'local',
    },
  ],
}

// The three cards from the About section. These also open the /explore
// stepper, which is why they carry their own id, icon and points.
export const benefits = [
  {
    id: 'ai',
    title: 'Personalised AI for Learning',
    description:
      'A study companion that adapts to how you learn — for revision, research and understanding difficult topics.',
    icon: 'fa-brain',
    points: [
      { text: 'AI assistance for studying, research and learning', status: 'available' },
      { text: 'Specialised African Intelligences for different disciplines' },
      { text: 'Download compatible AI models for supported offline use', status: 'devices' },
    ],
  },
  {
    id: 'communication',
    title: 'Free Campus Communication',
    description: 'Stay in touch with classmates and study groups across the Afronet network.',
    icon: 'fa-comments',
    points: [
      { text: 'Message other Afronet users' },
      { text: 'Call within the Afronet network where local connectivity is available', status: 'local' },
      { text: 'Invite classmates, friends and your campus community to join' },
    ],
  },
  {
    id: 'services',
    title: 'Campus Digital Services',
    description: 'The groundwork for everyday campus tools, built to grow with your institution.',
    icon: 'fa-wallet',
    points: [
      { text: 'A foundation for campus wallets and payments' },
      { text: 'Tools for students, institutions and participating campus merchants' },
      { text: 'An expanding ecosystem of digital services', status: 'soon' },
    ],
  },
]

export const setupSteps = [
  {
    title: 'Get Started Online',
    description: 'Register your Afronet account and complete initial setup.',
    icon: 'fa-wifi',
    requirement: 'Internet needed',
    online: true,
  },
  {
    title: 'Set Up Your Afronet',
    description: 'Download compatible AI models and required resources while you are online.',
    icon: 'fa-download',
    requirement: 'Internet needed',
    online: true,
  },
  {
    title: 'Keep Learning and Connecting',
    description:
      'Use supported offline AI and local Afronet services wherever the necessary devices and network are available.',
    icon: 'fa-link-slash',
    requirement: 'No mobile data for supported features',
    online: false,
  },
]

// The "What needs what?" table, read either down the Offline AI column or the
// calls-and-messaging one.
export const comparisonModes = [
  { id: 'ai', label: 'Offline AI', key: 'offlineAi' },
  { id: 'comms', label: 'Calls & messaging', key: 'communication' },
]

export const comparisonRows = [
  {
    label: 'Internet for first setup',
    offlineAi: 'Yes — to download models',
    communication: 'Yes — to register',
  },
  {
    label: 'Works without mobile data afterwards',
    offlineAi: 'Yes, on supported devices',
    communication: 'Yes, within Afronet coverage',
  },
  {
    label: 'Needs local Afronet network',
    offlineAi: 'No — runs on your device',
    communication: 'Yes',
  },
  {
    label: 'Needs other Afronet users',
    offlineAi: 'No',
    communication: 'Yes — both people must be on Afronet',
  },
  {
    label: 'Good for',
    offlineAi: 'Study help, explanations, research support',
    communication: 'Messages and calls with classmates',
  },
]

export const devices = [
  { name: 'Android phones', note: 'Primary mobile experience', icon: 'fa-mobile-screen' },
  { name: 'iPhones', note: 'Where supported', icon: 'fa-mobile-screen' },
  { name: 'iPads and other tablets', note: 'Larger study workspace', icon: 'fa-tablet-screen-button' },
  { name: 'Laptops', note: 'Research and long-form study', icon: 'fa-laptop' },
  { name: 'Desktop PCs', note: 'Labs, libraries and offices', icon: 'fa-desktop' },
]

export const deviceCaveat =
  'Availability and offline capabilities may differ by device and operating system.'

export const intelligence = {
  eyebrow: 'African Intelligence',
  title: 'The intelligence layer behind how you learn.',
  body:
    'African Intelligence powers personalised learning across Afronet. Specialised intelligences go deeper in the discipline you study.',
  note: 'Download compatible models while online to use them offline on supported devices.',
}

export const specialisedIntelligences = [
  { name: 'Engineering', description: 'Problem solving, formulas and design reasoning.', icon: 'fa-gear' },
  { name: 'Medicine', description: 'Study support for health sciences coursework.', icon: 'fa-stethoscope' },
  { name: 'Software', description: 'Coding help, debugging and concepts.', icon: 'fa-code' },
  { name: 'Education', description: 'Lesson planning and teaching practice.', icon: 'fa-graduation-cap' },
]

export const languagePhases = [
  {
    phase: 'Now',
    title: 'English-language experience',
    description: 'The full Afronet and African Intelligence experience is available in English.',
    status: 'available',
  },
  {
    phase: 'Next',
    title: 'African-language support',
    description: 'Navigating and using Afronet in African languages. Languages will be announced when ready.',
    status: 'soon',
  },
  {
    phase: 'Later',
    title: 'Local-language AI experiences',
    description: 'Learning with African Intelligence in the language you think in.',
    status: 'soon',
  },
]

export const languageNote = 'No release dates yet — languages will be announced when ready.'

export const campus = {
  eyebrow: 'Built for campuses',
  title: 'Designed for African Campuses. Built for Student Communities.',
  imageAlt: 'Students and a lecturer working together with laptops in a bright university library',
  points: [
    'AI-assisted learning that students can keep using after setup',
    'Local communication between students, lecturers and departments',
    'A foundation for future digital campus services',
  ],
}

// Deliberately empty: only verified Afronet partner institutions belong here.
// Until there are some, the page invites founding partners instead of
// inventing logos.
export const campuses = []

export const foundingPartner = {
  title: 'Become a Founding Campus Partner',
  body:
    'Afronet is looking for its first partner institutions to help shape personalised AI and campus communication for students.',
  points: [
    'Co-design a pilot around your students’ needs',
    'Share feedback that shapes the roadmap',
    'Be listed here once your partnership is confirmed',
  ],
}

export const institutionHighlights = [
  {
    title: 'More accessible AI-assisted learning',
    description: 'Give students study support that does not depend on constant data bundles.',
    icon: 'fa-wand-magic-sparkles',
  },
  {
    title: 'Opportunities for offline digital access',
    description: 'Downloaded models and local services extend learning beyond connected spaces.',
    icon: 'fa-link-slash',
  },
  {
    title: 'Campus communication infrastructure',
    description: 'A local network for messaging and calls between Afronet users on campus.',
    icon: 'fa-tower-broadcast',
  },
  {
    title: 'Future campus payment integrations',
    description: 'Explore wallet and payment services as they become available.',
    icon: 'fa-wallet',
  },
  {
    title: 'Digital skills for students',
    description: 'Hands-on exposure to AI tools and digital services students will use in their careers.',
    icon: 'fa-lightbulb',
  },
]

export const institutionCaveat =
  'Services available to each institution depend on the scope of its pilot or partnership.'

export const roadmapItems = [
  { title: 'African-language AI', description: 'Learning and assistance in African languages.', icon: 'fa-language' },
  {
    title: 'AI app builder and developer ecosystem',
    description: 'Tools for builders to create on top of African Intelligence.',
    icon: 'fa-cubes',
  },
  {
    title: 'Expanded campus wallet and payments',
    description: 'More ways to pay and get paid on campus.',
    icon: 'fa-wallet',
  },
  {
    title: 'Social and livestreaming experiences',
    description: 'Sharing, events and live sessions for campus communities.',
    icon: 'fa-video',
  },
  {
    title: 'Broader community network services',
    description: 'Extending Afronet beyond campuses to underserved communities.',
    icon: 'fa-circle-nodes',
  },
]

export const roadmap = {
  eyebrow: 'Future of Afronet',
  title: 'Where we’re heading next.',
  body:
    'Personalised AI, campus communication and institutions come first. These are the directions we’re building toward.',
}

export const finalCta = {
  title: 'Your Campus Can Be Part of Africa’s Next Digital Network.',
  body:
    'Start with Afronet and help bring personalised AI and connected digital experiences to your learning community.',
}

// --- how Afronet is built (replaces the partner enquiry section) --------------
// From the Model / Brain / Personal Intelligence architecture: the engine, the specialisation
// and what belongs to the user are three separate things, and only the first exists today — so
// the other two carry a Coming Soon label rather than reading as available.
export const layers = {
  eyebrow: 'How Afronet is built',
  title: 'Models, Brains and your own Intelligence.',
  body: 'Afronet keeps the engine, the specialisation and what belongs to you as three separate things — so changing one never costs you the others.',
  items: [
    {
      id: 'models',
      icon: 'fa-microchip',
      title: 'Models',
      summary: 'The engine that does the thinking.',
      detail:
        'Choose one that suits your device, and keep more than one if you want. Removing a Model frees the space without touching anything of yours.',
      status: 'devices',
    },
    {
      id: 'brains',
      icon: 'fa-brain',
      title: 'Brains',
      summary: 'The specialisation, not another engine.',
      detail:
        'African General Intelligence to begin with, then Medical, Nursing, Engineering, Software, Teaching, Journalism, Entrepreneurial and more. A Brain works with any Model it is compatible with, so changing Model never means setting your Brains up again.',
      status: 'soon',
    },
    {
      id: 'personal',
      icon: 'fa-user-shield',
      title: 'Your Personal Intelligence',
      summary: 'What makes it yours.',
      detail:
        'Profile, preferences, memories, projects and your own knowledge. Memory has a scope — everywhere, one Brain, or one project — and you can edit it, delete it or switch it off. Your African ID carries it, so it survives changing Model or device.',
      status: 'soon',
    },
  ],
  footnote:
    'Only Models are available today; Brains and Personal Intelligence are in development. Afronet does not provide free conventional internet access.',
}

// The orchestrator, described as the user experiences it rather than as a system diagram.
export const orchestrator = {
  title: 'You ask once. Afronet does the rest.',
  body: 'Behind a single question, Afronet decides which Brain should answer, checks the Model can do what is being asked, gathers the knowledge and the memory that matter, and answers — as one Intelligence rather than a set of parts.',
  steps: [
    { title: 'Chooses the Brain', description: 'The specialisation that fits what you asked.' },
    { title: 'Checks the Model', description: 'That the engine on your device can do it.' },
    { title: 'Gathers what it knows', description: 'Relevant knowledge, and only the memory that applies.' },
    { title: 'Answers', description: 'On your device, with the option to remember what you taught it.' },
  ],
}

export const partnerInterests = ['Pilot programme', 'Campus partnership', 'General enquiry']

export const newPartnerEnquiry = () => ({
  institution: '',
  contactName: '',
  email: '',
  country: '',
  interest: partnerInterests[0],
  message: '',
})

export const validatePartnerEnquiry = (values) => {
  const errors = {}
  if (!values.institution.trim()) errors.institution = 'Enter your institution’s name.'
  if (!values.contactName.trim()) errors.contactName = 'Enter your name.'
  if (!values.email.trim()) errors.email = 'Enter your work email.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  if (!values.country.trim()) errors.country = 'Enter your country.'
  return errors
}
