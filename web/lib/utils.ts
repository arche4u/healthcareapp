import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string.
 */
export function formatDate(date: Date | string, locale = "en-IN"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Format a date to relative time (e.g., "2 days ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 7) {
    return formatDate(d);
  } else if (days > 1) {
    return `${days} days ago`;
  } else if (days === 1) {
    return "yesterday";
  } else if (days === 0) {
    return "today";
  }
  return formatDate(d);
}