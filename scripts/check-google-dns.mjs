import { Resolver } from "node:dns/promises";
const domain="dgi-pravo.ru";
const expected="google-site-verification=pZjban-wG8sO1cEu6E3rvzvXcNIdG3dU6A8SK5gmHfA";
let any=false;
for(const [name,server] of [["Cloudflare","1.1.1.1"],["Google","8.8.8.8"]]){
 const r=new Resolver();
 r.setServers([server]);
 try{
  const rows=await r.resolveTxt(domain);
  const flat=rows.map(parts=>parts.join(""));
  const present=flat.includes(expected);
  console.log(JSON.stringify({provider:name,domain,txtRecords:flat.length,verificationPresent:present}));
  any ||= present;
 }catch(e){console.log(JSON.stringify({provider:name,domain,error:e.code||e.message}));}
}
if(!any){console.error("Google verification TXT not found yet on public resolvers");process.exitCode=1;}
