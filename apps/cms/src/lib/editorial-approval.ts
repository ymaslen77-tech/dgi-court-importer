// Only a persisted, still-valid review can authorize publication.
// An earlier approved revision must never override explicit revocation.
export function assertPreviouslyApprovedForPublication(
  current: Record<string, unknown>,
  previous: Record<string, unknown>,
  substantiveEdit: boolean,
): void {
  if (substantiveEdit ||
      previous.reviewState !== "approved" ||
      !previous.reviewedBy ||
      !previous.reviewedAt ||
      (current.reviewState !== undefined && current.reviewState !== "approved") ||
      (current.reviewedBy !== undefined &&
       String(current.reviewedBy) !== String(previous.reviewedBy)) ||
      (current.reviewedAt !== undefined &&
       String(current.reviewedAt) !== String(previous.reviewedAt))) {
    throw new Error("Publication requires a previously persisted, unchanged editorial approval");
  }
  const stamp = Date.parse(String(previous.reviewedAt));
  if (!Number.isFinite(stamp) || stamp > Date.now())
    throw new Error("Invalid persisted editorial approval timestamp");
}
