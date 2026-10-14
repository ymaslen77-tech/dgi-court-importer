import type { CollectionConfig } from "payload";
import { canEdit, signedIn } from "../access";
import { getRole } from "../access";
// Court references deliberately contain no claim about judgments or litigants.
export const CourtReferences: CollectionConfig = {
  slug: "court-references",
  labels: { singular: "Судебная карточка", plural: "Судебные карточки" },
  admin: { useAsTitle: "caseNumber" },
  access: {
    create: canEdit, read: signedIn, update: canEdit,
    delete: ({req}) => getRole(req.user)==="admin",
  },
  fields: [
    {name:"caseNumber",type:"text",required:true},
    {name:"courtName",type:"text",required:true},
    {name:"uid",type:"text"},
    {name:"category",type:"text"},
    {name:"officialUrl",type:"text"},
    {name:"verification",type:"select",defaultValue:"metadata-only",required:true,
      options:[{label:"Только метаданные",value:"metadata-only"},{label:"Источник проверен",value:"source-checked"}],
      access: {create: ({req})=>["admin","reviewer"].includes(getRole(req.user)||""),
               update:({req})=>["admin","reviewer"].includes(getRole(req.user)||"")},
    },
    {name:"checkedAt",type:"date"},
  ],
};
