import { QUESTIONS } from "./data/questions.js";
import { getPersonalizedFeedback } from "./data/feedback.js";
import { TERMS, BENEFITS } from "./data/premium.js";

const app = document.querySelector("#app");
const state = { answers: {}, fixedScore: 0, aiScores: {}, currentIndex: 0, locked: false };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));
}

function transitionTo(renderFn) {
  const old = app.querySelector(".screen");
  if (old) {
    old.classList.add("leaving");
    setTimeout(() => { renderFn(); app.querySelector(".screen")?.classList.add("entering"); }, 260);
  } else { renderFn(); app.querySelector(".screen")?.classList.add("entering"); }
}

function renderLanding() {
  app.innerHTML = `<section class="screen"><div class="landing-inner">
    <h1 class="brand">YURI PREMIUM™</h1>
    <p class="body-copy">You have experienced the free trial.<br>Are you ready to upgrade?</p>
    <div class="button-stack">
      <button class="choice-button" data-action="trial">Continue with Trial Version</button>
      <button class="choice-button" data-action="upgrade">Upgrade to Premium</button>
    </div>
  </div></section>`;
  app.querySelector('[data-action="trial"]').onclick = e => { e.currentTarget.classList.add("selected"); setTimeout(renderTrialEnd, 300); };
  app.querySelector('[data-action="upgrade"]').onclick = e => { e.currentTarget.classList.add("selected"); setTimeout(renderUpgradeTransition, 300); };
}

function renderTrialEnd() {
  transitionTo(() => {
    app.innerHTML = `<section class="screen"><div>
      <h1 class="heading">Oh, so you’re not ready for Premium yet?</h1>
      <p class="body-copy italic">That’s cute. Try again on Date #2.</p>
    </div></section>`;
  });
}

function renderUpgradeTransition() {
  transitionTo(() => {
    app.innerHTML = `<section class="screen start-screen"><div>
      <h1 class="transition-title">LET’S GET STARTED</h1>
      <p class="transition-note">Your answer cannot be changed once selected. Choose carefully.</p>
      <div class="loading-dots" aria-label="Loading"><span>.</span><span>.</span><span>.</span></div>
    </div></section>`;
  });
  setTimeout(() => showQuestion(0), 3100);
}

function showQuestion(index) {
  state.currentIndex = index; state.locked = false;
  const q = QUESTIONS[index];
  transitionTo(() => {
    const options = q.options.map(option => `<button class="choice-button answer-button" data-key="${option.key}">
      <span class="answer-row"><span class="answer-text">${option.key}. ${escapeHTML(option.text)}</span></span>
    </button>`).join("");
    app.innerHTML = `<section class="screen question-screen"><div class="question-wrap">
      <h1 class="question">${escapeHTML(q.question)}</h1>
      <div class="answer-list">${options}</div>
      <div id="feedback" aria-live="polite"></div>
    </div></section>`;
    app.querySelectorAll(".answer-button").forEach(button => button.onclick = () => handleAnswer(q, button.dataset.key));
  });
}

function appendHeart(button, hearts, unknown = false) {
  const row = button.querySelector(".answer-row");
  const span = document.createElement("span");
  span.className = "heart-award";
  span.textContent = unknown ? "+? ❤️" : `${hearts > 0 ? "+" : ""}${hearts} ❤️`;
  row.appendChild(span);
}

function showFeedback(text, emoji = "") {
  const container = document.querySelector("#feedback");
  if (!container || !text) return;
  container.innerHTML = `<p class="feedback feedback-enter">${escapeHTML(text)}${emoji ? ` ${emoji}` : ""}</p>`;
}

