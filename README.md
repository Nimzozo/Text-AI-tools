# text-ai-tools

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Pollinations badge](https://img.shields.io/badge/Built%20with-Pollinations-8a2be2?style=for-the-badge&logoColor=white&labelColor=6a0dad)

**text-ai-tools** is a lightweight, browser-based AI toolkit for explaining, formatting, improving, and translating text — powered by the [Pollinations API](https://pollinations.ai). No installation, no build step, no backend. Just open the page and go.

👉 **[Launch the app](https://nimzozo.github.io/text-ai-tools/)**

---

## 🚀 Features

**Authentication**
- **OAuth login** — Connect with Pollinations in one click.
- **API key** — Paste a `sk_...` key as an alternative. Stored in `localStorage` only.

**Text tools**
- **Explain** — Summarize long passages into concise, digestible text.
- **Format** — Convert arbitrary text into clean Markdown.
- **Improve** — Refine clarity, grammar, tone, and organization.
- **Translate** — Translate into any language while preserving names, numbers, and technical terms.

**UX polish**
- **Streaming output** — See results appear as the model generates them.
- **Dark mode** — Toggle or auto-detect from system preferences.
- **Keyboard shortcut** — `⌘+Enter` / `Ctrl+Enter` to run.
- **Character & word counter** — Live counts with a warning near the 50,000-character limit.
- **Copy button** — One-click copy of the output.
- **Cancel button** — Abort a running request.
- **Input persistence** — Your last text, action, and target language are saved across sessions.

---

## 🔧 Usage

1. **Open** [text-ai-tools](https://nimzozo.github.io/text-ai-tools/).
2. **Connect** — Click "Connect with Pollinations" (OAuth) or paste an API key and click "Save key".
3. **Enter text** — Paste or type the text you want to process.
4. **Choose an action** — Explain, Format, Improve, or Translate. If translating, enter a target language.
5. **Run** — Click the "Run" button or press `⌘+Enter` / `Ctrl+Enter`.
6. **Copy the result** — Click "Copy" to copy the output to your clipboard.

---

## 🛠️ Run locally

No build step required. The app is a collection of static files.

```bash
# Clone the repo
git clone https://github.com/nimzozo/text-ai-tools.git
cd text-ai-tools/docs

# Serve with any static server
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## 📁 Project structure

```
docs/
├── index.html          # Main HTML page
├── style.css           # All styles (light + dark theme via CSS custom properties)
├── favicon.svg         # Favicon
└── js/
    ├── config.js       # App constants (API endpoint, storage keys, limits)
    ├── storage.js      # localStorage read/write helpers
    ├── dom.js          # DOM element references (single source of truth)
    ├── api.js          # Pollinations API client (streaming + non-streaming)
    ├── auth.js         # OAuth flow and API key management
    ├── prompts.js      # Prompt construction and output validation
    ├── ui.js           # UI helpers (error banner, theme, counters, copy)
    └── app.js          # Main app logic and event wiring
```

---

## 🧱 Tech stack

- **Language** — Vanilla JavaScript (ES modules), HTML5, CSS3
- **AI API** — [Pollinations](https://pollinations.ai)
- **Storage** — Browser `localStorage`
- **Hosting** — GitHub Pages

---

## 🤝 Contributing

Contributions are welcome! Open an issue or submit a pull request.

When contributing:
- Keep the app dependency-free (no npm, no build tools).
- Maintain the modular file structure under `docs/js/`.
- Test with both OAuth and API key auth paths.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
