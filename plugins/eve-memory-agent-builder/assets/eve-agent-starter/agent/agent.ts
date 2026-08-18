import { defineAgent } from "eve";
__MODEL_IMPORT__

export default defineAgent({
  build: {
    externalDependencies: ["@electric-sql/pglite"],
  },
  model: __MODEL_EXPRESSION__,
});
