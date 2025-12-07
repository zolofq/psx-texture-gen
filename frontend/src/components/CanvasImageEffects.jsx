import React, { useRef, useEffect } from "react";
import { createNoise2D } from "simplex-noise";

const CanvasImageEffects = ({
  src,
  noiseScale = 0.01,
  noiseOpacity = 0.5,
  pixelSize,
  maxWidth,
  maxHeight,
}) => {
  const canvasRef = useRef(null);
  const noise2D = createNoise2D();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      // Calculate dimensions
      let { width, height } = calculateDimensions(img, maxWidth, maxHeight);
      canvas.width = width;
      canvas.height = height;

      // Apply pixelation first
      if (pixelSize && pixelSize > 1) {
        applyPixelation(ctx, img, width, height, pixelSize);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Apply noise on top
      if (noiseScale && noiseScale > 0 && noiseOpacity > 0) {
        applyNoise(ctx, width, height, noiseScale, noiseOpacity);
      }
    };

    img.onerror = () => {
      console.error("Failed to load image");
    };
  }, [src, noiseScale, noiseOpacity, pixelSize, maxWidth, maxHeight]);

  const calculateDimensions = (img, maxWidth, maxHeight) => {
    let width = img.width;
    let height = img.height;

    if (maxWidth && width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }

    if (maxHeight && height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }

    return { width, height };
  };

  const applyNoise = (ctx, width, height, noiseScale, noiseOpacity) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Loop through each pixel (4 elements per pixel: R, G, B, A)
    for (let i = 0; i < data.length; i += 4) {
      // Calculate x,y coordinates from pixel index
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);

      // Generate noise value (-1 to 1) and convert to grayscale (0-255)
      const noise = noise2D(x * noiseScale, y * noiseScale);
      const color = Math.floor((noise + 1) * 128);

      // Blend noise with original pixel colors
      const opacity = Math.max(0, Math.min(1, noiseOpacity)); // Ensure opacity is between 0-1

      // Red channel
      data[i] = data[i] * (1 - opacity) + color * opacity;
      // Green channel
      data[i + 1] = data[i + 1] * (1 - opacity) + color * opacity;
      // Blue channel
      data[i + 2] = data[i + 2] * (1 - opacity) + color * opacity;
      // Alpha channel remains unchanged
    }

    ctx.putImageData(imageData, 0, 0);
  };

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg shadow-lg"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
};

export default CanvasImageEffects;
