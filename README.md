# AVENZAQ — Local-First AI Content Automation Workstation

> **"Your content. On autopilot."**

AVENZAQ is a premium, local-first social media content automation desktop application built with React, Vite, and TypeScript. It operates 100% locally on your machine without requiring paid API keys, cloud backends, or cloud storage.

---

## 🌟 Key Features

- 🛡️ **100% Local-First Engine**: All workspace settings, brand context, content concepts, and generated media reside securely in browser/local storage.
- ⚡ **Modular Local Content Engine**: Flexible batch concept generation (2, 5, 10, 20, 50, 100, or custom quantities).
- 🎨 **AI Image Engine & Media Pipeline**: Single & bulk image generation, style selections (*Photorealistic, Editorial, Minimal, Premium, Lifestyle, etc.*), aspect ratios (*1:1, 4:5, 16:9, 9:16*), image versioning (`v1`, `v2`, `v3`), and primary asset selection.
- 🗓️ **Content Planner & Calendar**: Visual calendar views with drag-and-drop scheduling, approval queues, and auto-scheduling algorithms.
- 🏬 **Media Library**: Asset manager with local storage path tracking (`Avenzaq/media/images/...`), pixel dimensions, version controls, and deletion safety checks.
- ⚙️ **Local Engine Status & Health Monitor**: Real-time browser storage capacity monitoring and background automation configuration.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation & Running Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/danykarten-tech/localautopost.git
   cd localautopost
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

4. **Verify Type Safety**:
   ```bash
   npx tsc --noEmit
   ```

---

## 🛠️ Technology Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Custom Design System with Dark/Light themes, glassmorphism, and responsive layouts)
- **Icons**: Lucide React (`lucide-react`)
- **State & Persistence**: LocalStorage DB Service with typed models

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
