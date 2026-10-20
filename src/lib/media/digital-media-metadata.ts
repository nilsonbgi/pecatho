export type DigitalMediaMetadata = {
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
};

function positiveDimension(value: number): number | null {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export async function readDigitalMediaMetadata(file: File): Promise<DigitalMediaMetadata> {
  if (file.type.startsWith("image/")) {
    try {
      const bitmap = await createImageBitmap(file);
      const result = { width: positiveDimension(bitmap.width), height: positiveDimension(bitmap.height), duration_seconds: null };
      bitmap.close();
      return result;
    } catch {
      return { width: null, height: null, duration_seconds: null };
    }
  }

  if (file.type.startsWith("video/")) {
    const url = URL.createObjectURL(file);
    try {
      const metadata = await new Promise<DigitalMediaMetadata>((resolve) => {
        const video = document.createElement("video");
        const finish = (result: DigitalMediaMetadata) => {
          video.removeAttribute("src");
          video.load();
          resolve(result);
        };
        video.preload = "metadata";
        video.onloadedmetadata = () => finish({
          width: positiveDimension(video.videoWidth),
          height: positiveDimension(video.videoHeight),
          duration_seconds: Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration * 1000) / 1000 : null,
        });
        video.onerror = () => finish({ width: null, height: null, duration_seconds: null });
        video.src = url;
      });
      return metadata;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return { width: null, height: null, duration_seconds: null };
}
