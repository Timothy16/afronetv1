// app/data/onboarding.js
//
// Copy for the screens that surround account creation. There is no model catalogue here: the
// screens read the real one from lib/llm, so they can only ever offer what the app actually
// runs, at the real sizes, for the device in front of them.
//
// Screens 3 to 6 are wired to the real engine: real device checks, real models, a real download.
// Screen 1 is the exception — it is the designed restore screen, UI and simulation only, with no
// backup system behind it. OnboardingIntro below is the plain-spoken alternative, kept but unused.

// --- screen 1: bring your data --------------------------------------------
// Shown to everyone. Reads as "if you have used Afronet on this phone before"
// rather than claiming to know who you are, because at this point in the flow
// there is no account yet.
//
// UI and simulation only: nothing is read from a previous install and nothing is decrypted.
export const restoreIntro = {
  title: 'Afronet',
  body: 'Your African ID holds what makes Afronet yours — your profile, your memories, your projects and the Brains you have added. Models can be swapped or removed without losing any of it, and nothing leaves this device.',
  restoringTitle: 'Restoring your African Intelligence…',
  restoringBody: 'Decrypting on this phone. You can keep using it.',
}

export const restoreItems = [
  { id: 'profile', title: 'Profile & preferences', detail: 'Languages, voice and how you like answers given', size: '1 MB' },
  { id: 'memories', title: 'Memories', detail: 'What you have asked Afronet to remember — everywhere, in one Brain, or in one project', size: '6 MB' },
  { id: 'projects', title: 'Projects', detail: 'Your ongoing work, and what each project knows', size: '5 MB' },
  { id: 'modules', title: 'Knowledge modules', detail: 'The Brains you use — Medical, Engineering, Teacher and the rest', size: '2.4 GB' },
  { id: 'knowledge', title: 'Personal knowledge', detail: 'Your own documents and notes, searchable offline', size: '36 MB' },
]

// Kept for the alternative first screen (OnboardingIntro), which states plainly what running
// the AI on your own device means. Not in the flow at the moment.
export const intro = {
  title: 'Afronet lives on this device',
  body: 'Your African Intelligence runs on this phone or computer — not on our servers. Here is what that means before you create your account.',
  points: [
    {
      id: 'on-device',
      icon: 'fa-microchip',
      title: 'The AI runs here',
      detail: 'Questions and answers are produced on this device, so it keeps working with no connection.',
    },
    {
      id: 'download',
      icon: 'fa-download',
      title: 'One download to set up',
      detail: 'After your account is created you choose an AI and download it once. It stays on the device.',
    },
    {
      id: 'chats',
      icon: 'fa-comments',
      title: 'Your chats follow you',
      detail: 'Conversations are saved on this device and synced to your account, so you can carry on elsewhere.',
    },
    {
      id: 'private',
      icon: 'fa-lock',
      title: 'Only the words you send',
      detail: 'Nothing but your conversation text ever reaches our servers. The AI itself never sends your questions anywhere.',
    },
  ],
  action: 'Continue',
}

export const deviceChecks = ['Checking this device', 'Checking free space', 'Finding the best AI']

export const deviceFit = {
  fitTitle: 'This device is a good fit',
  fitBody: 'It can run African Intelligence on its own, with no connection needed once the download is done.',
  tightTitle: 'This device can run a smaller AI',
  tightBody: 'It will work, though answers come more slowly than on a more powerful device.',
  action: 'See recommended AI',
}

export const modelChoice = {
  title: 'Choose your AI model',
  body: 'Each one answers on this device. A bigger model gives better answers and takes longer to download.',
  recommendedLabel: 'Recommended for this device',
  othersLabel: 'Other models',
  action: 'Download recommended model',
  skip: 'Skip for now — download later in chat',
}

export const modelDownload = {
  title: 'Downloading your AI',
  body: 'Keep this screen open until it finishes. Wi-Fi is faster if you have it, and mobile data works too.',
  starting: 'Starting download…',
  preparing: 'Finishing up…',
  failed: 'The download stopped',
  retry: 'Try again',
  skip: 'Continue without it',
}

export const modelReady = {
  title: 'Your AI model is ready',
  body: 'It is on this device now. Ask it anything — with or without an internet connection.',
  action: 'Start chatting now',
}

/** The chat lives here. A full page load, not a route change: see ModelReady.vue. */
export const CHAT_ROUTE = '/chat'
