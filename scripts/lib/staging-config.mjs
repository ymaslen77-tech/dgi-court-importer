// A fail-closed configuration check for isolated NON-production staging.
// Never print secret values or connection URLs.
function databaseIdentity(value) {
  try {
    const u=new URL(value);
    if(!["postgresql:","postgres:"].includes(u.protocol)||!u.hostname||
       !u.pathname||u.pathname==="/"||!u.username||!u.password) return null;
    return [u.hostname.toLowerCase(),u.port||"5432",decodeURIComponent(u.pathname)].join("|");
  } catch {return null;}
}
export function validateStagingConfig(env) {
  const issues=[];
  const add=(id,message)=>issues.push({id,message});
  if(env.SITE_CUTOVER!=="false")add("cutover","SITE_CUTOVER must be false");
  if(env.SITE_RELEASE_APPROVED==="yes")
    add("release","Production approval must stay disabled on staging");
  if(env.CMS_PUBLIC_READS!=="false")
    add("cmsReads","Public CMS reads must start disabled during staging import");
  if(env.COURT_DB_READS!=="false")
    add("courtReads","Court database reads must start disabled");
  const cms=databaseIdentity(env.CMS_DATABASE_URL);
  const web=databaseIdentity(env.DATABASE_URL);
  if(!cms)add("cmsDatabase","Invalid/missing dedicated CMS PostgreSQL URL");
  if(!web)add("siteDatabase","Invalid/missing website PostgreSQL URL");
  if(cms&&web&&cms===web)add("sharedDatabase","CMS and website must use different databases");
  if(!env.PAYLOAD_SECRET||env.PAYLOAD_SECRET.length<32||
     /^(replace|change|example|test)/i.test(env.PAYLOAD_SECRET))
    add("cmsSecret","CMS needs a strong, unique production-grade secret");
  if(!env.CMS_POSTGRES_PASSWORD||env.CMS_POSTGRES_PASSWORD.length<20||
     /^(replace|change|example|test)/i.test(env.CMS_POSTGRES_PASSWORD))
    add("cmsPassword","CMS PostgreSQL password is missing or insecure");
  if(!env.POSTGRES_PASSWORD||env.POSTGRES_PASSWORD.length<20||
     /^(replace|change|example|test)/i.test(env.POSTGRES_PASSWORD))
    add("webPassword","Website PostgreSQL password is missing or insecure");
  if(env.CMS_POSTGRES_PASSWORD&&env.CMS_POSTGRES_PASSWORD===env.POSTGRES_PASSWORD)
    add("passwordReuse","CMS and website database passwords must differ");
  // Explicitly reject binding a public site to a test release.
  if(env.NODE_ENV==="production"&&env.SITE_CUTOVER==="true")
    add("production","Staging must never act as the production site");
  return {ok:issues.length===0,issues};
}
