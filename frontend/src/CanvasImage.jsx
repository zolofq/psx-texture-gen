import React, { useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";

export default function CanvasImage({ src, noiseScale = 0.01 }) {
  // Reference to access the canvas DOM element
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Exit if canvas isn't available

    const ctx = canvas.getContext("2d");
    const noise2D = createNoise2D(); // Create 2D noise generator
    const img = new Image(); // Create new image object

    // Set image source and handle loading
    img.src = src;
    img.onload = () => {
      // Set canvas size to match image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image onto canvas
      ctx.drawImage(img, 0, 0);

      // Get pixel data from canvas for manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data; // RGBA pixel array
      const opacity = 0.5; // Noise blending strength (0-1)

      // Loop through each pixel (4 elements per pixel: R, G, B, A)
      for (let i = 0; i < pixels.length; i += 4) {
        // Calculate x,y coordinates from pixel index
        const x = (i / 4) % canvas.width;
        const y = Math.floor(i / 4 / canvas.width);

        // Generate noise value (-1 to 1) and convert to grayscale (0-255)
        const noise = noise2D(x * noiseScale, y * noiseScale);
        const color = Math.floor((noise + 1) * 128);

        // Blend noise with original pixel colors
        // Red channel
        pixels[i] = pixels[i] * (1 - opacity) + color * opacity;
        // Green channel
        pixels[i + 1] = pixels[i + 1] * (1 - opacity) + color * opacity;
        // Blue channel
        pixels[i + 2] = pixels[i + 2] * (1 - opacity) + color * opacity;
        // Alpha channel remains unchanged
      }

      // Write modified pixel data back to canvas
      ctx.putImageData(imageData, 0, 0);
    };
  }, [src, noiseScale]); // Re-run effect when src or noiseScale changes

  // Render canvas element with ref attachment
  return <canvas ref={canvasRef} />;
}
