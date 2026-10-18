import {defineConfig} from "@playwright/test";
export default defineConfig({
  testDir:"./visual",timeout:65000,workers:2,retries:0,reporter:"github",
  projects:[
    {name:"desktop",use:{browserName:"chromium",viewport:{width:1280,height:800}}},
    {name:"mobile",use:{browserName:"chromium",viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
  ],
  webServer:{
    command:"pnpm start --hostname 127.0.0.1 --port 3000",
    url:"http://127.0.0.1:3000/api/health",
    reuseExistingServer:false,
    timeout:120000,
    env:{SITE_CUTOVER:"false",SITE_RELEASE_APPROVED:"no",
      CMS_PUBLIC_READS:"false",COURT_DB_READS:"false"},
  },
});
