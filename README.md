# Flappy Bird PRO For Online Play: https://shabbirmai124.github.io/flappy-bird-pro.github.io/

**Flappy Bird PRO** is a feature-rich, modern web-based arcade game that brings the classic "Flappy Bird" experience to the browser with a professional, polished UI and extended gameplay mechanics.

Created by **Md Shabbir Mia**.

## 🎮 Features

* **Classic Arcade Gameplay**: Tap or press space to fly, dodge pipes, and survive as long as you can.
* **Coin System & Shop**: Collect coins during gameplay to unlock unique Bird Skins (each with distinct colors and effects).
* **Combo Multipliers**: Navigate through pipes quickly in succession to build up combos and earn bonus points/coins.
* **Achievements**: Complete specific milestones to earn awards and extra coin rewards.
* **Daily Rewards**: Come back every 24 hours to claim your free coin bonus.
* **Themes & Difficulties**: Switch between visually distinct environments (Day, Night, Space, Forest) and adjust the challenge level (Easy, Normal, Hard).
* **Local Leaderboard**: Keeps track of your top 10 best personal runs.
* **Responsive UI**: Features a modern, "glassmorphism" overlay design that scales perfectly on desktop, tablet, and mobile browsers.

## 💻 Built With (Tech Stack)

This project is built using pure, vanilla web technologies without any heavy game engines (like Unity or Godot), relying entirely on the browser's native rendering capabilities.

* **HTML5**: Used for structuring the UI overlays and providing the `<canvas>` element where the game is drawn.
* **CSS3**: Handles all the beautiful UI styling, glassmorphism effects, CSS animations, responsive layouts, and menu transitions.
* **JavaScript (ES6+)**: The core engine of the game. It handles physics, collision detection, particle systems, saving/loading data (via LocalStorage), audio management, and rendering to the Canvas.
* **Vite**: A modern, lightning-fast frontend build tool used to bundle the JavaScript modules and serve the project locally during development.

## 🚀 How to Run Locally

1. Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
2. Open your terminal in the project directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the local link provided (usually `http://localhost:5173/`).

## 📦 How to Build for Production

To create a production-ready build (for hosting on platforms like itch.io, Netlify, or Vercel):

```bash
npm run build
```
This will generate a `dist/` folder containing the optimized `index.html` and assets. You can zip the contents of this `dist/` folder to upload to HTML5 game hosting platforms.