async function handleAnswer(q, key) {
  if (state.locked) return;
  state.locked = true;
  const option = q.options.find(item => item.key === key);
  const button = app.querySelector(`[data-key="${key}"]`);
  app.querySelectorAll(".answer-button").forEach(b => { b.classList.add("locked"); b.disabled = true; });
  button.classList.add("selected");

  if (option.freeText) {
    state.answers[q.id] = { key, text: option.text, freeText: true, score: null };
    renderFreeText(q, button, option);
    return;
  }

  state.answers[q.id] = { key, text: option.text, freeText: false, score: option.hearts ?? null };
  if (typeof option.hearts === "number") state.fixedScore += option.hearts;
  appendHeart(button, option.hearts);

  if (q.specialAnimation && (q.id === 3 || q.id === 8 || q.id === 10)) {
    playLargeHeart(option.hearts >= 0 ? "positive" : "negative");
  }

  const hasFeedback = Boolean(option.feedback);
  if (hasFeedback) {
    const feedbackDelay = q.specialAnimation ? 1500 : 360;
    setTimeout(() => showFeedback(option.feedback, option.emoji), feedbackDelay);
  }

  const waitAfterSelection = q.id === 9 ? 1000 : q.specialAnimation ? (q.id === 8 ? 3500 : 2500) : hasFeedback ? 2500 : 1000;
  await sleep(waitAfterSelection);
  nextQuestion();
}

function renderFreeText(q, button, option) {
  const row = button.querySelector(".answer-row");
  const prompt = document.createElement("span");
  prompt.className = "free-text-prompt";
  prompt.textContent = "";
  row.appendChild(prompt);
  const container = document.querySelector("#feedback");
  container.innerHTML = `<div class="textarea-wrap free-text-wrap">
    <textarea id="freeText" maxlength="250" placeholder="${escapeHTML(option.placeholder || "Tell me what you’d do")}" aria-label="Your answer"></textarea>
    <div class="submit-row"><button class="primary-button" id="submitFreeText">Submit</button></div>
    <p class="char-count"><span id="charCount">0</span>/250</p>
    <p class="error-message" id="textError" hidden></p>
  </div>`;
  const textarea = document.querySelector("#freeText");
  const submit = document.querySelector("#submitFreeText");
  textarea.addEventListener("input", () => { document.querySelector("#charCount").textContent = textarea.value.length; });
  textarea.focus();
  submit.onclick = async () => {
    const text = textarea.value.trim();
    const error = document.querySelector("#textError");
    if (!text) { error.hidden = false; error.textContent = "Please enter an answer."; return; }
    submit.disabled = true; textarea.disabled = true;
    try {
      // The input UI disappears immediately after submit, as locked in the UI spec.
      const scorePromise = scoreWithAI(q, text);
      textarea.closest(".free-text-wrap").classList.add("submitted");
      button.querySelector(".answer-text").textContent = `C. ${text}`;
      button.classList.add("free-text-selected");
      // Re-center the submitted answer before showing the unknown-score pop-up.
      document.querySelector(".question-wrap")?.classList.add("free-text-complete");
      // The score is intentionally hidden from the player; show the locked +? ❤️ pop-up immediately.
      appendHeart(button, null, true);

      // Move to the next question 1 second after Submit.
      // The AI score still has to resolve before leaving so the final score remains accurate.
      const submittedAt = performance.now();
      const score = await scorePromise;
      state.aiScores[q.id] = score;
      state.answers[q.id] = { key: "C", text, freeText: true, score };

      const elapsed = performance.now() - submittedAt;
      if (elapsed < 1000) await sleep(1000 - elapsed);
      nextQuestion();
    } catch (err) {
      submit.disabled = false; textarea.disabled = false;
      error.hidden = false; error.textContent = "Something went wrong. Please try again.";
      console.error(err);
    }
  };
}

async function scoreWithAI(q, answerText) {
  const response = await fetch("/api/score", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId:q.id, question:q.question, answer:answerText, min:q.ai.min, max:q.ai.max, rubric:q.ai.rubric })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.score !== "number") throw new Error(data.error || "AI scoring failed");
  return Math.max(q.ai.min, Math.min(q.ai.max, Math.round(data.score)));
}

function nextQuestion() {
  const next = state.currentIndex + 1;
  if (next >= QUESTIONS.length) renderFinalResult(); else showQuestion(next);
}

