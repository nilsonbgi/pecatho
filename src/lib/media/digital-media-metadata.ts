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
      return await new Promise<DigitalMediaMetadata>((resolve) => {
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
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return { width: null, height: null, duration_seconds: null };
}

/**
 * Creates a silent, 3-second WebM preview locally in the browser.
 * The original video is never overwritten. Returns null when the browser
 * cannot encode a compatible preview; callers must keep the original safe.
 */
export async function createShortVideoPreview(file: File, seconds = 3): Promise<File | null> {
  if (!file.type.startsWith("video/") || typeof MediaRecorder === "undefined") return null;
  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) return null;
  const sourceUrl = URL.createObjectURL(file);
  let video: HTMLVideoElement | null = null;
  let stream: MediaStream | null = null;
  try {
    const loaded = await new Promise<HTMLVideoElement | null>((resolve) => {
      const element = document.createElement("video");
      element.muted = true;
      element.playsInline = true;
      element.preload = "metadata";
      element.onloadedmetadata = () => resolve(element);
      element.onerror = () => resolve(null);
      element.src = sourceUrl;
    });
    video = loaded;
    if (!video || !video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration) || video.duration <= 0) return null;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
    canvas.height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
    const context = canvas.getContext("2d");
    if (!context) return null;
    stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 350_000 });
    const chunks: BlobPart[] = [];
    const recorded = new Promise<Blob | null>((resolve) => {
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onerror = () => resolve(null);
      recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: mimeType }) : null);
    });
    const draw = () => {
      if (!video || video.paused || video.ended) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(draw);
    };
    await video.play();
    recorder.start(250);
    draw();
    await new Promise<void>((resolve) => window.setTimeout(resolve, Math.min(seconds, video!.duration) * 1000));
    if (recorder.state !== "inactive") recorder.stop();
    video.pause();
    const blob = await recorded;
    if (!blob || blob.size === 0) return null;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-preview.webm", { type: mimeType, lastModified: Date.now() });
  } catch {
    return null;
  } finally {
    if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
    stream?.getTracks().forEach((track) => track.stop());
    URL.revokeObjectURL(sourceUrl);
  }
}
