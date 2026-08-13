export const SCORE_FEEDBACK = [
  { min: -58, max: -21, text: "Hmm… I think you might need to try a little harder with me." },
  { min: -20, max: 0, text: "You’re not quite there yet, but I’ll give you another chance." },
  { min: 1, max: 25, text: "You’re off to a decent start. I’m curious to see what comes next." },
  { min: 26, max: 50, text: "I’m liking what I see. Keep it up." },
  { min: 51, max: 80, text: "I’m impressed. You’re making this Premium thing look pretty promising." },
  { min: 81, max: 115, text: "Well, look at you. You’re making it very hard for me to say no." }
];

export function getPersonalizedFeedback(answers, score) {
  // Critical patterns intentionally take priority over score ranges.
  const q3 = answers[3]?.key;
  const q8 = answers[8]?.key;
  const q10 = answers[10]?.key;

  if (q3 === "A" && q8 === "A" && q10 === "A") {
    return "Well, someone seems pretty serious about keeping me around.";
  }

  const independentSignal =
    score > 0 &&
    (q8 === "B" || q7IsIndependent(answers));

  if (independentSignal && q10 !== "B" && !(q3 === "A" && q8 === "A" && q10 === "A")) {
    return "You like having me around, but you’re not giving up your own space. I can respect that. Maybe with time, we’ll grow closer.";
  }

  const q10Text = answers[10]?.text || "";
  if (score >= 26 && (q10 === "C" || isUnclearIntent(q10Text))) {
    return "I think you like having me around. Now I’m curious where you want this to go.";
  }

  if ((q3 === "B" || q10 === "B") && (q3 === "B" || q10 === "B" || q8 === "B")) {
    return "I like having you around, but I’m not sure we’re looking for the same thing. That’s something worth talking about.";
  }

  const match = SCORE_FEEDBACK.find(item => score >= item.min && score <= item.max);
  return match?.text ?? "I’m curious to see what comes next.";
}

function q7IsIndependent(answers) {
  return answers[7]?.key === "A";
}

function isUnclearIntent(text) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const uncertain = ["not sure", "maybe", "see where", "go with the flow", "let's see", "don't know", "unsure"];
  return uncertain.some(term => normalized.includes(term));
}
