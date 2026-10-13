import type { CollectionConfig } from "payload";
import { adminOnly, getRole, signedIn } from "../access";

export const Users: CollectionConfig = {
  slug: "staff-users",
  auth: { maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  admin: { useAsTitle: "email" },
  access: {
    create: adminOnly, // No public self-registration or unauthenticated first-user signup.
    read: ({ req }) => getRole(req.user) === "admin" ? true : req.user ? { id: { equals: req.user.id } } : false,
    update: adminOnly,
    delete: adminOnly,
    admin: signedIn,
  },
  fields: [
    { name: "role", type: "select", required: true, defaultValue: "editor",
      options: [
        { label: "Администратор", value: "admin" },
        { label: "Редактор", value: "editor" },
        { label: "Проверяющий", value: "reviewer" },
        { label: "Публикатор", value: "publisher" },
      ],
      access: { create: ({req}) => getRole(req.user)==="admin",
                update: ({req}) => getRole(req.user)==="admin" },
    },
    { name: "displayName", type: "text", required: true },
  ],
};
