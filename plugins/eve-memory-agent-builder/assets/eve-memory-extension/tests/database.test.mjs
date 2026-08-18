import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createPGliteDatabase } from "../dist/extension/lib/database.mjs";

test("PGlite persists local memory and commits transactions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eve-memory-pglite-"));
  try {
    const first = await createPGliteDatabase(root);
    await first.query("create table memory_smoke (id text primary key, content text not null)");
    await first.query("insert into memory_smoke (id, content) values ($1, $2)", [
      "preference",
      "concise"
    ]);
    await first.close();

    const second = await createPGliteDatabase(root);
    const persisted = await second.query(
      "select id, content from memory_smoke where id = $1",
      ["preference"]
    );
    assert.deepEqual(persisted, [{ id: "preference", content: "concise" }]);

    await second.transaction(async (tx) => {
      await tx.query("update memory_smoke set content = $1 where id = $2", [
        "scan-first",
        "preference"
      ]);
    });
    const updated = await second.query(
      "select content from memory_smoke where id = $1",
      ["preference"]
    );
    assert.equal(updated[0]?.content, "scan-first");
    await second.close();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
