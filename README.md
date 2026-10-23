# ⚡ Neon Rush

An exhilarating, high-speed 2D cyber endless runner game built with **React 19**, **TypeScript**, **HTML5 Canvas**, **Tailwind CSS v4**, and the **Web Audio API**.

![Neon Rush](https://raw.githubusercontent.com/PrasadJakkula/Neon-Rush/main/preview.png)

---

## 🎮 Features

- **High-Performance 60 FPS Engine**: Custom HTML5 Canvas rendering engine with crisp retina display scaling (`devicePixelRatio`).
- **Dynamic Physics & Fluid Controls**:
  - **Running**: Smooth auto-run that dynamically accelerates as distance increases.
  - **Variable Jump & Double Jump**: Hold for higher jumps; double jump in mid-air with an aerial pulse ring.
  - **Slide / Duck**: Slide under high laser grids and obstacles or fast-fall while airborne.
  - **Coyote Time & Jump Buffering**: Generous input timing windows for responsive, frustration-free arcade platforming.
- **Cyberpunk Synthwave Aesthetics**:
  - Multi-layered parallax background (retro neon sun, starfield, distant & near illuminated skylines).
  - 3D perspective cyber highway grid with dynamic speed pulses.
  - After-image ghost trails matching your equipped runner skin.
  - Fluid particle system: jump dust, landing sparks, slide sparks, shield break bursts, explosions, and speed lines.
- **Procedural Sound & Music (Web Audio API)**:
  - Custom synthesized retro synthwave background soundtrack with dynamic tempo ramping.
  - Pure procedural sound effects (jumps, double-jumps, slides, coin chimes, shield break, explosions) with zero external asset dependencies.
  - Dedicated BGM and SFX volume controls + mute toggle.
- **Power-Ups & Collectibles**:
  - **Neon Bits (+10 pts)** & **Cyber Gems (+50 pts)**
  - **Energy Shield**: Absorbs 1 lethal collision.
  - **Hyper Nitro**: 6 seconds of invulnerability—smash through obstacles for bonus points!
  - **Coin Magnet**: Draws nearby coins and gems with lightning arcs.
  - **2X Multiplier**: Doubles points and coins collected.
- **Chassis Customization & Unlockables**:
  - 6 unlockable runner skins with unique color palettes, visors, and particle auras.
  - Unlock new chassis using collected Neon Bits.
- **Full Mobile & Desktop Support**:
  - Desktop: Keyboard shortcuts (`Space` / `W` / `Up` to Jump, `S` / `Down` to Slide, `P` / `Esc` to Pause).
  - Mobile: On-screen tactile touch arcade buttons + full swipe gesture support.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or later
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/PrasadJakkula/Neon-Rush.git

# Navigate into the project folder
cd Neon-Rush

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) to play.

---

## 🏗️ Production Build

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deploy to Vercel

This repository is pre-configured for **Vercel** with `vercel.json`:

1. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Import this repository (`PrasadJakkula/Neon-Rush`).
3. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**!

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Audio**: Web Audio API (Procedural Synthesizer & Sequencer)
- **Icons**: [Lucide React](https://lucide.dev/)
