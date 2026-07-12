export const MOVE_TARGET_DATE = "2027-01-15T00:00:00";

export type CountdownPart = { value: string; label: string };

export function buildCountdownText(now = new Date(), target = new Date(MOVE_TARGET_DATE)): string {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalMonths = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  const remainingDays = Math.floor(diff / 86400000) % 31;
  const remainingHours = Math.floor(diff / 3600000) % 24;
  const remainingMinutes = Math.floor(diff / 60000) % 60;
  const remainingSeconds = Math.floor(diff / 1000) % 60;
  const months = Math.max(0, totalMonths);
  return `${months} month${months === 1 ? "" : "s"} ${remainingDays} day${remainingDays === 1 ? "" : "s"} ${remainingHours} hour${remainingHours === 1 ? "" : "s"} ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`;
}

export function splitCountdownParts(countdownText: string): CountdownPart[] {
  const tokens = countdownText.split(" ");
  const parts: CountdownPart[] = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const value = tokens[i];
    const label = tokens[i + 1];
    if (value && label) parts.push({ value, label });
  }
  return parts;
}
