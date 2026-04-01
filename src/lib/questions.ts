import { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'verbal',
    text: "Which word is most similar in meaning to 'Benevolent'?",
    options: ['Hostile', 'Kind', 'Reluctant', 'Ambitious'],
  },
  {
    id: 'q2',
    category: 'math',
    text: 'If a shirt costs $45 after a 25% discount, what was the original price?',
    options: ['$55', '$60', '$67.50', '$56.25'],
  },
  {
    id: 'q3',
    category: 'abstract',
    text: 'In the sequence: 2, 6, 18, 54, __, what number comes next?',
    options: ['108', '162', '72', '216'],
  },
  {
    id: 'q4',
    category: 'spatial',
    text: 'If you fold a square piece of paper in half diagonally and cut a small circle from the folded edge, how many holes appear when unfolded?',
    options: ['1', '2', '4', 'It depends on the fold'],
  },
  {
    id: 'q5',
    category: 'verbal',
    text: 'Choose the word that does NOT belong: Dog, Cat, Horse, Table',
    options: ['Dog', 'Cat', 'Horse', 'Table'],
  },
  {
    id: 'q6',
    category: 'abstract',
    text: 'If all Zips are Zaps, and some Zaps are Zops, which must be true?',
    options: [
      'All Zips are Zops',
      'Some Zips might be Zops',
      'No Zips are Zops',
      'All Zops are Zips',
    ],
  },
  {
    id: 'q7',
    category: 'math',
    text: 'A train travels 120 miles in 2 hours. What is its speed in km/h? (1 mile = 1.6 km)',
    options: ['75 km/h', '96 km/h', '120 km/h', '192 km/h'],
  },
  {
    id: 'q8',
    category: 'abstract',
    text: 'What comes next in the pattern? O, T, T, F, F, S, S, __',
    options: ['E', 'N', 'T', 'O'],
  },
  {
    id: 'q9',
    category: 'spatial',
    text: 'A cube is painted red on all sides and then cut into 27 equal smaller cubes. How many small cubes have exactly two red faces?',
    options: ['6', '8', '12', '10'],
  },
  {
    id: 'q10',
    category: 'verbal',
    text: 'Complete the analogy: Book is to Reading as Fork is to ___',
    options: ['Kitchen', 'Eating', 'Knife', 'Metal'],
  },
];
