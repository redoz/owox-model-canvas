export * from "./types";
export { slugify, parseFrontmatter, renderFrontmatter } from "./slug";
export { serializeBundle, type OkfBundle } from "./serialize";
export { parseBundle } from "./parse";
export { migrateGraph, isLegacyGraph, endsFromCardinality, migrateAttributeMultiplicityDelimiter } from "./migrate";
export {
  isValidMultiplicity, parseAttributeLine, parseValueLine, parseRelationshipLine,
  renderAttributeLine, renderRelationshipLine,
} from "./grammar";
// WASM core entry points — the bundle-as-truth build/edit surface. `initWasm()` is
// async + memoized; the rest are sync after init. (Task 6 retires the TS
// parse/serialize/migrate bodies; these become the sole source of truth.)
export { initWasm, apply_ops, build_model, fmt, split_bundle, validate } from "./wasm/index";
