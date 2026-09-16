// app/data/media.js

const P = {
  hero: 'https://cdn.magicpatterns.com/patterns/generated-images/952dc024-e4a2-4fa6-85d3-18f3d6e3b621.jpg',
  history: 'https://cdn.magicpatterns.com/patterns/generated-images/c9a44431-2eb2-4081-9304-6898bfe89e21.jpg',
  city: 'https://cdn.magicpatterns.com/patterns/generated-images/23dac095-48e6-4164-bf18-114a77b30454.jpg',
  lab: 'https://cdn.magicpatterns.com/patterns/generated-images/6d684ce8-c0ac-4cd6-83d3-8d54c061225b.jpg',
  wildlife: 'https://cdn.magicpatterns.com/patterns/generated-images/c3d6e2ad-5ffc-4e40-a30e-bf16e459add9.jpg',
  music: 'https://cdn.magicpatterns.com/patterns/generated-images/c7269f6b-baf4-4066-a279-1f7a2318ac02.jpg',
  drama: 'https://cdn.magicpatterns.com/patterns/generated-images/90cf807d-0cb0-4a0b-a06a-300b8ec11001.jpg',
  kids: 'https://cdn.magicpatterns.com/patterns/generated-images/31bb9266-4bbe-484a-bb5a-30af1b8c6abd.jpg',
  short: 'https://cdn.magicpatterns.com/patterns/generated-images/6208b85a-8756-4a46-94d8-8cecd1a5f304.jpg',
}

export const heroImage = P.hero
export const shortImage = P.short

// kind — Film | Series | Documentary | Short
export const featured = {
  id: 'ft1',
  name: 'The Long Dry',
  kind: 'Film',
  year: 2026,
  country: 'Nigeria',
  duration: '1 h 54 m',
  genres: ['Drama', 'Historical'],
  synopsis:
    'A cartographer walks the old salt routes to settle a debt her grandmother left behind, and finds the map she was given is a century out of date.',
  poster: P.hero,
  downloaded: true,
}

export const titles = [
  {
    id: 'm1',
    name: 'Keepers of the Word',
    kind: 'Documentary',
    year: 2025,
    country: 'Mali',
    duration: '1 h 22 m',
    genres: ['History', 'Culture'],
    synopsis: 'Four griots carry eight hundred years of record in memory alone.',
    poster: P.history,
    progress: 46,
    downloaded: true,
  },
  {
    id: 'm2',
    name: 'Night Market',
    kind: 'Series',
    year: 2026,
    country: 'Nigeria',
    duration: '6 episodes',
    genres: ['Thriller'],
    synopsis: 'A Lagos courier learns the parcels she moves are not what the ledger says.',
    poster: P.city,
    progress: 12,
  },
  {
    id: 'm3',
    name: 'Current',
    kind: 'Film',
    year: 2026,
    country: 'Rwanda',
    duration: '1 h 38 m',
    genres: ['Drama', 'Science'],
    synopsis: 'An engineer wires a village to the sun and to each other.',
    poster: P.lab,
    downloaded: true,
  },
  {
    id: 'm4',
    name: 'Delta at Dawn',
    kind: 'Documentary',
    year: 2025,
    country: 'Botswana',
    duration: '58 m',
    genres: ['Nature'],
    synopsis: 'One flood season across the Okavango, filmed by the people who live in it.',
    poster: P.wildlife,
  },
  {
    id: 'm5',
    name: 'Brass & Bone',
    kind: 'Documentary',
    year: 2026,
    country: 'Ghana',
    duration: '1 h 12 m',
    genres: ['Music'],
    synopsis: 'The horn sections that built highlife, and the clubs that kept them alive.',
    poster: P.music,
  },
  {
    id: 'm6',
    name: 'The Veranda',
    kind: 'Series',
    year: 2026,
    country: 'Kenya',
    duration: '8 episodes',
    genres: ['Family drama'],
    synopsis: 'Three generations, one house, and a decision nobody wants to make first.',
    poster: P.drama,
    progress: 78,
  },
  {
    id: 'm7',
    name: 'Tortoise & Tumelo',
    kind: 'Series',
    year: 2026,
    country: 'South Africa',
    duration: '20 episodes',
    genres: ['Kids'],
    synopsis: 'A girl and a very slow friend solve very fast problems.',
    poster: P.kids,
    downloaded: true,
  },
]

export const rows = [
  { id: 'r1', label: 'Continue watching', items: ['m1', 'm2', 'm6'] },
  { id: 'r2', label: 'African cinema', items: ['m3', 'm2', 'm1', 'm6'] },
  { id: 'r3', label: 'Documentaries', items: ['m1', 'm4', 'm5'] },
  { id: 'r4', label: 'Available offline near you', items: ['m3', 'm7', 'm1'] },
  { id: 'r5', label: 'Kids', items: ['m7', 'm4'] },
]

export const shorts = [
  {
    id: 'sh1',
    creator: '@suyaboys',
    caption: 'The 2 a.m. suya rush in Jos. Sound on.',
    likes: '48.2k',
    comments: '1,204',
    saves: '9,118',
    music: 'Original audio · @suyaboys',
    image: P.short,
  },
  {
    id: 'sh2',
    creator: '@zanele',
    caption: 'Teaching fractions with bottle caps. Works every time.',
    likes: '112k',
    comments: '3,410',
    saves: '28.6k',
    music: 'Amapiano loop · @dj.thato',
    image: P.kids,
  },
  {
    id: 'sh3',
    creator: '@jalingosolar',
    caption: 'Panel up in 9 minutes. Whole clinic back online.',
    likes: '22.9k',
    comments: '806',
    saves: '4,502',
    music: 'Original audio · @jalingosolar',
    image: P.lab,
  },
]

export function titleById(id) {
  return titles.find((t) => t.id === id)
}
