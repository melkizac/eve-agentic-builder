import { defineExtension } from "eve/extension";
import { z } from "zod";

export default defineExtension({
  config: z.object({
    databaseUrl: z.string().min(1),
    namespace: z.string().min(1).max(80).default("default"),
    projectId: z.string().min(1).max(120),
    maxBriefItems: z.number().int().min(0).max(20).default(8),
    captureReasoning: z.boolean().default(false),
    maxEventBytes: z.number().int().min(1024).max(1_000_000).default(64_000),
    allowDevelopmentScope: z.boolean().default(false),
    developmentTenantId: z.string().min(1).default("local"),
    developmentUserId: z.string().min(1).default("local-user")
  })
});
