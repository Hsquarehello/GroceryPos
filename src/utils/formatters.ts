import { locale, t } from "../i18n";

export const formatNumber = (value: number): string =>
  Math.round(value).toLocaleString(locale);

export const formatMoney = (value: number): string =>
  `${formatNumber(value)} ${t("mmk")}`;

export function formatTime(value: string): string {
  const time = value.split(" ")[1] ?? value;
  return time.slice(0, 5);
}
