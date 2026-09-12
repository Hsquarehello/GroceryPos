export const formatMoney = (value: number): string =>
  `${Math.round(value).toLocaleString()} MMK`;

export function formatTime(value: string): string {
  const time = value.split(" ")[1] ?? value;
  return time.slice(0, 5);
}