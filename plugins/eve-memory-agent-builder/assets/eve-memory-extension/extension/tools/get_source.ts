import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireMemoryScope } from "../lib/scope";
import { getMemorySource } from "../lib/store";

export default defineTool({
  description: "Retrieve provenance for one memory before relying on it in a consequential answer.",
  inputSchema: z.object({ id: z.string().uuid() }),
  async execute({ id }, ctx) {
    return await getMemorySource(requireMemoryScope(ctx), id);
  }
});
