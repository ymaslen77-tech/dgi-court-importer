const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const items=[];
fs.mkdirSync('test-results',{recursive:true});
for(const [path,tag] of [['/','home'],['/gosuslugi-dgi','services'],['/kontakty-dgi','contacts'],['/sudebnaya-praktika-dgi','cases']]){
  for(const mode of ['mobile','desktop']){
    const output='test-results/lighthouse-'+tag+'-'+mode+'.json';
    try{
      const args=['lighthouse','https://dgimos.webflow.io'+path,
        '--output=json','--output-path='+output,'--only-categories=performance',
        '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage','--quiet'];
      if(mode==='desktop')args.push('--preset=desktop');
      execFileSync('npx',args,{stdio:'pipe',timeout:180000,encoding:'utf8'});
      const data=JSON.parse(fs.readFileSync(output,'utf8')), audit=data.audits;
      const m={path,mode,score:Math.round(data.categories.performance.score*100),
        LCP:audit['largest-contentful-paint']?.numericValue,
        FCP:audit['first-contentful-paint']?.numericValue,
        TBT:audit['total-blocking-time']?.numericValue,
        CLS:audit['cumulative-layout-shift']?.numericValue,
        SpeedIndex:audit['speed-index']?.numericValue,
        transferSize:audit['total-byte-weight']?.numericValue,
        url:data.finalDisplayedUrl||data.finalUrl,fetchTime:data.fetchTime};
      items.push(m);console.log('PERFORMANCE '+JSON.stringify(m));
    }catch(e){console.log('PERFORMANCE ERROR '+path+' '+mode+' '+String(e)+' '+String(e.stdout||'').slice(-1500)+' '+String(e.stderr||'').slice(-1500)); items.push({path,mode,error:String(e)});}
  }
}
fs.writeFileSync('test-results/performance-summary.json',JSON.stringify(items,null,2));
if(items.some(x=>x.error)) process.exitCode=1;
