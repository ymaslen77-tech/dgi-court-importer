import {defineConfig} from "@playwright/test";

export default defineConfig({
  testDir:"./e2e",
  timeout:30000,
  expect:{timeout:8000},
  retries:process.env.CI?1:0,
  workers:process.env.CI?2:undefined,
  reporter:process.env.CI?"github":"list",
  use:{
    baseURL:"http://127.0.0.1:3000",
    trace:"retain-on-failure",
    screenshot:"only-on-failure",
  },
  projects:[
    {name:"desktop-chromium",use:{
      browserName:"chromium",viewport:{width:1280,height:800},
    }},
    {name:"mobile-chromium",use:{
      browserName:"chromium",viewport:{width:390,height:844},
      isMobile:true,hasTouch:true,deviceScaleFactor:1,
    }},
  ],
  webServer:{
    command:"pnpm start --hostname 127.0.0.1 --port 3000",
    url:"http://127.0.0.1:3000/api/health",
    reuseExistingServer:!process.env.CI,
    timeout:120000,
    env:{
      SITE_CUTOVER:"false",SITE_RELEASE_APPROVED:"no",
      CMS_PUBLIC_READS:"false",COURT_DB_READS:"false",
    },
  },
});
