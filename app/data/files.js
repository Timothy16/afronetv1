// app/data/files.js

// kind — doc | image | video | audio | folder | pdf
// sync — synced | offline | queued | shared
export const driveFiles = [
  {
    id: 'f1',
    name: 'Clinic reports',
    kind: 'folder',
    size: '18 items',
    updated: 'Today',
    sync: 'offline',
  },
  {
    id: 'f2',
    name: 'Node deployment plan.doc',
    kind: 'doc',
    size: '1.2 MB',
    updated: 'Today 08:40',
    sync: 'queued',
  },
  {
    id: 'f3',
    name: 'taraba-cohort-r2.csv',
    kind: 'doc',
    size: '840 KB',
    updated: 'Today 09:42',
    sync: 'offline',
    sharedWith: ['@amina'],
  },
  {
    id: 'f4',
    name: 'Jalingo mesh survey.pdf',
    kind: 'pdf',
    size: '4.6 MB',
    updated: 'Yesterday',
    sync: 'synced',
  },
  {
    id: 'f5',
    name: 'Soweto rushes 04.mp4',
    kind: 'video',
    size: '1.4 GB',
    updated: 'Yesterday',
    sync: 'shared',
    sharedWith: ['@thabo', '@james'],
  },
  {
    id: 'f6',
    name: 'Community node photos',
    kind: 'folder',
    size: '64 items',
    updated: 'Tue',
    sync: 'offline',
  },
  {
    id: 'f7',
    name: 'Hausa translation notes.doc',
    kind: 'doc',
    size: '220 KB',
    updated: 'Tue',
    sync: 'synced',
  },
  {
    id: 'f8',
    name: 'Field recording — market.m4a',
    kind: 'audio',
    size: '32 MB',
    updated: 'Mon',
    sync: 'offline',
  },
]

// `color` is a key the Files page maps to a swatch — brand | gold | ink | muted.
export const storage = {
  device: { used: 86.8, total: 128, label: 'Device storage' },
  afronet: { used: 4.2, total: 15, label: 'Afronet storage' },
  breakdown: [
    { label: 'AI models', value: 2.9, color: 'brand' },
    { label: 'Video & downloads', value: 41.4, color: 'gold' },
    { label: 'Files', value: 18.2, color: 'ink' },
    { label: 'Cache', value: 6.1, color: 'muted' },
  ],
}

export const transfers = [
  { id: 'tr1', name: 'clinic-report-march.pdf', peer: '@sarah', dir: 'in', pct: 100 },
  { id: 'tr2', name: 'Soweto rushes 04.mp4', peer: '@thabo', dir: 'out', pct: 62 },
  { id: 'tr3', name: 'AfroIntel Core', peer: 'Polytechnic Node', dir: 'in', pct: 78 },
]
