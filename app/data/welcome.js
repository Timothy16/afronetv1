// app/data/welcome.js
//
// The greeting that opens onboarding. It cycles through languages because the
// first thing Afronet should say about itself is that it expects to be spoken
// to in the language you actually think in — and because the English-only
// reality today is stated plainly on the landing page's language roadmap.

export const greetings = [
  { text: 'Oyawore!', lang: 'Dholuo' },
  { text: 'Habari ya asubuhi.', lang: 'Kiswahili' },
  { text: 'Ẹ káàárọ̀.', lang: 'Yorùbá' },
  { text: 'Sannu da zuwa.', lang: 'Hausa' },
  { text: 'Good morning.', lang: 'English' },
]

export const assistantLine =
  'I can help you plan, learn and build — in your language, even with no internet.'

export const welcomeIntro = {
  title: 'Your personal African Intelligence.',
  body: 'Talk in your language. It works offline and learns what matters to you — privately.',
}

// Heights for the little waveform beside the greeting. Fixed rather than
// random so the server and the browser draw the same bars.
export const waveform = [10, 18, 26, 14, 30, 20, 12, 24, 16, 8, 20, 12, 22, 14]
