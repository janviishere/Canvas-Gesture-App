# ✨ Canvas Gesture App

An interactive, touchless drawing application that allows you to draw and select colors on a digital canvas using hand gestures captured straight from your webcam. Experience the magic of computer vision directly in your browser without any server-side processing!

## ✨ Features
- **Machine Learning Tracking**: Powered by Google's highly advanced `MediaPipe Tasks Vision` model for flawlessly smooth 3D hand tracking. Includes an immersive "Neon Glowing Skeleton" debug view!
- **Dynamic Drawing Canvas**: Pinch your index and thumb together in the bottom 65% of your screen to draw continuous, glowing lines.
- **Air Color Selection**: Move your pinched fingers to the top 35% of your screen and hover over the floating orbs. Pinch firmly to seamlessly swap your brush colors!
- **Privacy-First**: Everything runs entirely client-side. No camera footage or data is ever sent to a remote server.
- **Hardware Agnostic**: Built utilizing a robust CPU inference fallback, ensuring broad compatibility across virtually any laptop or desktop hardware.

## 🎥 Demo Video
https://github.com/janviishere/Canvas-Gesture-App/blob/main/Canvas%20Gesture%20Demo.mp4

## 🛠️ Technologies Used
- **React 18** + **Vite**
- **TypeScript**
- **Tailwind CSS**
- **MediaPipe Tasks Vision**
- **HTML5 Canvas API**
- **lucide-react**

## 🚀 How to Run Locally

1. Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
2. Clone this repository (or download the source code):
   ```bash
   git clone https://github.com/janviishere/Canvas-Gesture-App.git
   ```
3. Open your terminal in the downloaded project folder and install the core dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Click the local link provided in your terminal (typically `http://localhost:5173`), grant your browser access to your camera, and start drawing in the air!
