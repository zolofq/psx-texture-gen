import React, { useRef, useEffect } from "react";
import { createNoise2D } from "simplex-noise";

const CanvasImageEffects = ({
  src,
  noiseScale = 0.005,
  pixelSize,
  maxWidth,
  maxHeight,
  dithering = false,
  ditherDepth = 32,
  ditherIntensity = 1.0,
  ditherType = "bayer", // "bayer" or "psx"
  vertexWobble = false,
  vertexIntensity = 0.015,
  paletteSize = 256,
  perspectiveArtifacts = false,
  perspectiveIntensity = 0.2,
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

      // Apply pixelation first (foundation for PSX look)
      if (pixelSize && pixelSize > 1) {
        applyPixelation(ctx, img, width, height, pixelSize);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Apply color palettization (PSX color depth reduction)
      if (paletteSize < 256) {
        applyPalettization(ctx, width, height, paletteSize);
      }

      // Apply dithering based on selected type
      if (dithering && ditherDepth > 0) {
        if (ditherType === "psx") {
          applyPsxDithering(ctx, width, height);
        } else {
          applyColorDithering(ctx, width, height, ditherDepth, ditherIntensity);
        }
      }

      // Apply vertex wobble (affine texture warping - key PSX effect)
      if (vertexWobble && vertexIntensity > 0) {
        applyVertexWobble(ctx, width, height, vertexIntensity);
      }

      // Apply perspective artifacts (lack of perspective correction)
      if (perspectiveArtifacts && perspectiveIntensity > 0) {
        applyPerspectiveArtifacts(ctx, width, height, perspectiveIntensity);
      }

      // Apply noise on top
      if (noiseScale && noiseScale > 0) {
        applyNoise(ctx, width, height, noiseScale);
      }
    };

    img.onerror = () => {
      console.error("Failed to load image");
    };
  }, [
    src,
    noiseScale,
    pixelSize,
    maxWidth,
    maxHeight,
    dithering,
    ditherDepth,
    ditherIntensity,
    ditherType,
    vertexWobble,
    vertexIntensity,
    paletteSize,
    perspectiveArtifacts,
    perspectiveIntensity,
  ]);

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

  const applyPixelation = (ctx, img, width, height, pixelSize) => {
    const pixelation = Math.max(1, Math.min(100, pixelSize));
    const size = pixelation / 100;
    const w = width * size;
    const h = height * size;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Turn off image aliasing
    ctx.msImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    // Draw original image at fraction of size
    ctx.drawImage(img, 0, 0, w, h);

    // Enlarge the minimized image to full size
    ctx.drawImage(canvasRef.current, 0, 0, w, h, 0, 0, width, height);
  };

  const applyPalettization = (ctx, width, height, paletteSize = 256) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Reduce color depth to simulate PSX 15-bit color (5-5-5 bits)
    for (let i = 0; i < data.length; i += 4) {
      // Quantize to 5 bits per channel (32 levels instead of 256)
      data[i] = Math.floor(data[i] / 8) * 8; // Red: 0-31 steps
      data[i + 1] = Math.floor(data[i + 1] / 8) * 8; // Green
      data[i + 2] = Math.floor(data[i + 2] / 8) * 8; // Blue

      // Force limited palette per texture (common PSX constraint)
      if (paletteSize < 256) {
        // Create indexed color effect
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const paletteIndex = Math.floor(brightness / (256 / paletteSize));
        const limitedColor = paletteIndex * (256 / paletteSize);

        // Apply limited color palette
        data[i] = limitedColor;
        data[i + 1] = limitedColor;
        data[i + 2] = limitedColor;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyColorDithering = (ctx, width, height, depth, intensity) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Larger bayer matrix for smoother color dithering
    const bayerMatrix8x8 = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21],
    ];

    // Normalize depth (smaller value = fewer colors)
    const levels = Math.max(2, Math.min(256, depth));
    const step = 255 / (levels - 1);
    const intensityFactor = Math.max(0, Math.min(1, intensity));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;

        // Get bayer matrix value (0-63) and normalize to -0.5 to 0.5
        const bayerValue = bayerMatrix8x8[x % 8][y % 8];
        const normalizedBayer = (bayerValue / 64 - 0.5) * intensityFactor;

        // Apply dithering to each color channel separately
        for (let channel = 0; channel < 3; channel++) {
          const originalValue = data[pixelIndex + channel];

          // Add dithering noise
          let ditheredValue = originalValue + normalizedBayer * step;

          // Quantize to nearest level
          ditheredValue = Math.round(ditheredValue / step) * step;

          // Clamp to 0-255 range
          data[pixelIndex + channel] = Math.max(
            0,
            Math.min(255, ditheredValue)
          );
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyPsxDithering = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 2x2 ordered dither matrix (common in PSX games)
    const psxDitherMatrix = [
      [0, 2],
      [3, 1],
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const matrixValue = psxDitherMatrix[y % 2][x % 2];

        // Apply PSX-style ordered dithering
        if (matrixValue === 0) {
          // Darken in pattern position 0
          data[idx] = Math.floor(data[idx] / 64) * 64;
          data[idx + 1] = Math.floor(data[idx + 1] / 64) * 64;
          data[idx + 2] = Math.floor(data[idx + 2] / 64) * 64;
        } else if (matrixValue === 3) {
          // Lighten in pattern position 3
          data[idx] = Math.ceil(data[idx] / 64) * 64;
          data[idx + 1] = Math.ceil(data[idx + 1] / 64) * 64;
          data[idx + 2] = Math.ceil(data[idx + 2] / 64) * 64;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyVertexWobble = (ctx, width, height, intensity = 0.01) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const outputData = ctx.createImageData(width, height);

    // Process in quads (2x2 pixel blocks) like PSX rendering
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        // Random vertex displacement (affine warping artifact)
        const wobbleX = (Math.random() - 0.5) * 2 * intensity;
        const wobbleY = (Math.random() - 0.5) * 2 * intensity;

        // Apply affine distortion within the quad
        for (let py = 0; py < 2; py++) {
          for (let px = 0; px < 2; px++) {
            const srcX = Math.floor(x + px + wobbleX * px);
            const srcY = Math.floor(y + py + wobbleY * py);

            // Boundary check
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
              const srcIdx = (srcY * width + srcX) * 4;
              const dstIdx = ((y + py) * width + (x + px)) * 4;

              // Copy pixel with distortion
              outputData.data[dstIdx] = imageData.data[srcIdx];
              outputData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
              outputData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
              outputData.data[dstIdx + 3] = 255; // Force opaque for PSX style
            }
          }
        }
      }
    }

    ctx.putImageData(outputData, 0, 0);
  };

  const applyPerspectiveArtifacts = (ctx, width, height, intensity = 0.3) => {
    // Simulate missing perspective correction (affine texture mapping)
    const imageData = ctx.getImageData(0, 0, width, height);
    const outputData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      // Scale factor increases with Y (simulating perspective distortion)
      const perspectiveScale = 1 + (y / height) * intensity;

      for (let x = 0; x < width; x++) {
        // Apply non-perspective-correct texture sampling
        const srcX = Math.floor(x * perspectiveScale) % width;
        const srcY = y;
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * width + x) * 4;

        // Copy with perspective distortion
        outputData.data[dstIdx] = imageData.data[srcIdx];
        outputData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
        outputData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
        outputData.data[dstIdx + 3] = 255;
      }
    }

    ctx.putImageData(outputData, 0, 0);
  };

      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyNoise = (ctx, width, height, noiseScale) => {
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

      // Use noiseScale as opacity/intensity
      const opacity = noiseScale;

      // Blend noise with original pixel colors
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
