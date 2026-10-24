"use client";
import { useEffect, useState } from "react";

/**
 * Extracts the dominant color from an image URL using a hidden <canvas>.
 * Returns an RGB string like "120,80,200" suitable for CSS var usage.
 */
export function useDominantColor(imageUrl: string | undefined): string {
  const [color, setColor] = useState("var(--ember-rgb, 255,140,50)");

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 8, 8);
        const data = ctx.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // skip very dark or very light pixels
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness < 20 || brightness > 235) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        if (count === 0) return;
        // Boost saturation slightly
        const avg = {
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        };
        setColor(`${avg.r},${avg.g},${avg.b}`);
      } catch {
        // tainted canvas — just keep default
      }
    };
  }, [imageUrl]);

  return color;
}
