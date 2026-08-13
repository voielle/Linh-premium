export const QUESTIONS = [
  {
    id: 1,
    topic: "Conflict",
    question: "What if I annoyed you?",
    type: "ab",
    options: [
      { key: "A", text: "I’ll tell you. We’ll figure it out.", hearts: 10, feedback: "So you do remember my words? We can surely figure it out." },
      { key: "B", text: "I’ll say nothing. But you definitely lost some credits.", hearts: -10, feedback: "That’s not fair. I’d rather fix the problem to keep my credits." }
    ]
  },
  {
    id: 2,
    topic: "Initiative",
    question: "What if we went quiet?",
    type: "ab",
    options: [
      { key: "A", text: "I’ll check on you. One little text won’t kill me.", hearts: 5, feedback: "Yes. It only cost you 5 secs. I appreciate that." },
      { key: "B", text: "I’ll leave it. You’ll come back.", hearts: 0, feedback: "What if I won’t?" }
    ]
  },
  {
    id: 3,
    topic: "Relationship structure",
    question: "What kind of relationship would you want with me?",
    type: "ab",
    specialAnimation: true,
    options: [
      { key: "A", text: "Just you and me.", hearts: 25 },
      { key: "B", text: "I’m open to an open relationship.", hearts: -25 }
    ]
  },
  {
    id: 4,
    topic: "Emotional support",
    question: "When I have a bad day, will you come for me or go for your run?",
    type: "abc",
    ai: { min: 0, max: 10, rubric: "emotional support" },
    options: [
      { key: "A", text: "I’m coming for you.", hearts: 10 },
      { key: "B", text: "Let me finish my run first.", hearts: 2 },
      { key: "C", text: "Tell me what you’d do.", freeText: true }
    ]
  },
  {
    id: 5,
    topic: "Emotional openness",
    question: "What if I asked, “Is everything okay?”",
    type: "ab",
    options: [
      { key: "A", text: "I’ll tell you. You asked for a reason.", hearts: 5, feedback: "Thank you. I’ll be there for you." },
      { key: "B", text: "I’m fine. You don’t need to know everything.", hearts: 0, feedback: "You don’t need to tell me everything, but you can tell me anything." }
    ]
  },
  {
    id: 6,
    topic: "Affection",
    question: "If I got a little clingy, how would you feel?",
    type: "abc",
    ai: { min: 0, max: 5, rubric: "affection and openness to closeness" },
    options: [
      { key: "A", text: "I’d love it. I’m a touchy person too.", hearts: 5, feedback: "Careful. You’re encouraging me." },
      { key: "B", text: "Keep it subtle. I’m not big on PDA.", hearts: 2, feedback: "Fine. Don’t ask for it later." },
      { key: "C", text: "Tell me what you’d prefer.", freeText: true }
    ]
  },
  {
    id: 7,
    topic: "Personal space / TLC",
    question: "What if I need a little “me time”?",
    type: "ab",
    options: [
      { key: "A", text: "Enjoy it. I’ll be here and wait for you.", hearts: 5 },
      { key: "B", text: "I’d rather give you some TLC.", hearts: 3 }
    ]
  },
  {
    id: 8,
    topic: "Letting Linh in",
    question: "What if I wanted to be part of your everyday life?",
    type: "ab",
    specialAnimation: true,
    options: [
      { key: "A", text: "I’d love that. Come in.", hearts: 10, feedback: "Good. I was planning to stay anyway." },
      { key: "B", text: "I like keeping my own world.", hearts: -10, feedback: "Fine. I’ll stay at the door." }
    ]
  },
  {
    id: 9,
    topic: "Effort / Gym",
    question: "What if you had a gym session planned and I wanted to see you?",
    type: "ab",
    options: [
      { key: "A", text: "I’ll make time for you.", hearts: 5 },
      { key: "B", text: "You’re coming with me.", hearts: 5 }
    ]
  },
  {
    id: 10,
    topic: "Relationship intention",
    question: "What if you started getting really attached to me?",
    type: "abc",
    ai: { min: -10, max: 10, rubric: "relationship intention and commitment" },
    specialAnimation: true,
    options: [
      { key: "A", text: "I’d want to build something real with you.", hearts: 10 },
      { key: "B", text: "I’d keep it casual.", hearts: -10 },
      { key: "C", text: "Tell me what you really want.", freeText: true }
    ]
  }
];

export function getQuestion(id) {
  return QUESTIONS.find(q => q.id === id);
}
