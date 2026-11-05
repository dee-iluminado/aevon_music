/**
 * Turns a photo picked from the device into a small square data URL that is
 * safe to keep in localStorage alongside the local account.
 */

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const OUTPUT_SIZE = 256;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("That image format isn't supported by this browser."));
    image.src = src;
  });
}

export async function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPG, PNG, WebP…).");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That image is larger than 8 MB. Pick a smaller one.");
  }

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  if (!image.width || !image.height) {
    throw new Error("That image could not be opened.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");

  // Centre-crop to a square so the avatar never looks stretched.
  const scale = Math.max(
    OUTPUT_SIZE / image.width,
    OUTPUT_SIZE / image.height
  );
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    (OUTPUT_SIZE - width) / 2,
    (OUTPUT_SIZE - height) / 2,
    width,
    height
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}