function calculateFinalScore() { return state.fixedScore + Object.values(state.aiScores).reduce((sum, score) => sum + score, 0); }

function makeHeartBalloons(count = 18) {
  const layer = document.createElement("div");
  layer.className = "heart-balloons";
  layer.setAttribute("aria-hidden", "true");
  const symbols = ["♥", "❤", "♥", "♡"];
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "balloon-heart";
    heart.textContent = symbols[i % symbols.length];
    heart.style.setProperty("--x", `${(Math.random() * 100).toFixed(1)}vw`);
    heart.style.setProperty("--delay", `${(Math.random() * 0.65).toFixed(2)}s`);
    heart.style.setProperty("--duration", `${(3.4 + Math.random() * 1.8).toFixed(2)}s`);
    heart.style.setProperty("--size", `${58 + Math.random() * 62}px`);
    heart.style.setProperty("--opacity", `${(0.38 + Math.random() * 0.48).toFixed(2)}`);
    heart.style.setProperty("--drift", `${-75 + Math.random() * 150}px`);
    heart.style.setProperty("--rotation", `${-12 + Math.random() * 24}deg`);
    layer.appendChild(heart);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 6800);
}

function playLargeHeart(type) {
  if (type === "positive") { makeHeartBalloons(18); return; }
  const layer = document.createElement("div"); layer.className = "broken-heart-layer"; layer.setAttribute("aria-hidden", "true");
  const heart = document.createElement("div"); heart.className = "broken-heart"; heart.textContent = "💔";
  layer.appendChild(heart); document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1900);
}

function renderFinalResult() {
  const finalScore = calculateFinalScore();
  const feedback = getPersonalizedFeedback(state.answers, finalScore);
  transitionTo(() => {
    app.innerHTML = `<section class="screen result-reveal-screen">
      <div class="result-reveal-content">
        <h1 class="heart-reveal">You earned <span>${finalScore}</span> ❤️</h1>
        <p class="feedback-result">${escapeHTML(feedback)}</p>
      </div>
    </section>`;
    makeHeartBalloons(18);
  });
  setTimeout(renderTermsPage, 5600);
}

function renderTermsPage() {
  transitionTo(() => {
    app.innerHTML = `<section class="screen terms-screen">
      <div class="terms-header"><h1 class="premium-brand">YURI PREMIUM™</h1><h2 class="terms-title">Terms &amp; Conditions</h2></div>
      <div class="terms-content">${TERMS.map((term, index) => `<article class="term"><h3>${String(index+1).padStart(2,"0")} — ${escapeHTML(term.title)} <span>${term.emoji}</span></h3><p>${escapeHTML(term.text)}</p></article>`).join("")}</div>
      <div class="upgrade-dock"><button class="primary-button upgrade-button" id="confirmUpgrade">UPGRADE NOW</button></div>
    </section>`;
    document.querySelector("#confirmUpgrade").onclick = async () => {
      const btn = document.querySelector("#confirmUpgrade");
      if (btn.dataset.busy) return;
      btn.dataset.busy = "1";
      await sleep(220);
      renderPremiumActivated();
    };
  });
}

function renderPremiumActivated() {
  transitionTo(() => {
    app.innerHTML = `<section class="screen success-screen">
      <div class="success-inner">
        <h1 class="success-hero">It’s official. Welcome to Yuri Premium™.</h1>
        <h2 class="privileges-title">Premium Privileges Unlocked</h2>
        <div class="benefits">${BENEFITS.map((benefit,index)=>`<article class="benefit"><h3>${String(index+1).padStart(2,"0")} — ${escapeHTML(benefit.title)}</h3><p>${escapeHTML(benefit.text)}</p></article>`).join("")}</div>
        <p class="final-kiss">You may now kiss… Yuri. 💋</p>
      </div>
    </section>`;
    // The Success Page opens with the global heart-balloon celebration.
    makeHeartBalloons(18);
  });
}

renderLanding();
