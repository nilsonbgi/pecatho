export type MediaAspect = "landscape" | "square" | "portrait";

export function classifyAspect(width: number, height: number): MediaAspect {
  const ratio = width / Math.max(height, 1);
  if (ratio >= 1.25) return "landscape";
  if (ratio <= 0.8) return "portrait";
  return "square";
}

async function canvasBlob(source: CanvasImageSource, width: number, height: number, quality: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível otimizar a imagem.")), "image/webp", quality);
  });
}

export async function optimizeImage(file: File, maxDimension = 2560, quality = 0.88): Promise<{ file: File; preview: File; width: number; height: number; aspect: MediaAspect }> {
  if (!file.type.startsWith("image/")) throw new Error("Arquivo de imagem inválido.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const fullBlob = await canvasBlob(bitmap, width, height, quality);
  const previewScale = Math.min(1, 960 / Math.max(width, height));
  const previewWidth = Math.max(1, Math.round(width * previewScale));
  const previewHeight = Math.max(1, Math.round(height * previewScale));
  const previewBlob = await canvasBlob(bitmap, previewWidth, previewHeight, 0.78);
  bitmap.close();
  const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
  return {
    file: new File([fullBlob], base + ".webp", { type: "image/webp", lastModified: Date.now() }),
    preview: new File([previewBlob], base + "-preview.webp", { type: "image/webp", lastModified: Date.now() }),
    width, height, aspect: classifyAspect(width, height)
  };
}
