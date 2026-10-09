// app/data/onboarding.js
//
// Copy for the screens that surround account creation. There is no model catalogue here: the
// screens read the real one from lib/llm, so they can only ever offer what the app actually
// runs, at the real sizes, for the device in front of them.
//
// Nothing on these screens claims a capability the app does not have. The first screen used to
// offer to "restore your Intelligence" from an encrypted backup; there is no backup system, and
// at that point there is no account either, so it now says what really happens.

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
