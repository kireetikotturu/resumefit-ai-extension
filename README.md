# ResumeFit AI — ATS Resume Matcher Chrome Extension

An AI-powered Chrome Extension that analyzes your resume against any job description in real time, giving you an ATS compatibility score, matched keywords, missing keywords, and AI-generated feedback — all without leaving the job listing page.

---

## Live Demo

> Select any job description text on LinkedIn or Indeed → Click "Check Score" → Get your ATS score instantly.

Backend API: [https://resumefit-ai-backend-production.up.railway.app](https://resumefit-ai-backend-production.up.railway.app)
Backend GitRepoLink: [https://github.com/kireetikotturu/resumefit-ai-backend](https://github.com/kireetikotturu/resumefit-ai-backend)

---

## What Problem Does This Solve?

Most candidates apply to jobs without knowing whether their resume will pass ATS (Applicant Tracking System) filters. Companies use ATS software to automatically reject resumes that don't match the job description keywords before a human ever reads them.

ResumeFit AI solves this by letting you instantly check your resume's ATS compatibility against any job description — directly on the job listing page — so you can improve your resume before applying.

---

## Features

- Upload resume once as PDF — stored in extension memory for the session
- Select any job description text on any website
- Floating "Check Score" button appears on text selection
- AI analyzes resume vs job description and returns:
  - ATS compatibility score (0–100)
  - Matched keywords found in both resume and JD
  - Missing keywords present in JD but absent in resume
  - AI-generated explanation of the score
- Clean light-theme popup UI with animated score ring
- Results persist across popup open/close during the session

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension UI | React 19, Vite, Tailwind CSS |
| Chrome APIs | Manifest V3, Content Scripts, Service Worker, Message Passing |
| Backend | Node.js, Express.js |
| AI Model | Groq API — LLaMA 3.3 70B Versatile |
| PDF Parsing | pdf-parse v1.1.1 |
| Deployment | Railway (backend), GitHub (version control) |

---

## Project Architecture

```
Resume-Matcher-Chrome-Extension/
│
├── src/
│   └── App.jsx              # React popup UI
│
├── public/
│   ├── manifest.json        # Chrome extension config (MV3)
│   ├── background.js        # Service worker — API calls, message handling
│   └── content.js           # Injected into websites — captures selected text
│
├── dist/                    # Built extension — loaded into Chrome
│
├── backend/
│   ├── index.js             # Express server — PDF parsing + Groq AI
│   └── package.json
│
├── vite.config.js
└── package.json
```

---

## Complete Flow — How It Works End to End

### Step 1 — User Uploads Resume (Popup)
- User opens the extension popup by clicking the Chrome toolbar icon
- Selects a PDF resume file from their computer
- `App.jsx` reads the file and converts it to Base64 using `FileReader`
- Sends a `RESUME` message to `background.js` via `chrome.runtime.sendMessage`
- `background.js` stores the Base64 string in memory for the session

### Step 2 — User Selects Job Description (Content Script)
- User navigates to any job listing (LinkedIn, Indeed, Naukri, etc.)
- User highlights/selects the job description text on the page
- `content.js` detects the `mouseup` event and checks if selected text is over 50 characters
- A floating blue "Check Score" button appears near the selected text

### Step 3 — API Call (Background Service Worker)
- User clicks "Check Score"
- `content.js` sends a `CHECK_SCORE` message to `background.js` with the selected text
- `background.js` retrieves the stored resume Base64 and sends both to the Railway backend via `fetch`
- The backend receives the request at the `/send` POST endpoint

### Step 4 — Backend Processing
- Express server receives `{ jd, base64 }` in the request body
- Strips the data URL prefix from Base64 (`data:application/pdf;base64,...`)
- Converts Base64 to a Node.js Buffer
- `pdf-parse` extracts raw text from the PDF buffer
- Constructs a prompt with resume text + job description
- Sends the prompt to Groq API using `llama-3.3-70b-versatile` model
- AI returns structured JSON with score, reason, matched_keywords, missing_keywords
- Backend cleans the response (strips any markdown fences) and parses JSON
- Returns `{ response: { score, reason, matched_keywords, missing_keywords } }`

### Step 5 — Result Display (Popup)
- `background.js` stores the result in memory
- Sends the score back to `content.js` as a response
- The floating tooltip updates to show the score (e.g. "85%") in green
- User opens the extension popup to see full results:
  - Animated SVG score ring
  - Matched and missing keyword tags
  - AI analysis paragraph

---

## Chrome Extension Architecture — Key Concepts

### Manifest V3
This extension uses Chrome's latest Manifest V3 standard. Key differences from MV2:
- Background pages replaced with **Service Workers** — they start on demand and terminate when idle
- This means variables in `background.js` can be lost between messages
- Solved by ensuring the message listener returns `true` to keep the channel open for async responses

### Three-Layer Communication
```
content.js  ←→  background.js  ←→  Railway Backend
   ↕                  ↕
(webpage)         (popup UI via
                  GET_RESULT message)
```

- `content.js` runs inside the webpage context — can read selected text, inject UI
- `background.js` is the service worker — handles API calls, stores state, bridges content ↔ popup
- `App.jsx` (popup) communicates with background via `chrome.runtime.sendMessage`

### Message Types
| Message Type | Sender | Receiver | Purpose |
|---|---|---|---|
| `RESUME` | Popup | Background | Store uploaded resume Base64 |
| `CHECK_SCORE` | Content Script | Background | Trigger API call with JD text |
| `GET_RESULT` | Popup | Background | Fetch stored result on popup open |
| `CLEAR_RESULT` | Popup | Background | Clear all stored data |

---

## Backend Implementation

### PDF Parsing
```js
const pdfParse = require("pdf-parse"); // v1.1.1
const buffer = Buffer.from(base64, "base64");
const pdfData = await pdfParse(buffer);
const resumeText = pdfData.text;
```
The PDF is never saved to disk — it lives entirely in memory as a Buffer for the duration of the request.

### AI Prompt Engineering
The prompt instructs the model to act as a strict ATS system and return only valid JSON:
```
Return ONLY this JSON with no other text:
{
  "score": 75,
  "reason": "explanation here",
  "missing_keywords": ["keyword1"],
  "matched_keywords": ["keyword2"]
}
```
Temperature is set to `0.1` for consistent, deterministic output. The response is cleaned of any markdown fences before JSON parsing.

### Why Groq?
Groq runs LLaMA models on custom LPU hardware, giving response times of 1–3 seconds for this task — fast enough for a real-time extension experience. OpenAI would work too but is slower and more expensive at this scale.

---

## Challenges and How I Fixed Them

### Challenge 1 — Wrong pdf-parse Import
**Problem:** `pdf-parse` v2.x changed its export style. Using `const { PDFParse } = require("pdf-parse")` and calling it as a class crashed on every request with `TypeError: PDFParse is not a constructor`.

**Fix:** Downgraded to `pdf-parse@1.1.1` which exports a plain async function, and used `const pdfParse = require("pdf-parse")` with `await pdfParse(buffer)`.

### Challenge 2 — MV3 Service Worker Termination
**Problem:** Manifest V3 service workers terminate after ~30 seconds of inactivity. Plain variables like `let storedResume = null` get wiped when the SW restarts, causing "Upload Resume" errors even after the user had already uploaded.

**Fix:** Added `return true` inside the message listener for async message types so Chrome keeps the channel open. For persistent storage across SW restarts, `chrome.storage.local` can be used as a further improvement.

### Challenge 3 — Backend Deployed with Wrong Files
**Problem:** The `backend/` folder was added as a git submodule inside the frontend repo. When pushed to the backend GitHub repo, Railway was reading the root `package.json` (frontend, no start script) instead of the backend one.

**Fix:** Removed the submodule reference with `git rm --cached backend`, initialized a fresh git repo inside the `backend/` folder, and pushed only the backend files to the `resumefit-ai-backend` repo. Set Railway Root Directory to empty so it reads from repo root.

### Challenge 4 — AI Returning Decimal Scores
**Problem:** Despite prompting for integers, the LLM occasionally returned scores like `0.82` instead of `82`.

**Fix:** Added a normalization function on both backend and frontend:
```js
score = score <= 1 ? Math.round(score * 100) : Math.round(score);
```

### Challenge 5 — Tooltip Race Condition
**Problem:** A 15-second timeout that showed "Server Busy" would fire even after a successful response had already arrived, overwriting the score.

**Fix:** Added a `responded` boolean flag. The timeout only updates the tooltip if `responded` is still `false` when it fires. The flag is set to `true` immediately when any response arrives.

---

## Setup and Installation

### Prerequisites
- Node.js v18+
- Groq API key from [console.groq.com](https://console.groq.com)
- Chrome browser

### Backend Setup
```bash
git clone https://github.com/kireetikotturu/resumefit-ai-backend.git
cd resumefit-ai-backend
npm install
```

Create `.env`:
```env
APIKEY=your_groq_api_key_here
PORT=4000
```

```bash
node index.js
# Server running at port 4000
```

### Extension Setup
```bash
git clone https://github.com/kireetikotturu/resumefit-ai-extension.git
cd resumefit-ai-extension
npm install
npm run build
```

Copy extension files into dist:
```bash
copy public\background.js dist\
copy public\content.js dist\
copy public\manifest.json dist\
```

Load in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select the `dist/` folder
5. Extension icon appears in Chrome toolbar

---

## Deployment

### Backend — Railway
1. Push backend code to GitHub (`resumefit-ai-backend` repo)
2. Create new project on [railway.app](https://railway.app)
3. Connect GitHub repository
4. Add environment variable: `APIKEY = your_groq_api_key`
5. Railway auto-detects Node.js and deploys
6. Get public URL from Settings → Networking

### Frontend — Chrome Extension
Chrome Extensions are not deployed to a server. The `dist/` folder IS the deployment. For public distribution:
1. Zip the `dist/` folder
2. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. One-time $5 developer registration fee
4. Submit for review (1–3 business days)

---

## Interview Talking Points

**Q: Walk me through the architecture.**
> The extension has three layers. `content.js` runs inside job listing pages and captures selected text, showing a floating button. `background.js` is the service worker that handles all API communication and state. The React popup displays results. All three communicate via Chrome's message passing API.

**Q: Why did you use a backend instead of calling Groq directly from the extension?**
> API keys cannot be safely stored in Chrome extensions — the entire extension source is visible to users. The backend keeps the API key secure as an environment variable and also handles PDF parsing, which requires Node.js server-side libraries.

**Q: What was the hardest bug to fix?**
> The pdf-parse import issue. The library changed its export style between v1 and v2, breaking silently at runtime with a `TypeError`. Combined with Railway deploying the wrong package.json because of a git submodule issue, it took systematic debugging of both the code and the deployment pipeline to fully resolve.

**Q: How does the AI scoring work?**
> I send the full resume text and job description to Groq's LLaMA 3.3 70B model with a carefully engineered prompt that instructs it to act as an ATS system and return only structured JSON. Temperature is set to 0.1 for consistent output. I also added post-processing to handle edge cases like decimal scores and markdown-wrapped JSON responses.

---

## Repositories

| Repo | Link |
|---|---|
| Frontend / Extension | [resumefit-ai-extension](https://github.com/kireetikotturu/resumefit-ai-extension) |
| Backend | [resumefit-ai-backend](https://github.com/kireetikotturu/resumefit-ai-backend) |

---

## Author

**Kireeti Kotturu**
GitHub: [kireetikotturu](https://github.com/kireetikotturu)
