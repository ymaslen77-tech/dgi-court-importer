#!/usr/bin/env node
import {validateStagingConfig} from "./lib/staging-config.mjs";
const result=validateStagingConfig(process.env);
if(result.ok) console.log("Staging configuration verified; no secrets displayed.");
else {
  for(const issue of result.issues)console.error(issue.id+": "+issue.message);
  process.exitCode=1;
}
