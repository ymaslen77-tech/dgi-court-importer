import type { CollectionConfig } from "payload";
import { adminOnly, signedIn } from "../access";

// Metadata-only Webflow archive for editorial reconciliation.
// Separate from public articles and court findings. No publication workflow.
export const WebflowCmsReview: CollectionConfig = {
  slug: "webflow-cms-review",
  labels: {singular:"Источник Webflow",plural:"Очередь проверки Webflow"},
  admin: {useAsTitle:"title",defaultColumns:["title","sourceCollection","legacyStatus"]},
  access: {
    read:signedIn,
    create:adminOnly,
    update:adminOnly,
    delete:adminOnly,
  },
  fields: [
    {name:"sourceKey",type:"text",required:true,unique:true,admin:{readOnly:true}},
    {name:"sourceCollection",type:"select",required:true,options:[
      {label:"Судебные дела",value:"dgi-court-cases"},
      {label:"Нормативные документы",value:"dgi-legal-documents"},
      {label:"Юридические ситуации",value:"dgi-legal-situations"},
      {label:"Новости",value:"housing-law-news"},
    ],admin:{readOnly:true}},
    {name:"sourceItemId",type:"text",required:true,admin:{readOnly:true}},
    {name:"sourceSlug",type:"text",required:true,admin:{readOnly:true}},
    {name:"title",type:"text",required:true,admin:{readOnly:true}},
    {name:"legacyStatus",type:"select",required:true,options:[
      {label:"Был публичным, не проверен",value:"legacy_public_unverified"},
      {label:"Черновик",value:"draft"},
    ],admin:{readOnly:true}},
    {name:"sourceMetadata",type:"json",required:true,admin:{readOnly:true}},
    {name:"editorialNote",type:"textarea"},
    {name:"reconciliationStatus",type:"select",required:true,defaultValue:"pending",
      options:[{label:"Требуется проверка",value:"pending"},{label:"Сверено с источником",value:"reconciled"}]},
  ],
};
