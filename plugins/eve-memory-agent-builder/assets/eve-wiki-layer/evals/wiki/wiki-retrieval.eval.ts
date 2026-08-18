import { defineEval } from "eve/evals";

export default defineEval({
  description: "The agent uses bounded Wiki tools for source-backed knowledge.",
  async test(t) {
    const turn = await t.send(
      "Inspect the LLM Wiki index and tell me whether any sources have been ingested. Cite the Wiki path."
    );
    turn.calledTool("wiki_read");
    turn.messageIncludes(/wiki\/index\.md|no sources|not ingested/i);
  },
});
