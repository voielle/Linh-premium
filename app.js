import { QUESTIONS } from "./data/questions.js";
import { getPersonalizedFeedback } from "./data/feedback.js";
import { TERMS, BENEFITS } from "./data/premium.js";

const app = document.querySelector("#app");
const state = {
  answers: {},
  fixedScore: 0,
  aiScores: {},
  currentIndex: 0,
  locked: false
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function escapeHTML(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function transitionTo(renderFn, { delay = 0 } = {}) {
  const old = app.querySelector(".screen");
  if (old) old.classList.add("leaving");
  setTimeout(() => {
    renderFn();
    const next = app.querySelector(".screen");
    next?.classList.add("entering");
  }, old ? 260 : delay);
}

function renderLanding() {
  app.innerHTML = `
    <section class="screen">
      <div>
        <h1 class="brand">LINH PREMIUM</h1>
        <p class="body-copy">You have experienced the free trial.<br>Are you ready to upgrade?</p>
        <div class="button-stack">
          <button class="choice-button" data-action="trial">Continue with Trial Version</button>
          <button class="choice-button" data-action="upgrade">Upgrade to Premium</button>
        </div>
      </div>
    </section>
  `;
  app.querySelector('[data-action="trial"]').onclick = () => {
    const btn = app.querySelector('[data-action="trial"]');
    btn.classList.add("selected");
    setTimeout(renderTrialEnd, 300);
  };
  app.querySelector('[data-action="upgrade"]').onclick = () => {
    const btn = app.querySelector('[data-action="upgrade"]');
    btn.classList.add("selected");
    setTimeout(renderUpgradeTransition, 300);
  };
}

function renderTrialEnd() {
  transitionTo(() => {
    app.innerHTML = `
      <section class="screen">
        <div>
          <h1 class="heading">Oh, so you’re not ready for Premium yet?</h1>
          <p class="body-copy italic">That’s cute. Try again on Date #2.</p>
        </div>
      </section>
    `;
  });
}

function renderUpgradeTransition() {
  transitionTo(() => {
    app.innerHTML = `
      <section class="screen">
        <div>
          <h1 class="transition-title">START UPGRADE PROCESS</h1>
          <p class="transition-note">Your answer cannot be changed once selected. Choose carefully.</p>
        </div>
      </section>
    `;
  });
  setTimeout(() => showQuestion(0), 3300);
}

function showQuestion(index) {
  state.currentIndex = index;
  state.locked = false;
  const q = QUESTIONS[index];

  transitionTo(() => {
    const options = q.options.map(option => `
      <button class="choice-button" data-key="${option.key}">
        <span class="answer-row">
          <span>${option.key}. ${escapeHTML(option.text)}</span>
        </span>
      </button>
    `).join("");

    app.innerHTML = `
      <section class="screen">
        <div class="question-wrap">
          <h1 class="question">${escapeHTML(q.question)}</h1>
          <div class="answer-list">${options}</div>
          <div id="feedback"></div>
        </div>
      </section>
    `;

    app.querySelectorAll(".choice-button").forEach(button => {
      button.onclick = () => handleAnswer(q, button.dataset.key);
    });
  });
}

async function handleAnswer(q, key) {
  if (state.locked) return;
  state.locked = true;

  const option = q.options.find(item => item.key === key);
  const button = app.querySelector(`[data-key="${key}"]`);
  app.querySelectorAll(".choice-button").forEach(b => {
    b.classList.add("locked");
    b.disabled = true;
  });
  button.classList.add("selected");

  state.answers[q.id] = {
    key,
    text: option.text,
    freeText: false,
    score: option.hearts ?? null
  };

  if (option.freeText) {
    renderFreeText(q, button);
    return;
  }

  if (typeof option.hearts === "number") {
    state.fixedScore += option.hearts;
    appendHeart(button, option.hearts);
  }

  if (option.feedback) {
    showFeedback(option.feedback);
  }

  if (q.specialAnimation) {
    playHeartAnimation(option.hearts);
  }

  await sleep(3000);
  nextQuestion();
}

function appendHeart(button, heartsText) {
  const row = button.querySelector(".answer-row");
  const span = document.createElement("span");
  span.className = "heart-award";
  span.textContent = `${heartsText > 0 ? "+" : ""}${heartsText} ❤️`;
  row.appendChild(span);
}

function showFeedback(text) {
  const container = document.querySelector("#feedback");
  if (!container) return;
  container.innerHTML = `<p class="feedback">${escapeHTML(text)}</p>`;
}

function playHeartAnimation(score) {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.position = "fixed";
  el.style.left = "50%";
  el.style.top = "50%";
  el.style.transform = "translate(-50%, -50%)";
  el.style.zIndex = "10";
  el.style.font = '400 90px/1 var(--serif)';
  el.style.color = score >= 0 ? "var(--burgundy)" : "var(--black)";
  el.textContent = score >= 0 ? "❤️" : "💔";
  el.style.transition = "transform .75s ease, opacity .75s ease";
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = score >= 0
      ? "translate(-50%, -50%) scale(.25) translateY(-240px)"
      : "translate(-50%, -50%) scale(1.15)";
    el.style.opacity = "0";
  });
  setTimeout(() => el.remove(), 800);
}

