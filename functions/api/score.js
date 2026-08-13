const MODEL = "gemini-2.5-flash";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.GEMINI_API_KEY) {
    return json({ error: "GEMINI_API_KEY is not configured." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const { questionId, question, answer, min, max, rubric } = body;

  if (
    typeof questionId !== "number" ||
    typeof question !== "string" ||
    typeof answer !== "string" ||
    typeof min !== "number" ||
    typeof max !== "number" ||
    typeof rubric !== "string"
  ) {
    return json({ error: "Missing or invalid scoring fields." }, 400);
  }

  if (!answer.trim() || answer.length > 1200) {
    return json({ error: "Answer is empty or too long." }, 400);
  }

  const systemInstruction = `
You are scoring one answer in a private relationship game called Linh Premium™.

Your job is ONLY to return an integer score. Do not write feedback, advice, explanation, or commentary.

Important:
- Score the meaning and relationship signal of the answer, not English grammar, spelling, sophistication, or length.
- Do not reward romantic-sounding language unless the underlying intention is actually supportive, affectionate, or committed.
- Do not penalize imperfect English.
- Be consistent and conservative.
- Return an integer within the exact inclusive range ${min} to ${max}.
- The answer is written by Andre to Linh.
- Rubric: ${rubric}

Scoring guidance:
For emotional support (0–10):
0–2 = little effort, avoidance, or clearly prioritizes self over Linh's need.
3–4 = some concern but mostly passive.
5–6 = reasonable, balanced support.
7–8 = proactive, caring, willing to show up.
9–10 = especially thoughtful, emotionally attentive, and makes Linh feel cared for.

For affection (0–5):
0 = rejects or strongly avoids affection.
1–2 = limited comfort with closeness.
3 = neutral or conditional openness.
4 = clearly comfortable with affection.
5 = warm, enthusiastic, reciprocal affection.

For relationship intention (-10–10):
-10 = clearly casual, avoids commitment, or explicitly incompatible with a serious relationship.
-5 to -1 = hesitant, low commitment, or strongly uncertain.
0 = genuinely unclear.
1 to 5 = positive interest but cautious.
6 to 9 = clearly wants to build something meaningful.
10 = explicit desire for a serious, committed relationship with Linh.
`;

  const prompt = `
Question ${questionId}: ${question}

Andre's answer:
"""${answer.trim()}"""

Return JSON only in this shape:
{"score": <integer>}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const geminiResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" }
          },
          required: ["score"]
        },
        temperature: 0
      }
    })
  });

  const raw = await geminiResponse.text();

  if (!geminiResponse.ok) {
    console.error("Gemini error:", raw);
    return json({ error: "AI scoring request failed." }, 502);
  }

  let parsed;
  try {
    const payload = JSON.parse(raw);
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    parsed = JSON.parse(text);
  } catch {
    console.error("Gemini parse error:", raw);
    return json({ error: "AI returned an invalid score." }, 502);
  }

  const score = Number(parsed?.score);
  if (!Number.isInteger(score) || score < min || score > max) {
    return json({ error: "AI returned an out-of-range score." }, 502);
  }

  return json({ score });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
