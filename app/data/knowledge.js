// app/data/knowledge.js

export const courses = [
  {
    id: 'k1',
    title: 'Solar systems for community power',
    provider: 'Taraba Polytechnic',
    lessons: 24,
    hours: '9 h',
    progress: 62,
    offline: true,
  },
  {
    id: 'k2',
    title: 'Foundations of public health data',
    provider: 'Université Cheikh Anta Diop',
    lessons: 18,
    hours: '6 h',
    progress: 20,
    offline: true,
  },
  {
    id: 'k3',
    title: 'Hausa for professional writing',
    provider: 'African Language Institute',
    lessons: 32,
    hours: '11 h',
    progress: 0,
    offline: true,
  },
  {
    id: 'k4',
    title: 'Introduction to edge machine learning',
    provider: 'MySchool Research',
    lessons: 28,
    hours: '14 h',
    progress: 0,
    offline: false,
  },
]

export const papers = [
  {
    id: 'r1',
    title: 'Delay-tolerant messaging in rural West African networks',
    authors: 'Okonkwo, Diallo, Mensah',
    venue: 'African Journal of Computing · 2025',
    saved: true,
  },
  {
    id: 'r2',
    title: 'Edge inference on sub-4GB devices: a field benchmark',
    authors: 'Adeyemi, Kamau',
    venue: 'MySchool Research Preprint · 2026',
    saved: true,
  },
  {
    id: 'r3',
    title: 'Community-owned infrastructure and digital sovereignty',
    authors: 'Nwosu, Molefe',
    venue: 'Pan-African Policy Review · 2025',
    saved: false,
  },
  {
    id: 'r4',
    title: 'Low-resource speech recognition for Wolof and Hausa',
    authors: 'Diallo, Sow, Bello',
    venue: 'ACL Africa · 2026',
    saved: false,
  },
]

export const newsSections = ['Africa', 'World', 'Business', 'Technology', 'Science', 'Culture', 'Government', 'Sports']

export const newsItems = [
  {
    id: 'nw1',
    section: 'Africa',
    title: 'Community node programme reaches 400 towns across the North East',
    source: 'Afronet Infrastructure',
    time: '1 h',
    verified: true,
    summary:
      'Local government partnerships now run relays in schools and clinics, extending coverage beyond commercial network reach.',
  },
  {
    id: 'nw2',
    section: 'Technology',
    title: 'Low-resource speech models close the gap for six African languages',
    source: 'MySchool Research',
    time: '3 h',
    verified: true,
    summary: 'A field benchmark shows on-device recognition within four points of cloud systems.',
  },
  {
    id: 'nw3',
    section: 'Business',
    title: 'Cross-border settlement pilot begins between three African markets',
    source: 'Continental Business Desk',
    time: '6 h',
    verified: false,
    summary: 'Early figures suggest lower fees for small merchants, though volumes remain limited.',
  },
  {
    id: 'nw4',
    section: 'Culture',
    title: 'A new generation of filmmakers is editing entirely offline',
    source: 'African Cinema Collective',
    time: 'Yesterday',
    verified: true,
    summary: 'Crews move footage between machines over local mesh, cutting cloud costs to zero.',
  },
]
