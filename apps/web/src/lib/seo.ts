export const siteName = "Единая справочная служба Москвы по жилищным вопросам";

export function siteOrigin(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      return "http://localhost:3000";
    }
    return parsed.origin;
  } catch {
    return "http://localhost:3000";
  }
}

// Explicit launch gate. Staging must not compete with the existing Webflow site.
export const indexingEnabled = process.env.PUBLIC_INDEXING_ENABLED === "true";

export const robotsRule = {
  index: indexingEnabled,
  follow: indexingEnabled,
} as const;
