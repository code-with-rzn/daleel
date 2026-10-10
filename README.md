# Daleel (دليل)

Search the Quran, hadith and scholars' views in English, Urdu, Telugu, Hindi, Arabic and Spanish. Every result is cited and links back to its source.

Daleel is a **search-and-cite tool, not a fatwa service**. It shows what the texts say and points to scholar sources. It does not make rulings. For personal questions, ask a qualified scholar.

## What it does

- **Quran search:** Arabic text, a translation in the chosen language, verse reference, and a link to quran.com.
- **Hadith search:** Bukhari and Muslim by default, with Abu Dawud, Tirmidhi, Nasa'i and Ibn Majah optional. Shows book, number, grade when the dataset provides one, the Arabic original, and a link to sunnah.com.
- **Scholars and fatwas:** one-tap searches on IslamQA, SeekersGuidance, AskImam, Darul Iftaa, IslamWeb and Dar al-Ifta (Egypt). No fatwa text is copied.
- **Translate page:** switches the interface, the Quran and hadith text, and the AI explanation to another language without searching again.
- **Questions in any of the six languages:** the language is detected from the script.
- **AI explanation (optional):** a short explanation written only from the passages found, with clickable citations (Q1, H2 and so on). Citations that do not match a passage on the page are removed.
- **Installable and offline-friendly:** works as a PWA, and cached data works offline after the first download.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS, JavaScript) |
| `manifest.json` | Makes the site installable and is used to build the Android app |
| `sw.js` | Service worker: caches the app and downloaded data |
| `icon-192.png`, `icon-512.png` | App icons |
| `worker/worker.js` | Optional Cloudflare Worker that keeps the AI key on a server |

## Run it locally

Do not open `index.html` by double-clicking it. Use a local server:

1. Install [VS Code](https://code.visualstudio.com) and the **Live Server** extension.
2. Open this folder in VS Code, right-click `index.html`, and choose **Open with Live Server**.

Or from a terminal in this folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Turn on the AI explanation

The AI is optional. Without it, search, translation and links all work.

**Testing on your own computer:** open **Settings** in the app and paste your own API key. It stays in your browser. Do not use this approach on a public site.

**Public site (recommended):** deploy the proxy so the key stays on a server.

1. In Cloudflare, go to **Workers & Pages**, then **Create**, then **Worker**, and paste in `worker/worker.js`.
2. Under **Settings**, **Variables and secrets**, add:
   - `ANTHROPIC_API_KEY` as a secret
   - `ALLOWED_ORIGIN` as your site address, for example `https://daleel.pages.dev` (no path, no trailing slash)
   - `MODEL` (optional), which defaults to `claude-haiku-5-5`
3. Copy the worker URL into `AI_ENDPOINT` near the top of the script in `index.html`.
4. Set a monthly spend limit with your AI provider and add a rate-limit rule in Cloudflare.

Never put an API key in `index.html` or commit one to Git.

## Deploy

1. Push this folder to a GitHub repository.
2. In Cloudflare, go to **Workers & Pages**, **Create**, **Pages**, **Connect to Git**, and select the repository.
3. Framework: None. Build command: empty. Output directory: `/`.

Every `git push` to `main` then redeploys the site.

## Build the Android app

The site must be live on HTTPS first.

- **Easiest:** go to pwabuilder.com, enter your site address, and choose Android.
- **Command line:** `npm i -g @bubblewrap/cli`, then `bubblewrap init --manifest=https://YOUR-SITE/manifest.json`, then `bubblewrap build`.
- To hide the browser bar inside the app, host the `assetlinks.json` file that the tool generates at `https://YOUR-SITE/.well-known/assetlinks.json`.
- Keep your signing key file and password safe, and out of Git. You need the same key for every update.
- Play Store needs a one-time developer fee, a privacy policy, and screenshots. The privacy policy should say that search text is sent to an AI service when the AI explanation is on.

## Data sources

- Quran and hadith text: the open [fawazahmed0/quran-api](https://github.com/fawazahmed0/quran-api) and [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) datasets, served through jsDelivr. Check each edition's license and attribution before launching publicly.
- Links to quran.com, sunnah.com and the scholar sites are links only. Their content is not copied.

## Known limits

- Search is keyword-based, not semantic, so loosely worded questions can return weak matches.
- Hadith numbers are assumed to match across language editions. A few may not line up, and those cards are skipped.
- Some languages may not have every hadith book. The app then shows English and says so.
- The AI explanation uses only the Quran and hadith passages shown. It has no tafsir or scholar texts, so it does not state what any school of law holds.
- The interface text in Urdu, Telugu, Hindi, Arabic and Spanish should be reviewed by native speakers.
- Have a knowledgeable person review a sample of results and AI explanations before a public launch.

## Roadmap

1. Semantic search across all six languages
2. Tafsir, so the AI can explain verses with cited commentary
3. Licensed fiqh text, so scholar views can be shown and cited directly
4. A "report a problem" button
5. Privacy policy page and Play Store release
