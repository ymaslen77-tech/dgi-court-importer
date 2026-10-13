import type { CollectionConfig } from "payload";
import { adminOnly } from "../access";

// Private source snapshots are NOT editorial entries and are never public.
// Raw HTML, case material and unverified claims may contain personal data.
export const WebflowPrivateSources: CollectionConfig = {
  slug: "webflow-private-sources",
  labels: {
    singular: "Закрытый оригинал Webflow",
    plural: "Закрытые оригиналы Webflow",
  },
  admin: {
    useAsTitle: "sourceKey",
    defaultColumns: ["sourceKey", "sourceCollection", "sourceStatus"],
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: "sourceKey", type: "text", required: true, unique: true,
      admin: { readOnly: true } },
    { name: "sourceCollection", type: "select", required: true,
      options: [
        { label: "Судебная практика", value: "dgi-court-cases" },
        { label: "Нормативные документы", value: "dgi-legal-documents" },
        { label: "Юридические ситуации", value: "dgi-legal-situations" },
        { label: "Новости", value: "housing-law-news" },
      ], admin: { readOnly: true } },
    { name: "sourceItemId", type: "text", required: true,
      admin: { readOnly: true } },
    { name: "sourceSlug", type: "text", required: true,
      admin: { readOnly: true } },
    { name: "sourceStatus", type: "select", required: true,
      options: [
        { label: "Черновик источника", value: "draft" },
        { label: "Был опубликован в Webflow — не проверен", value: "legacy_public_unverified" },
      ], admin: { readOnly: true } },
    { name: "sourceUpdatedAt", type: "date",
      admin: { readOnly: true } },
    { name: "sourceDigest", type: "text", required: true,
      admin: { readOnly: true } },
    { name: "sourceFields", type: "json", required: true,
      admin: { readOnly: true } },
    { name: "editorialNote", type: "textarea" },
  ],
};
