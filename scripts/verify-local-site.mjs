#!/usr/bin/env node
// Read-only local website database acceptance; never connects to remote hosts.
import pg from "pg";
const raw=process.env.DATABASE_URL;
let url;
try{url=new URL(raw||"");}catch{throw Error("Invalid website DB URL");}
if(process.env.LOCAL_VERIFY_CONFIRM!=="yes" ||
   process.env.SITE_CUTOVER!=="false" ||
   url.protocol!=="postgresql:" ||
   url.hostname!=="127.0.0.1" || url.port!=="5434" ||
   url.pathname!=="/housing")
  throw Error("Refusing any database other than explicit local housing staging DB");
const client=new pg.Client({connectionString:raw,connectionTimeoutMillis:5000});
await client.connect();
try{
  const count=async(sql)=>Number((await client.query(sql)).rows[0].count);
  const pages=await count("SELECT count(*) FROM editorial_pages");
  const source=await count("SELECT count(*) FROM webflow_cms_staging");
  const publishedPages=await count("SELECT count(*) FROM editorial_pages WHERE editorial_status='published'");
  const publicCms=await count("SELECT count(*) FROM webflow_cms_staging WHERE publication_allowed=true OR verified=true");
  const publicCases=await count("SELECT count(*) FROM court_cases WHERE editorial_status='published' OR act_verified=true");
  if(pages!==33||source!==50||publishedPages||publicCms||publicCases)
    throw Error(JSON.stringify({pages,source,publishedPages,publicCms,publicCases,
      problem:"Local import count drift or premature publication/verification"}));
  console.log(JSON.stringify({websitePageDrafts:pages,webflowCmsMetadata:source,
    publishedPages,publicCms,publicCases}));
}finally{await client.end();}
