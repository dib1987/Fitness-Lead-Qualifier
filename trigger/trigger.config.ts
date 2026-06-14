import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "your-trigger-project-ref", // set after `npx trigger.dev init`
  dirs: ["./jobs"],
  maxDuration: 600,
});
