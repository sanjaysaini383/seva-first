import type { Models } from 'appwrite';
import {
  Car,
  Droplets,
  HeartHandshake,
  Laptop,
  LifeBuoy,
  PawPrint,
  Pill,
  ShoppingCart,
  Sparkles,
  Tent,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { t, type Key } from './i18n';

export type Kind = 'request' | 'offer';
export type Status = 'open' | 'claimed' | 'done';
export type Urgency = 'low' | 'normal' | 'high';
export type Category =
  | 'rescue'
  | 'medicine'
  | 'water'
  | 'shelter'
  | 'food'
  | 'groceries'
  | 'rides'
  | 'care'
  | 'tools'
  | 'tech'
  | 'pets'
  | 'other';

/** [longitude, latitude] — the order Appwrite point columns use. */
export type LngLat = [number, number];

export type Post = Models.Row & {
  kind: Kind;
  category: Category;
  title: string;
  body: string | null;
  location: LngLat;
  status: Status;
  urgency: Urgency;
  authorId: string;
  authorName: string;
  helperId: string | null;
  helperName: string | null;
  hearts: number;
  replies: number;
  expiresAt: string | null;
};

export type Message = Models.Row & {
  authorId: string;
  authorName: string;
  body: string;
  system: boolean;
};

export type Kudos = Models.Row & {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  points: number;
  note: string | null;
};

/** Emergency categories come first: in a flood they are what people look for. */
export const CATEGORIES: { id: Category; label: string; icon: LucideIcon; color: string; emergency?: boolean }[] = [
  { id: 'rescue', label: 'Rescue / boat', icon: LifeBuoy, color: '#dc2626', emergency: true },
  { id: 'medicine', label: 'Medicine', icon: Pill, color: '#059669', emergency: true },
  { id: 'water', label: 'Drinking water', icon: Droplets, color: '#0284c7', emergency: true },
  { id: 'shelter', label: 'Shelter', icon: Tent, color: '#92400e', emergency: true },
  { id: 'food', label: 'Food', icon: UtensilsCrossed, color: '#ea580c' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: '#65a30d' },
  { id: 'rides', label: 'Rides', icon: Car, color: '#2563eb' },
  { id: 'care', label: 'Care', icon: HeartHandshake, color: '#db2777' },
  { id: 'tools', label: 'Tools', icon: Wrench, color: '#ca8a04' },
  { id: 'tech', label: 'Tech help', icon: Laptop, color: '#7c3aed' },
  { id: 'pets', label: 'Pets', icon: PawPrint, color: '#0891b2' },
  { id: 'other', label: 'Other', icon: Sparkles, color: '#64748b' },
];

export const categoryMeta = (id: Category) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

/** Category name in the current interface language. */
export const catLabel = (id: Category) => t(`cat.${id}` as Key);
