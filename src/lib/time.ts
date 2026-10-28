const pad = (n: number) => String(n).padStart(2, "0");

/** Times are stored as 24 hour "HH:mm" strings. */
export function parseTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

export function toTimeString(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

export function formatTime12(value: string): string {
  const { hour, minute } = parseTime(value);
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad(minute)} ${period}`;
}
