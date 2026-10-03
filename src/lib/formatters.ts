/**
 * Standard formatting utilities for dates and numbers using built-in Intl APIs.
 */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatDate(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  return isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
}

export function formatNumber(num: number): string {
  return numberFormatter.format(num);
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
