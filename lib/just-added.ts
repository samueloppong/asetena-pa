/** Listings newer than this window show the "Just added" badge. */
export const JUST_ADDED_HOURS = 48;

export function isJustAdded(
  createdAt: string | Date | null | undefined,
  withinHours = JUST_ADDED_HOURS
): boolean {
  if (!createdAt) return false;
  const created =
    typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created <= withinHours * 60 * 60 * 1000;
}
