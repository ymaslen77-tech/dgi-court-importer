import type { CollectionConfig } from "payload";
import { canEdit, getRole, signedIn } from "../access";
import { assertPreviouslyApprovedForPublication } from "../lib/editorial-approval";

const protectedFields = ["slug","title","description","seoTitle","seoDescription","blocks","sourceUrls","kind"] as const;
const changed = (data: Record<string, unknown>, oldDoc: Record<string, unknown>) =>
  protectedFields.some((key) => key in data && JSON.stringify(data[key]) !== JSON.stringify(oldDoc[key]));

export const EditorialEntries: CollectionConfig = {
  slug: "editorial-entries",
  labels: { singular: "Публикация", plural: "Публикации" },
  admin: { useAsTitle: "title", defaultColumns: ["title","kind","reviewState","_status"] },
  versions: { drafts: true, maxPerDoc: 30 },
  access: {
    create: canEdit,
    read: signedIn, // No public Payload API access; web projection is separately reviewed.
    update: ({req}) => Boolean(getRole(req.user)),
    delete: ({req}) => getRole(req.user)==="admin",
  },
  hooks: {
    beforeChange: [({ data, originalDoc, req }) => {
      const role = getRole(req.user);
      const privateImport = process.env.CMS_PRIVATE_IMPORT === "yes" &&
        ["webflow-public-pages","dgi-curated-drafts"].includes(String(req.context?.migrationSource ?? ""));
      if (!role && !privateImport) throw new Error("Authenticated CMS staff account required");
      const record = data as Record<string, unknown>;
      if (privateImport) {
        // Only an explicitly enabled local import may bypass staff auth.
        // It can never create a published or approved document.
        record._status = "draft";
        record.reviewState = "needs-review";
        record.reviewedBy = null;
        record.reviewedAt = null;
        return record;
      }
      const previous = (originalDoc ?? {}) as Record<string, unknown>;
      const edited = changed(record, previous);
      if (role === "editor") {
        if (record._status === "published") throw new Error("Editors may save drafts only");
        record.reviewState = "needs-review";
        record.reviewedBy = null;
        record.reviewedAt = null;
      }
      if (role === "reviewer" && record._status === "published")
        throw new Error("Reviewers cannot publish");
      // Approval is invalidated whenever legal or SEO content changes.
      if (edited) {
        if (record._status === "published") throw new Error("Content must be reviewed before publication");
        record.reviewState = "needs-review";
        record.reviewedBy = null;
        record.reviewedAt = null;
      } else if ((role === "reviewer" || role === "admin") &&
        record.reviewState === "approved" && previous.reviewState !== "approved") {
        record.reviewedBy = String(req.user?.id ?? "");
        record.reviewedAt = new Date().toISOString();
      }
      if (record._status === "published") {
        if (role !== "admin" && role !== "publisher") throw new Error("Publisher role required");
        assertPreviouslyApprovedForPublication(record, previous, edited);
      }
      return record;
    }],
  },
  fields: [
    { name: "kind", type: "select", required: true, options: [
      {label:"Раздел",value:"landing"}, {label:"Руководство",value:"guide"},
      {label:"Новости",value:"news"}, {label:"Нормативные документы",value:"normative"},
      {label:"Юридические ситуации",value:"situation"},
    ]},
    { name: "slug", type: "text", unique: true, required: true },
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "seoTitle", type: "text", required: true },
    { name: "seoDescription", type: "textarea" },
    { name: "sourceUrls", type: "array", fields: [{name:"url",type:"text",required:true}] },
    { name: "blocks", type: "array", fields: [
      {name:"kind",type:"select",required:true,options:["h1","h2","h3","h4","p","link"]},
      {name:"text",type:"textarea",required:true},
      {name:"href",type:"text"},
    ]},
    { name:"reviewState",type:"select",required:true,defaultValue:"needs-review",
      options:[{label:"На проверке",value:"needs-review"},{label:"Подтверждено",value:"approved"}],
      access:{create: ({req}) => ["admin","reviewer"].includes(getRole(req.user) || ""),
              update: ({req}) => ["admin","reviewer"].includes(getRole(req.user) || "")},
    },
    { name:"reviewedBy",type:"text",admin:{readOnly:true},
      access:{create:()=>false, update:()=>false} },
    { name:"reviewedAt",type:"date",admin:{readOnly:true},
      access:{create:()=>false,update:()=>false} },
  ],
};
