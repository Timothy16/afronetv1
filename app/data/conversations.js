// app/data/conversations.js

export const conversations = [
  {
    id: 'c1',
    title: 'Dry season planting in Taraba',
    updated: 'Today',
    messages: [],
  },
  {
    id: 'c2',
    title: 'Translate clinic notes to Hausa',
    updated: 'Today',
    messages: [],
  },
  {
    id: 'c3',
    title: 'Solar inverter sizing for the lab',
    updated: 'Yesterday',
    messages: [],
  },
  {
    id: 'c4',
    title: 'History of the Kanem-Bornu Empire',
    updated: 'Tue',
    messages: [],
  },
  {
    id: 'c5',
    title: 'Draft supplier contract',
    updated: 'Mon',
    messages: [],
  },
]

export const suggestedPrompts = [
  'Explain the Kanem-Bornu trade routes',
  'Summarise this clinic report in Hausa',
  'Find a documentary about African cinema',
  'Send ₦20,000 to @john',
]

// AfroIntel's canned replies. The first entry whose `match` fits the prompt
// wins; `opensApp` names the app the workspace opens alongside the answer.
// source origin — local | afronet | internet
export const scriptedReplies = [
  {
    match: /(movie|film|watch|documentary|series|entertain)/i,
    body: "Here are African history titles available on this device and from nearby Afronet nodes. I've opened Afrotainment so you can browse and download while you're still offline.",
    opensApp: 'afrotainment',
    sources: [
      { label: 'Afrotainment catalogue (cached)', origin: 'local' },
      { label: 'Polytechnic Node library', origin: 'afronet' },
    ],
  },
  {
    match: /(send|pay|transfer|₦|naira|money)/i,
    body: "I've opened your Wallet with the payment prepared. No gateway is reachable right now, so the transfer will be signed on your device and released the moment Afronet finds a path.",
    opensApp: 'wallet',
    sources: [{ label: 'Wallet · signed locally', origin: 'local' }],
  },
  {
    match: /(email|mail|send.*document|sarah)/i,
    body: 'AfroMail is open with a draft addressed and the document attached. It will leave your device over the mesh and complete delivery at the next gateway.',
    opensApp: 'mail',
    sources: [{ label: 'AfroMail outbox', origin: 'local' }],
  },
  {
    match: /(file|drive|folder|document)/i,
    body: 'Your Files are open. Everything listed is stored on this device; the queued items will sync once a gateway is in reach.',
    opensApp: 'files',
  },
  {
    match: /(nearby|mesh|network|devices|connect)/i,
    body: 'You are connected to 12 devices, 4 of them directly. Afronet reach in Jalingo is good today. I have opened the network view.',
    opensApp: 'mesh',
    sources: [{ label: 'Local mesh telemetry', origin: 'local' }],
  },
]

export const defaultReply =
  "Answering from AfroIntel Lite on your device — no internet was needed. Ask me to go deeper and I'll check whether a nearby node or a gateway can add more."
