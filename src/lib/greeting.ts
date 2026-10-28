export function getGreeting(
  name?: string | null,
  now: Date = new Date(),
): string {
  const hour = now.getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const trimmed = name?.trim();
  return trimmed ? `${part}, ${trimmed}.` : `${part}.`;
}
