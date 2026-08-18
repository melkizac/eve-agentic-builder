import type { SessionAuth } from "eve/context";

import extension from "../extension";
import type { MemoryScope } from "./types";

interface MemoryScopeContext {
  readonly session: {
    readonly id: string;
    readonly auth: SessionAuth;
  };
}

export function requireMemoryScope(ctx: MemoryScopeContext): MemoryScope {
  const caller = ctx.session.auth.current;
  const tenantId = caller?.attributes?.tenantId;

  if (caller?.principalType === "user" && typeof tenantId === "string" && tenantId.length > 0) {
    return {
      namespace: extension.config.namespace,
      tenantId,
      userId: caller.principalId,
      projectId: extension.config.projectId
    };
  }

  if (extension.config.allowDevelopmentScope && process.env.NODE_ENV !== "production") {
    return {
      namespace: extension.config.namespace,
      tenantId: extension.config.developmentTenantId,
      userId: extension.config.developmentUserId,
      projectId: extension.config.projectId
    };
  }

  throw new Error(
    "Memory requires an authenticated user with a tenantId attribute. " +
      "Use allowDevelopmentScope only for non-production local development."
  );
}
