import Constants from 'expo-constants';

const IMGPROXY_URL: string = Constants.expoConfig?.extra?.imgproxyUrl ?? 'http://2.56.246.76:8080';
// This is NOT a publicly reachable address — MinIO has no exposed host port
// at all. It's the *internal* docker-network hostname, embedded as opaque
// text inside the imgproxy URL below; only imgproxy (running on that same
// network, on the VPS) ever actually resolves and fetches it. The phone
// only ever talks to IMGPROXY_URL. Must match aroge-api's MINIO_ENDPOINT.
const MINIO_INTERNAL_BASE = 'http://minio:9000';
const MINIO_PUBLIC_BUCKET = 'aroge-public';

/**
 * Resize presets, mirroring the API's imgproxy presets — must match
 * `src/lib/storage.ts` in aroge-api so the same photo key always produces a
 * cache-friendly, consistently-sized URL.
 */
export const MediaPreset = {
  /** Grid/list thumbnails (home, search, seller profile) */
  thumb: 'rs:fill:400:400',
  /** Chat bubble images, small avatars */
  small: 'rs:fill:200:200',
  /** Listing detail hero / gallery */
  hero: 'rs:fit:1200:1200',
} as const;

export type MediaPresetKey = keyof typeof MediaPreset;

/**
 * Builds a resized-image URL for a MinIO-stored photo from its storage key.
 * Every screen must go through this — never hardcode image hosts inline.
 * The actual fetch happens through imgproxy, which is the only thing that
 * ever talks to MinIO directly; this just asks imgproxy (publicly reachable)
 * to fetch and resize from MinIO's address on our behalf.
 */
export function mediaUrl(
  key: string | null | undefined,
  preset: MediaPresetKey = 'thumb'
): string | null {
  if (!key) return null;
  const source = `${MINIO_INTERNAL_BASE}/${MINIO_PUBLIC_BUCKET}/${key}`;
  return `${IMGPROXY_URL}/unsafe/${MediaPreset[preset]}/plain/${encodeURIComponent(source)}`;
}
