import type { CollectionConfig } from "payload";
import { canEdit, getRole, signedIn } from "../access";
// Local media is staging-only; use S3-compatible storage before any production deployment.
export const Media: CollectionConfig = {
  slug: "media",
  upload: { staticDir: "media", mimeTypes: ["image/jpeg","image/png","image/webp","image/avif","image/svg+xml"] },
  admin: { useAsTitle: "alt" },
  access: {
    create: canEdit, update: canEdit, read: signedIn,
    delete: ({req})=>getRole(req.user)==="admin",
  },
  fields: [
    {name:"alt",type:"text",required:true},
    {name:"originalSource",type:"text",required:true},
    {name:"rightsNote",type:"textarea",required:true},
    {name:"rightsVerified",type:"checkbox",defaultValue:false,
      access:{create:({req})=>["admin","reviewer"].includes(getRole(req.user)||""),
              update:({req})=>["admin","reviewer"].includes(getRole(req.user)||"")}},
  ],
};
