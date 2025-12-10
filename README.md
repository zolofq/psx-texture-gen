# PSX texture generator 
![WIP](https://img.shields.io/badge/Status-Early%20Development-yellow)
![No AI](https://img.shields.io/badge/No%20AI-Pure%20Canvas-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat&logo=github&logoColor=white)

> Transform images into authentic PS1-era graphics with hardware-accurate visual effects

**⚠️ My first JavaScript project!**

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## 🎯 What It Does

Recreates PlayStation 1 visual style by simulating hardware limitations:

- **Pixelation** - Low resolution graphics
- **15-bit Color** - Limited color palette (32,768 colors)
- **Vertex Wobble** - Texture warping from affine mapping
- **Dithering** - Bayer or PSX 2x2 patterns
- **RGB Shift** - Analog video color separation
- **Texture Artifacts** - VRAM page boundaries

## 🛠️ Tech Stack

- React 19 + Vite
- Canvas API for image processing
- Tailwind CSS + DaisyUI
- Wikimedia Commons API for images
- simplex-noise for effects

## 📐 How It Works

Effects are applied in order:
1. Pixelation → 2. Color reduction → 3. Dithering → 4. Vertex wobble → 5. Perspective warping → 6. Texture pages → 7. RGB shift → 8. Subpixel artifacts → 9. Noise

Each effect simulates a specific PS1 hardware limitation.

## 📂 Structure

```
src/
├── components/CanvasImageEffects.jsx  # Image processor (15+ effects)
├── utils/ImageSearch.js               # Wikimedia API wrapper
└── App.jsx                            # Main UI + state
```

## 🎮 PS1 Hardware Limits

| Hardware | Visual Effect |
|----------|---------------|
| No perspective correction | Wobbly textures |
| Integer vertex positions | Pixel snapping |
| 1MB VRAM | Small textures, limited colors |
| 15-bit color depth | Only 32,768 colors |
| 256x256 texture pages | Visible seams |
| Composite video output | RGB separation |

## 🔧 Main Effects

**Pixelation** (`pixelSize: 1-100`) - Reduces resolution  
**Color Palette** (`paletteSize: 2-256`) - Limits colors to 15-bit  
**Dithering** (`ditherType: "bayer" | "psx"`) - Pattern-based color blending  
**RGB Shift** (`rgbShiftAmount: 1-30`) - Channel separation  
**Vertex Wobble** (`vertexIntensity: 0-1`) - Affine texture warping  
**Texture Pages** (`texturePageSize: 0-512`) - VRAM boundary artifacts

## 💡 Usage

1. Search for images (Wikimedia Commons)
2. Select thumbnail
3. Adjust effects in sidebar
4. RMB to save

## 📦 Dependencies

```json
{
  "react": "^19.2.0",
  "simplex-noise": "^4.0.3",
  "react-hot-toast": "^2.6.0",
  "tailwindcss": "^3.4.18",
  "daisyui": "^5.5.5"
}
```
---
<img src="https://media1.tenor.com/m/Lx6ipmgUZwUAAAAC/cold-winter.gif" width="1000" height="300" alt="Demo">

