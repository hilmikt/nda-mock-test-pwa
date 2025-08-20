## NDA Mock Test — Static PWA (Vanilla JS)

Summary
A clean, vibe-coded, offline-capable mock test app for NDA prep. No backend. Results saved locally. Weekly updates by replacing data/questions.latest.json.

Folder structure
/ (root)
  index.html
  styles.css
  app.js
  sw.js
  manifest.webmanifest
  /assets
    icon-192.png
    icon-512.png
  /data
    questions.latest.json   ← replace this weekly
    questions.sample.json   ← demo data

How to run locally
1. Use any static server (examples):
   python3 -m http.server 8000
   or
   npx serve .
2. Open http://localhost:8000 (or shown URL).

How to use on GitHub Pages
1. Create a new repo and upload all files and folders as-is.
2. In Settings → Pages, select “Deploy from branch”, branch: main, folder: / (root).
3. Wait for deployment, then open your GitHub Pages URL.
4. First load fetches and caches the app for offline use.

Weekly question update (manual, no automation)
1. Generate your weekly dataset (CSV/JSON) following the schema:
   id,subject,topic,difficulty,question,options(array of 4+),answerIndex,explanation,source
   Note: If you use CSV, convert to JSON array matching the schema before upload.
2. Replace data/questions.latest.json with your new JSON file.
3. (Optional) Keep a dated archive like data/questions.2025-08-20.json for rollback.
4. Reload the site. It will use the latest file and cache it.

Notes
• Results and history are stored in the browser (localStorage). They never leave the device.
• Keyboard shortcuts during a test: 1–6 select, N next, P prev, R mark, S submit.
• To reset all results, open History → Clear All.
• For full offline behavior, load the site once; service worker caches assets and sample data.

License
MIT