function renderFreeText(q, button) {
  button.querySelector(".answer-row").insertAdjacentHTML(
    "beforeend",
    `<span class="heart-award">+? ❤️</span>`
  );

  const container = document.querySelector("#feedback");
  container.innerHTML = `
    <div class="textarea-wrap">
      <textarea id="freeText" maxlength="1200" placeholder="Type your answer..." aria-label="Your answer"></textarea>
      <div class="submit-row">
        <button class="primary-button" id="submitFreeText">Submit</button>
      </div>
      <p class="error-message" id="textError" hidden></p>
    </div>
  `;

  document.querySelector("#submitFreeText").onclick = async () => {
    const textarea = document.querySelector("#freeText");
    const text = textarea.value.trim();
    const error = document.querySelector("#textError");

    if (!text) {
      error.hidden = false;
      error.textContent = "Please enter an answer.";
      return;
    }

    textarea.disabled = true;
    document.querySelector("#submitFreeText").disabled = true;

    try {
      const score = await scoreWithAI(q, text);
      state.aiScores[q.id] = score;
      state.answers[q.id] = {
        key: q.options.find(o => o.freeText).key,
        text,
        freeText: true,
        score
      };
      if (q.id === 10 && q.specialAnimation) playHeartAnimation(score);
      await sleep(3000);
      nextQuestion();
    } catch (err) {
      textarea.disabled = false;
      document.querySelector("#submitFreeText").disabled = false;
      error.hidden = false;
      error.textContent = "Something went wrong. Please try again.";
      console.error(err);
    }
  };
}

async function scoreWithAI(q, answerText) {
  const response = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionId: q.id,
      question: q.question,
      answer: answerText,
      min: q.ai.min,
      max: q.ai.max,
      rubric: q.ai.rubric
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.score !== "number") {
    throw new Error(data.error || "AI scoring failed");
  }

  return Math.max(q.ai.min, Math.min(q.ai.max, Math.round(data.score)));
}

function nextQuestion() {
  const next = state.currentIndex + 1;
  if (next >= QUESTIONS.length) {
    renderFinalResult();
  } else {
    showQuestion(next);
  }
}

function calculateFinalScore() {
  return state.fixedScore + Object.values(state.aiScores).reduce((sum, score) => sum + score, 0);
}

function renderFinalResult() {
  const finalScore = calculateFinalScore();
  const feedback = getPersonalizedFeedback(state.answers, finalScore);

  transitionTo(() => {
    app.innerHTML = `
      <section class="screen result-page">
        <div class="result-section">
          <h1 class="heart-reveal">You earned ${finalScore} ❤️</h1>
          <p class="feedback-result">${escapeHTML(feedback)}</p>
        </div>

        <div class="result-section">
          <h2 class="section-title">LINH PREMIUM™<br>Terms &amp; Conditions</h2>
          <div class="terms">
            ${TERMS.map((term, index) => `
              <article class="term">
                <h3>${String(index + 1).padStart(2, "0")} — ${escapeHTML(term.title)}</h3>
                <p>${escapeHTML(term.text)}</p>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="confirm-wrap">
          <button class="primary-button" id="confirmUpgrade">Confirm your upgrade</button>
        </div>
      </section>
    `;
    document.querySelector("#confirmUpgrade").onclick = () => {
      const btn = document.querySelector("#confirmUpgrade");
      btn.classList.add("selected");
      setTimeout(renderPremiumActivated, 350);
    };
  });
}

function renderPremiumActivated() {
  transitionTo(() => {
    app.innerHTML = `
      <section class="screen result-page">
        <div class="result-section">
          <h1 class="heading">It’s official. Welcome to Linh Premium™.</h1>
        </div>

        <div class="result-section">
          <h2 class="section-title">7 Premium Benefits</h2>
          <div class="benefits">
            ${BENEFITS.map((benefit, index) => `
              <article class="benefit">
                <h3>${String(index + 1).padStart(2, "0")} — ${escapeHTML(benefit.title)}</h3>
                <p>${escapeHTML(benefit.text)}</p>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="result-section final-screen">
          <p class="final-kiss-sub">You may now kiss…</p>
          <h1 class="final-kiss">Linh.</h1>
        </div>
      </section>
    `;
  });
}

renderLanding();
