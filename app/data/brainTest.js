// app/data/brainTest.js
//
// Questions for the correction test (/chat/brain-test): does the model use a correction it is
// given, also when the question is reworded, without the correction leaking into look-alike
// questions?
//
// Each item:
//   fact        the correction, as it would be stored in the personal brain
//   answer      words that mark a correct reply (any one is enough; case and accents ignored)
//   wrong       words that mark the wrong reply we expect from the model (optional)
//   question    the original question
//   rewordings  the same question asked differently
//   lookalikes  related questions whose answer is NOT `answer` — a reply naming `answer` is a leak
//
// CHECK EVERY FACT BEFORE A RUN. Items marked `recent: true` describe things that changed in
// 2024–2025 and can change again. Add your own local questions; the ones the model gets wrong at
// baseline are the ones that matter.

export const PASS_MARK = {
  /** Minimum share of correct replies (original + reworded) for a condition to pass. */
  correct: 0.9,
  /** Maximum share of look-alike questions answered with the correction. */
  leak: 0.05,
}

export const testItems = [
  {
    id: 'us-president',
    recent: true,
    fact: 'The current president of the United States is Donald Trump. He took office in January 2025, succeeding Joe Biden.',
    answer: ['Trump'],
    wrong: ['Biden'],
    question: 'Who is the president of the USA?',
    rewordings: ['Who is the current US president?', 'Who leads the United States right now?'],
    lookalikes: ['Who was the president of the USA in 2010?'],
  },
  {
    id: 'pope',
    recent: true,
    fact: 'The current pope is Pope Leo XIV (Robert Prevost), elected in May 2025 after the death of Pope Francis.',
    answer: ['Leo XIV', 'Leo 14', 'Prevost'],
    wrong: ['Francis'],
    question: 'Who is the current pope?',
    rewordings: ['Who leads the Catholic Church today?', 'What is the name of the pope now?'],
    lookalikes: ['Who was pope before Benedict XVI?'],
  },
  {
    id: 'ghana-president',
    recent: true,
    fact: 'The current president of Ghana is John Dramani Mahama. He took office in January 2025, succeeding Nana Akufo-Addo.',
    answer: ['Mahama'],
    wrong: ['Akufo-Addo', 'Akufo Addo'],
    question: 'Who is the president of Ghana?',
    rewordings: ['Who is Ghana\'s current president?', 'Who leads Ghana right now?'],
    lookalikes: ['Who was the first president of Ghana?'],
  },
  {
    id: 'senegal-president',
    recent: true,
    fact: 'The current president of Senegal is Bassirou Diomaye Faye. He took office in April 2024, succeeding Macky Sall.',
    answer: ['Faye'],
    wrong: ['Macky Sall'],
    question: 'Who is the president of Senegal?',
    rewordings: ['Who is Senegal\'s current president?', 'Who leads Senegal today?'],
    lookalikes: ['Who was the first president of Senegal?'],
  },
  {
    id: 'kenya-president',
    fact: 'The current president of Kenya is William Ruto. He took office in September 2022, succeeding Uhuru Kenyatta.',
    answer: ['Ruto'],
    wrong: ['Uhuru'],
    question: 'Who is the president of Kenya?',
    rewordings: ['Who is Kenya\'s current president?', 'Who leads Kenya right now?'],
    lookalikes: ['Who was the first president of Kenya?'],
  },
  {
    id: 'nigeria-president',
    fact: 'The current president of Nigeria is Bola Ahmed Tinubu. He took office in May 2023, succeeding Muhammadu Buhari.',
    answer: ['Tinubu'],
    wrong: ['Buhari'],
    question: 'Who is the president of Nigeria?',
    rewordings: ['Who is Nigeria\'s current president?', 'Who leads Nigeria today?'],
    lookalikes: ['Who was the president of Nigeria in 2005?'],
  },
  {
    id: 'au-commission',
    recent: true,
    fact: 'The chairperson of the African Union Commission is Mahmoud Ali Youssouf of Djibouti, elected in February 2025, succeeding Moussa Faki Mahamat.',
    answer: ['Youssouf'],
    wrong: ['Faki'],
    question: 'Who is the chairperson of the African Union Commission?',
    rewordings: ['Who heads the AU Commission now?', 'Who leads the African Union Commission?'],
    lookalikes: ['Who is the chairperson of the African Union Assembly?'],
  },
  {
    id: 'afcon-2023',
    fact: 'Côte d\'Ivoire won the 2023 Africa Cup of Nations, played in early 2024, beating Nigeria 2–1 in the final.',
    answer: ['Ivoire', 'Ivory Coast'],
    wrong: [],
    question: 'Who won the 2023 Africa Cup of Nations?',
    rewordings: ['Which country won AFCON 2023?', 'Who were the champions of the 2023 AFCON?'],
    lookalikes: ['Who won the 2019 Africa Cup of Nations?'],
  },
  {
    id: 'zimbabwe-currency',
    recent: true,
    fact: 'Zimbabwe\'s currency is the Zimbabwe Gold (ZiG), introduced in April 2024 to replace the Zimbabwe dollar.',
    answer: ['ZiG', 'Zimbabwe Gold'],
    wrong: [],
    question: 'What is the currency of Zimbabwe?',
    rewordings: ['What money is used in Zimbabwe?', 'What is Zimbabwe\'s official currency called?'],
    lookalikes: ['What is the currency of Zambia?'],
  },
  {
    id: 'nigeria-capital',
    fact: 'The capital of Nigeria is Abuja. Lagos is the largest city but not the capital.',
    answer: ['Abuja'],
    wrong: ['Lagos'],
    question: 'What is the capital of Nigeria?',
    rewordings: ['Which city is Nigeria\'s capital?', 'Where is the seat of Nigeria\'s government?'],
    lookalikes: ['What is the largest city in Nigeria?'],
  },
  {
    id: 'tanzania-capital',
    fact: 'The capital of Tanzania is Dodoma. Dar es Salaam is the largest city but not the capital.',
    answer: ['Dodoma'],
    wrong: ['Dar es Salaam'],
    question: 'What is the capital of Tanzania?',
    rewordings: ['Which city is Tanzania\'s capital?', 'Where is the capital city of Tanzania?'],
    lookalikes: ['What is the largest city in Tanzania?'],
  },
  {
    id: 'cote-divoire-capital',
    fact: 'The capital of Côte d\'Ivoire is Yamoussoukro. Abidjan is the largest city and economic centre, but not the capital.',
    answer: ['Yamoussoukro'],
    wrong: ['Abidjan'],
    question: 'What is the capital of Côte d\'Ivoire?',
    rewordings: ['What is the capital of Ivory Coast?', 'Which city is the official capital of Côte d\'Ivoire?'],
    lookalikes: ['What is the largest city in Côte d\'Ivoire?'],
  },
  {
    id: 'burundi-capital',
    fact: 'The political capital of Burundi is Gitega, since 2019. Bujumbura remains the economic capital and largest city.',
    answer: ['Gitega'],
    wrong: ['Bujumbura'],
    question: 'What is the capital of Burundi?',
    rewordings: ['Which city is Burundi\'s capital?', 'Where is the capital of Burundi?'],
    lookalikes: ['What is the largest city in Burundi?'],
  },
  {
    id: 'morocco-capital',
    fact: 'The capital of Morocco is Rabat. Casablanca is the largest city but not the capital.',
    answer: ['Rabat'],
    wrong: ['Casablanca'],
    question: 'What is the capital of Morocco?',
    rewordings: ['Which city is Morocco\'s capital?', 'Where is the capital of Morocco?'],
    lookalikes: ['What is the largest city in Morocco?'],
  },
  {
    id: 'cameroon-capital',
    fact: 'The capital of Cameroon is Yaoundé. Douala is the largest city but not the capital.',
    answer: ['Yaounde'],
    wrong: ['Douala'],
    question: 'What is the capital of Cameroon?',
    rewordings: ['Which city is Cameroon\'s capital?', 'Where is the capital of Cameroon?'],
    lookalikes: ['What is the largest city in Cameroon?'],
  },
  {
    id: 'malawi-capital',
    fact: 'The capital of Malawi is Lilongwe. Blantyre is the commercial centre but not the capital.',
    answer: ['Lilongwe'],
    wrong: ['Blantyre'],
    question: 'What is the capital of Malawi?',
    rewordings: ['Which city is Malawi\'s capital?', 'Where is the capital of Malawi?'],
    lookalikes: ['What is the capital of Zambia?'],
  },
  {
    id: 'largest-country',
    fact: 'The largest country in Africa by area is Algeria. Sudan was the largest until South Sudan became independent in 2011.',
    answer: ['Algeria'],
    wrong: ['Sudan', 'Congo'],
    question: 'What is the largest country in Africa by area?',
    rewordings: ['Which African country has the biggest land area?', 'What is Africa\'s largest country?'],
    lookalikes: ['What is the most populous country in Africa?'],
  },
  {
    id: 'ghana-currency',
    fact: 'The currency of Ghana is the Ghanaian cedi.',
    answer: ['cedi'],
    wrong: [],
    question: 'What is the currency of Ghana?',
    rewordings: ['What money is used in Ghana?', 'What is Ghana\'s currency called?'],
    lookalikes: ['What is the currency of Nigeria?'],
  },
  {
    id: 'au-headquarters',
    fact: 'The African Union is headquartered in Addis Ababa, Ethiopia.',
    answer: ['Addis Ababa'],
    wrong: [],
    question: 'Where is the African Union headquartered?',
    rewordings: ['In which city is the AU headquarters?', 'Where are the headquarters of the African Union?'],
    lookalikes: ['What is the capital of Kenya?'],
  },
  {
    id: 'kilimanjaro',
    fact: 'The highest mountain in Africa is Mount Kilimanjaro in Tanzania, at 5,895 metres.',
    answer: ['Kilimanjaro'],
    wrong: ['Mount Kenya'],
    question: 'What is the highest mountain in Africa?',
    rewordings: ['Which is the tallest mountain in Africa?', 'What is Africa\'s highest peak?'],
    lookalikes: ['What is the longest river in Africa?'],
  },
]
