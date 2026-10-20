export type GalleryMediaKind = "image" | "video" | string;

export type GalleryMediaShape = {
  id: string;
  kind: GalleryMediaKind;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
  original_filename?: string | null;
  storage_path?: string | null;
};

export type GalleryMediaGroup<T extends GalleryMediaShape> = {
  key: string;
  title: string;
  description: string;
  kind: "image" | "video";
  items: T[];
};

type AspectBucket = {
  key: string;
  title: string;
  ratio: number;
};

const ASPECT_BUCKETS: AspectBucket[] = [
  { key: "portrait-9-16", title: "Vertical · 9:16", ratio: 9 / 16 },
  { key: "portrait-2-3", title: "Retrato · 2:3", ratio: 2 / 3 },
  { key: "square-1-1", title: "Quadrado · 1:1", ratio: 1 },
  { key: "landscape-16-9", title: "Horizontal · 16:9", ratio: 16 / 9 },
];

export function isGifMedia(item: GalleryMediaShape): boolean {
  return /image\/gif/i.test(item.mime_type || "") || /\.gif$/i.test(item.original_filename || "") || /\.gif(?:$|[?#])/i.test(item.storage_path || "");
}

function aspectBucket(item: GalleryMediaShape): AspectBucket | null {
  const width = Number(item.width);
  const height = Number(item.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;

  const ratio = width / height;
  let closest = ASPECT_BUCKETS[0];
  let difference = Number.POSITIVE_INFINITY;
  for (const candidate of ASPECT_BUCKETS) {
    const current = Math.abs(Math.log(ratio / candidate.ratio));
    if (current < difference) {
      closest = candidate;
      difference = current;
    }
  }

  // Keep genuinely unusual formats in their own original-ratio group.
  return difference <= Math.log(1.18) ? closest : null;
}

export function groupGalleryMedia<T extends GalleryMediaShape>(items: T[]): GalleryMediaGroup<T>[] {
  const groups = new Map<string, GalleryMediaGroup<T>>();

  for (const item of items) {
    const kind: "image" | "video" = item.kind === "video" ? "video" : "image";
    const gif = kind === "image" && isGifMedia(item);
    const aspect = aspectBucket(item);
    const key = gif ? "gif" : `${kind}:${aspect?.key || "original"}`;
    const title = gif
      ? "GIFs animados"
      : `${kind === "video" ? "Vídeos" : "Fotos"} · ${aspect?.title || "Proporção original"}`;
    const description = gif
      ? "Animações preservadas no formato GIF."
      : aspect
        ? `Mídias agrupadas pelo formato ${aspect.title.split(" · ")[1]}.`
        : "Mídias com proporção fora dos formatos mais comuns, exibidas sem corte.";
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, title, description, kind, items: [item] });
    }
  }

  return [...groups.values()].sort((a, b) => {
    const rank = (group: GalleryMediaGroup<T>) => {
      if (group.key === "gif") return 0;
      if (group.kind === "video") return 1;
      return 2;
    };
    return rank(a) - rank(b) || a.title.localeCompare(b.title, "pt-BR");
  });
}
