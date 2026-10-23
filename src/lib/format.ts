import { t } from './i18n';
import type { LngLat } from './types';

export function distanceKm([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(km: number): string {
  if (km < 1) return t('dist.m', { n: Math.max(50, Math.round((km * 1000) / 50) * 50) });
  return t('dist.km', { n: km < 10 ? km.toFixed(1) : Math.round(km) });
}

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return t('time.justNow');
  const m = Math.round(s / 60);
  if (m < 60) return t('time.m', { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t('time.h', { n: h });
  return t('time.d', { n: Math.round(h / 24) });
}

export function timeLeft(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t('left.expired');
  const h = Math.floor(ms / 3600_000);
  if (h < 1) return t('left.m', { n: Math.max(1, Math.round(ms / 60_000)) });
  if (h < 48) return t('left.h', { n: h });
  return t('left.d', { n: Math.round(h / 24) });
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Stable warm hue per person, for avatars. */
export function hueFor(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
