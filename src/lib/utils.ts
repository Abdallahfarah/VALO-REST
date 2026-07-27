import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_SUFFIXES = [
  'owner',
  'admin',
  'restaurant admin',
  'restaurant_admin',
  'platform owner',
  'platform_owner',
  'super admin',
  'super_admin',
  'waiter',
  'cashier',
  'kitchen staff',
  'kitchen_staff',
  'barista',
  'chef',
];

export function stripRoleFromDisplayName(name?: string | null): string {
  if (!name) return 'Staff';
  let cleaned = name.trim();

  const words = cleaned.split(/\s+/);
  if (words.length > 1) {
    const lastWordLower = words[words.length - 1].toLowerCase();
    if (ROLE_SUFFIXES.includes(lastWordLower)) {
      words.pop();
      cleaned = words.join(' ');
    }
  } else {
    if (ROLE_SUFFIXES.includes(cleaned.toLowerCase())) {
      return 'Staff';
    }
  }

  return cleaned || 'Staff';
}

export function formatDisplayName(firstName?: string | null, lastName?: string | null): string {
  const first = (firstName || '').trim();
  let last = (lastName || '').trim();

  if (last && ROLE_SUFFIXES.includes(last.toLowerCase())) {
    last = '';
  }

  if (!first && !last) return 'Staff';
  if (!last) return stripRoleFromDisplayName(first);
  if (first.toLowerCase() === last.toLowerCase()) return stripRoleFromDisplayName(first);

  return stripRoleFromDisplayName(`${first} ${last}`);
}
