import type { Access } from "payload";

export type EditorialRole = "admin" | "editor" | "reviewer" | "publisher";
export function getRole(user: unknown): EditorialRole | undefined {
  if (!user || typeof user !== "object") return undefined;
  const role = (user as { role?: unknown }).role;
  return role === "admin" || role === "editor" || role === "reviewer" || role === "publisher" ? role : undefined;
}
export const adminOnly: Access = ({ req }) => getRole(req.user) === "admin";
export const signedIn: Access = ({ req }) => Boolean(getRole(req.user));
export const canEdit: Access = ({ req }) => {
  const role = getRole(req.user);
  return role === "admin" || role === "editor" || role === "reviewer";
};
export const canReview: Access = ({ req }) => {
  const role = getRole(req.user);
  return role === "admin" || role === "reviewer";
};
export const canPublish: Access = ({ req }) => {
  const role = getRole(req.user);
  return role === "admin" || role === "publisher";
};
