// app/data/explore.js
//
// The thirteen steps behind "Explore what Afronet can do".
//
// The first three are the About cards from the landing page — what Afronet
// does for a student today. The remaining ten are the wider product story,
// and the last five of those do not exist yet, which is why each step carries
// a status and the previews say so on the visual itself.

import { benefits } from '~/data/landing'

export const exploreStatuses = {
  now: { label: 'Available Now', dot: 'bg-[#0b5d3e]', chip: 'bg-[#eaf3ee] text-[#0b5d3e]' },
  soon: { label: 'Coming Soon', dot: 'bg-[#b07f15]', chip: 'bg-[#faf3e3] text-[#b07f15]' },
  future: { label: 'Future Afronet', dot: 'bg-[#8f9792]', chip: 'bg-[#f7f7f4] text-[#606863]' },
}

// Served from this project rather than an outside host: the walkthrough is part of the product,
// and an image that fails to load on a slow connection should not be someone else's CDN.
export const images = {
  // Free Calls — a family gathered around a video call
  family: '/images/free-callscreen.jpg',
  // Free Messages — an elder and his granddaughter on a phone in a village
  rural: '/images/voicenotescreen.jpg',
  // Social — students together on campus
  university: '/images/socialscreen.jpg',
  // Afronet Data Bundles — a market trader checking her phone
  business: '/images/databundlescreen.jpg',
  // Global Village — deliberately the landing page's own hero shot, so the last step of the
  // walkthrough closes on the image the visitor arrived with.
  hero: '/images/hero-afronet-wide.jpg',
}

// Content for the drawn visuals, kept here so the components stay layout only.
export const visuals = {
  ai: {
    prompt: '“Help me plan my revision for December exams”',
    chips: ['Personal', 'Teacher', 'Engineering', 'Medicine', 'Business'],
  },
  apps: ['Learning', 'Market', 'Clinic', 'Transit', 'Notes', 'Radio'],
  developers: [
    { text: '// Ask African Intelligence, offline', tone: 'comment' },
    { text: 'const reply = await afronet.ai', tone: 'code' },
    { text: ".intelligence('teacher')", tone: 'code', indent: 1 },
    { text: ".ask('Explain photosynthesis', {", tone: 'code', indent: 1 },
    { text: "language: 'sw',", tone: 'code', indent: 2 },
    { text: "route: 'node'", tone: 'code', indent: 2 },
    { text: '})', tone: 'code', indent: 1 },
  ],
  developersResult: '200 OK · 180 ms · via Afronet',
  livestream: {
    meta: 'Akoka Campus · 1,204 watching',
    title: 'Inaugural lecture: Building Africa’s networks',
  },
  media: [
    { label: 'Music', icon: 'fa-music' },
    { label: 'Film', icon: 'fa-film' },
    { label: 'Stories', icon: 'fa-book-open' },
    { label: 'Games', icon: 'fa-gamepad' },
  ],
}

// The ten product stories, in the order they are walked through.
const features = [
  {
    id: 'calls',
    title: 'Free Calls',
    status: 'now',
    icon: 'fa-phone',
    headline: 'Call family free over Afronet',
    body: 'Call other Afronet users without using mobile data whenever Afronet connectivity is available.',
    photo: images.family,
    photoAlt: 'A family laughing together on a phone call',
    chip: 'Free call · via Afronet',
  },
  {
    id: 'messages',
    title: 'Free Messages',
    status: 'now',
    icon: 'fa-comment',
    headline: 'Messages that don’t need data',
    body: 'Send texts, voice notes and photos through nearby Afronet nodes — no traditional internet or data needed.',
    photo: images.rural,
    photoAlt: 'An elder and a young woman reading a message together',
    chip: 'Voice note delivered · via Afronet',
  },
  {
    id: 'ai',
    title: 'African Intelligence',
    status: 'now',
    icon: 'fa-wand-magic-sparkles',
    headline: 'One Intelligence. Many specialists.',
    body: 'Your personal African Intelligence listens, speaks your language and works offline. Add specialised Intelligences for teaching, business, health and more.',
    visual: 'ai',
  },
  {
    id: 'apps',
    title: 'Afronet App Store',
    status: 'now',
    icon: 'fa-store',
    headline: 'Apps built for African life',
    body: 'The first African apps for learning, business and community are here. Many more are being built.',
    visual: 'apps',
  },
  {
    id: 'developers',
    title: 'AI Developer Platform',
    status: 'now',
    icon: 'fa-code',
    headline: 'Build with African Intelligence',
    body: 'Register with your African ID and build apps on Afronet’s network and African Intelligence. Early access is open.',
    visual: 'developers',
  },
  {
    id: 'livestream',
    title: 'Livestream',
    status: 'soon',
    icon: 'fa-tower-broadcast',
    headline: 'Go live to your community',
    body: 'Stream lectures, worship, sport and events to people on Afronet — without burning anyone’s data.',
    visual: 'livestream',
  },
  {
    id: 'social',
    title: 'Social',
    status: 'soon',
    icon: 'fa-users',
    headline: 'Africa’s own social network',
    body: 'Follow people, universities, businesses and communities, with posts that travel through Afronet.',
    photo: images.university,
    photoAlt: 'University students talking on campus steps',
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    status: 'soon',
    icon: 'fa-music',
    headline: 'Music, film and African stories',
    body: 'African music, video and entertainment stored on nearby nodes, so it plays smoothly without data.',
    visual: 'media',
  },
  {
    id: 'bundles',
    title: 'Afronet Data Bundles',
    status: 'soon',
    icon: 'fa-box',
    headline: 'Bundles made for how you live',
    body: 'Afronet-specific content and service packages — campus packs, market packs and family packs.',
    photo: images.business,
    photoAlt: 'A market trader using her phone',
  },
  {
    id: 'village',
    title: 'Global Village',
    status: 'future',
    icon: 'fa-globe',
    headline: 'Every African community, connected',
    body: 'The long-term vision: African communities connected through Afronet, whether or not traditional internet is available.',
    photo: images.hero,
    photoAlt: 'A young woman on her phone on a busy city street',
  },
]

// The three landing cards, reshaped into steps. Their bullet points become the
// visual, badges and all, so the caveats travel with them here too.
const benefitSteps = benefits.map((benefit) => ({
  id: benefit.id,
  title: benefit.title,
  status: 'now',
  icon: benefit.icon,
  headline: benefit.title,
  body: benefit.description,
  visual: 'points',
  points: benefit.points,
}))

export const exploreSteps = [...benefitSteps, ...features]

export const clampStep = (value) => {
  const index = Number(value)
  if (!Number.isFinite(index)) return 0
  return Math.min(Math.max(Math.trunc(index), 0), exploreSteps.length - 1)
}
