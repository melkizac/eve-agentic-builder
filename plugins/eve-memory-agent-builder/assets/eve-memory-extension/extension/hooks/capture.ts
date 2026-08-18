import { defineHook } from "eve/hooks";

import extension from "../extension";
import { recordEvent } from "../lib/store";

function boundedData(data: unknown): { value: unknown; truncated: boolean } {
  const serialized = JSON.stringify(data ?? null);
  const max = extension.config.maxEventBytes;
  if (Buffer.byteLength(serialized, "utf8") <= max) {
    return { value: data ?? null, truncated: false };
  }
  return {
    value: { truncatedPreview: serialized.slice(0, Math.max(0, max - 64)) },
    truncated: true
  };
}

export default defineHook({
  events: {
    async "*"(event, ctx) {
      if (!extension.config.captureReasoning && event.type.startsWith("reasoning.")) return;
      const data = "data" in event ? event.data : null;
      const bounded = boundedData(data);
      try {
        await recordEvent({
          namespace: extension.config.namespace,
          sessionId: ctx.session.id,
          eventId: event.meta.id,
          eventType: event.type,
          eventAt: event.meta.at,
          data: bounded.value,
          truncated: bounded.truncated
        });
      } catch (error) {
        console.error("eve-memory capture failed", {
          eventId: event.meta.id,
          eventType: event.type,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
});
