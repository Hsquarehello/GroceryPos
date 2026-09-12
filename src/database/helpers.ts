export function isUniqueConstraint(error: unknown): boolean {
  return (
    error instanceof Error && error.message.toLowerCase().includes("unique")
  );
}

export function formatLocalDate(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join("-");
}