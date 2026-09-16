// app/data/social.js

// kind — text | photo | poll | professional | event
export const feed = [
  {
    id: 's1',
    author: 'Mary Kamau',
    handle: '@marykamau',
    avatar: 'https://i.pravatar.cc/160?img=32',
    role: 'Agronomist · Nakuru',
    time: '18 min · via Afronet',
    body: 'Ran the dry-season planting calendar through AfroIntel Agriculture for three counties. The maize window shifts eleven days earlier than the printed guide. Sharing the full table in the growers community.',
    kind: 'text',
    likes: 214,
    comments: 38,
    reposts: 46,
    community: 'Taraba & Nakuru Growers',
  },
  {
    id: 's2',
    author: 'Thabo Molefe',
    handle: '@thabo',
    avatar: 'https://i.pravatar.cc/160?img=15',
    role: 'Film editor · Johannesburg',
    time: '2 h',
    body: 'Finished the grade on our short. Shot entirely in Soweto, cut on a laptop that has not seen the internet in nine days. Afronet moved every rush between three machines.',
    image: 'https://cdn.magicpatterns.com/patterns/generated-images/2c55f1ea-ad99-4fc0-8433-1f45e8387017.jpg',
    kind: 'photo',
    likes: 1840,
    comments: 122,
    reposts: 310,
  },
  {
    id: 's3',
    author: 'Amina Diallo',
    handle: '@amina',
    avatar: 'https://i.pravatar.cc/160?img=41',
    role: 'Lecturer, public health · Dakar',
    time: '5 h',
    body: 'Which African language should the next AfroIntel speech module prioritise?',
    kind: 'poll',
    likes: 402,
    comments: 96,
    reposts: 58,
    poll: [
      { option: 'Wolof', pct: 34 },
      { option: 'Amharic', pct: 27 },
      { option: 'Oromo', pct: 22 },
      { option: 'Shona', pct: 17 },
    ],
  },
  {
    id: 's4',
    author: 'Kwame Mensah',
    handle: '@kwame',
    avatar: 'https://i.pravatar.cc/160?img=59',
    role: 'Founder · Accra Textiles',
    time: '8 h',
    body: 'We now accept Afronet Wallet at both Accra stalls. Customers pay with a username, no card, no data. Settlement clears at the gateway overnight.',
    kind: 'professional',
    likes: 733,
    comments: 54,
    reposts: 128,
  },
]

export const communities = [
  { id: 'c1', name: 'Taraba & Nakuru Growers', members: '12.4k', active: true },
  { id: 'c2', name: 'African Cinema Collective', members: '88.1k', active: true },
  { id: 'c3', name: 'Frontline Health Workers', members: '31.7k', active: false },
  { id: 'c4', name: 'Offline-first Builders', members: '9.2k', active: true },
]

export const professionalProfile = {
  headline: 'Systems engineer building offline-first infrastructure',
  location: 'Jalingo, Nigeria',
  open: 'Open to consulting and research collaboration',
  skills: ['Mesh networking', 'Embedded Linux', 'Solar power systems', 'Edge AI deployment', 'Hausa · English'],
  experience: [
    {
      role: 'Systems engineer',
      org: 'Taraba Polytechnic',
      period: '2023 — present',
      detail: 'Deployed 14 campus Afronet nodes serving 6,800 students without internet dependency.',
    },
    {
      role: 'Field engineer',
      org: 'North East Rural Power',
      period: '2020 — 2023',
      detail: 'Solar microgrids and community connectivity across four local government areas.',
    },
  ],
  education: [{ school: 'Ahmadu Bello University', degree: 'B.Eng Electrical Engineering', period: '2016 — 2020' }],
  projects: [
    { name: 'Jalingo Node Programme', detail: '11 community relays, 4,200 daily devices' },
    { name: 'AfroIntel Lite on low-RAM devices', detail: 'Benchmark suite for sub-4 GB phones' },
  ],
  opportunities: [
    { role: 'Edge AI engineer', org: 'Afronet Infrastructure', location: 'Abuja · Hybrid' },
    { role: 'Network researcher', org: 'MySchool Research', location: 'Remote · Africa' },
  ],
}
