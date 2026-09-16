// app/data/network.js

// Copy for each connection mode. `tone` is a key the components map to a
// colour — brand | gold | muted — so no class names live in data.
export const modeCopy = {
  offline: {
    label: 'Offline',
    detail: 'Afronet is still working on this device',
    tone: 'muted',
  },
  afronet: {
    label: 'Connected to Afronet',
    detail: 'Internet unavailable',
    tone: 'brand',
  },
  internet: {
    label: 'Online',
    detail: 'Internet only — no Afronet peers nearby',
    tone: 'gold',
  },
  both: {
    label: 'Online',
    detail: 'Afronet + Internet',
    tone: 'brand',
  },
}

export const modeOrder = ['offline', 'afronet', 'internet', 'both']

// kind — phone | laptop | node | gateway | airship
export const meshDevices = [
  {
    id: 'd1',
    label: "Sarah's phone",
    owner: '@sarah',
    kind: 'phone',
    hops: 1,
    strength: 92,
    sharing: ['Files', 'Messages'],
  },
  {
    id: 'd2',
    label: "James' laptop",
    owner: '@james',
    kind: 'laptop',
    hops: 1,
    strength: 78,
    sharing: ['AfroIntel Pro', 'Files', 'Messages'],
  },
  {
    id: 'd3',
    label: "Zanele's phone",
    owner: '@zanele',
    kind: 'phone',
    hops: 2,
    strength: 61,
    sharing: ['Messages'],
  },
  {
    id: 'd4',
    label: 'Polytechnic Node',
    owner: 'Taraba Polytechnic',
    kind: 'node',
    hops: 2,
    strength: 84,
    sharing: ['Library', 'Learning', 'Messages'],
  },
  {
    id: 'd5',
    label: 'Jalingo Community Node',
    owner: 'Jalingo LGA',
    kind: 'node',
    hops: 3,
    strength: 47,
    sharing: ['News', 'Learning'],
  },
  {
    id: 'd6',
    label: 'Internet Gateway — Jalingo',
    owner: 'Afronet Infrastructure',
    kind: 'gateway',
    hops: 3,
    strength: 34,
    sharing: ['Sync', 'Mail'],
    phase: 'soon',
  },
  {
    id: 'd7',
    label: 'Airship Node — North East',
    owner: 'Afronet Infrastructure',
    kind: 'airship',
    hops: 4,
    strength: 0,
    sharing: ['Wide-area relay'],
    phase: 'future',
  },
]

export const aiHotspot = {
  owner: '@james',
  device: "James' laptop",
  model: 'AfroIntel Pro',
  latency: '240 ms',
  hops: 1,
}

// kind — message | wallet | network | social | system | mail | security
export const notifications = [
  {
    id: 'n1',
    app: 'Messages',
    title: 'Sarah Nwosu',
    body: 'The clinic report is ready — sending the file over Afronet now.',
    time: '2 min',
    kind: 'message',
    unread: true,
  },
  {
    id: 'n2',
    app: 'Afronet Network',
    title: '3 new devices nearby',
    body: 'Your device is now relaying for 3 people in Jalingo.',
    time: '9 min',
    kind: 'network',
    unread: true,
  },
  {
    id: 'n3',
    app: 'AfroIntel',
    title: 'AfroIntel Core is 78% downloaded',
    body: 'Resuming over Afronet from Polytechnic Node.',
    time: '14 min',
    kind: 'system',
    unread: true,
  },
  {
    id: 'n4',
    app: 'Wallet',
    title: '₦20,000 queued',
    body: 'Payment to @john will send when a gateway is reachable.',
    time: '1 h',
    kind: 'wallet',
    unread: false,
  },
  {
    id: 'n5',
    app: 'AfroMail',
    title: 'Amina Diallo',
    body: 'Re: Public health field data — 2 attachments',
    time: '3 h',
    kind: 'mail',
    unread: false,
  },
  {
    id: 'n6',
    app: 'African ID',
    title: 'New device signed in',
    body: 'Laptop · Jalingo · verified with your PIN.',
    time: 'Yesterday',
    kind: 'security',
    unread: false,
  },
  {
    id: 'n7',
    app: 'AfroSocial',
    title: 'Mary Kamau mentioned you',
    body: 'In "Dry season planting — Taraba growers".',
    time: 'Yesterday',
    kind: 'social',
    unread: false,
  },
]
