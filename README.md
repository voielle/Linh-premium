# Linh Premium™

A minimal, mobile-first interactive relationship-upgrade experience.

## Stack

- Vanilla HTML/CSS/JavaScript
- Cloudflare Pages
- Cloudflare Pages Functions
- Gemini API for the three free-text scoring questions

No login and no database are required.

## Project structure

```text
linh-premium/
├── index.html
├── styles.css
├── app.js
├── data/
│   ├── questions.js
│   ├── feedback.js
│   └── premium.js
├── functions/
│   └── api/
│       └── score.js
├── .gitignore
└── README.md
```

## Important: Gemini API key

Never put the Gemini API key in `app.js` or any public file.

For Cloudflare Pages:

1. Open the Cloudflare dashboard.
2. Open the Pages project.
3. Go to **Settings → Variables and Secrets**.
4. Add a production secret:
   - Name: `GEMINI_API_KEY`
   - Value: your new Gemini API key
   - Encrypt/save it as a secret.
5. Redeploy the project.

Cloudflare Pages Functions read it as `context.env.GEMINI_API_KEY`.

## Deploy with GitHub

1. Upload all files in this folder to the root of the `linh-premium` GitHub repository.
2. In Cloudflare, go to **Workers & Pages**.
3. Create a Pages project and connect the GitHub repository.
4. Select the `main` branch.
5. Because this is a static site, no framework/build command is required.
6. Deploy.
7. Add the `GEMINI_API_KEY` secret.
8. Redeploy.

Cloudflare will provide a public `*.pages.dev` URL.

## Local preview

A simple static preview can be opened from `index.html`, but the AI scoring endpoint will only work when the `/functions/api/score` function is served by Cloudflare Pages or a compatible local Pages Functions environment.

## Editing content

Most content is deliberately separated from the UI:

- `data/questions.js` — questions, options, fixed Hearts, question feedback.
- `data/feedback.js` — final feedback logic and score-range feedback.
- `data/premium.js` — Terms & Conditions and 7 Premium Benefits.

UI/interaction code is in `app.js`.
Styling is in `styles.css`.

## AI scoring

The three free-text questions are scored server-side:

- Q4: 0–10
- Q6: 0–5
- Q10: −10–10

Andre sees only `+? ❤️` for these answers. The real AI score is kept out of the browser UI and added only to the final score calculation.

The current implementation uses the stable `gemini-2.5-flash` model. Change `MODEL` in `functions/api/score.js` if you later decide to migrate to another supported Gemini model.
