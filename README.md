# NDA Mock Test PWA

A distraction-free, offline-ready web app for practicing NDA exam mock tests.  
It supports **subject-wise tests** (Math, English, General Studies, Physics, Chemistry, Biology), **all-rounder tests**, configurable **marking scheme**, and saves **results locally in the browser**.

⚠️ **Disclaimer**  
This project is built **strictly for my personal use and NDA preparation**.  
The repository is **public only for GitHub Pages hosting convenience**.  
**Other usage is discouraged.**

---

## Features
- Subject-wise tests (Math, English, General Studies, Physics, Chemistry, Biology)
- All-rounder mixed tests simulating real NDA exam composition
- Randomized questions each attempt
- Configurable marking (+ for correct, − for wrong)
- Timer option (overall time or per test)
- Offline support (PWA, works after first load)
- Local result history & analytics (stored in your browser only)

---

## Live Hosting
This repo is public only for hosting via **GitHub Pages**.  
1. Go to **Settings → Pages**  
2. Set source = ~Deploy from branch~ (main, root)  
3. Wait for deployment → site available at:  
   ~https://<your-username>.github.io/nda-mock-test-pwa/~

---

## Weekly Question Updates
1. Prepare your question set (500–1000 items) in **JSON** format matching this schema:

~
[
  {
    "id": "Q1",
    "subject": "Math",
    "topic": "Algebra",
    "difficulty": 2,
    "question": "Solve for x: 3x – 7 = 11.",
    "options": ["4","5","6","7"],
    "answerIndex": 2,
    "explanation": "3x = 18 → x = 6.",
    "source": "AI"
  }
]
~

- ~subject~: One of Math, English, General Studies, Physics, Chemistry, Biology  
- ~options~: array of 4+ strings  
- ~answerIndex~: 0-based index of correct option  
- ~difficulty~: 1–5  
- ~source~: AI / Original / Reference  

2. Replace the file:  
   ~data/questions.latest.json~  
   (Keep older files as archive like ~data/questions.2025-08-20.json~ for rollback)

3. Commit and push. GitHub Pages auto-deploys.

---

## Local Development
1. Clone repo  
2. Serve locally with any static server:  
   ~python3 -m http.server 8000~  
   or  
   ~npx serve .~  
3. Open ~http://localhost:8000~

---

## Keyboard Shortcuts
- **1–6** → select option  
- **N / P** → next / previous  
- **R** → mark / unmark for review  
- **S** → submit test

---

## License
MIT — but again:  
⚠️ This is for **my personal use only**. Public visibility is solely for hosting.
