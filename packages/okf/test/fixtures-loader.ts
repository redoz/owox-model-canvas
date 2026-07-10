import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("./fixtures/google", import.meta.url));

/** Load a vendored Google OKF bundle as { relativePath: markdown }. */
export function loadBundle(name: string): Record<string, string> {
  const base = join(ROOT, name);
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      // Normalize to "/" so bundle keys match the format's forward-slash paths
      // on Windows too (relative() yields "\" separators there).
      else if (e.name.endsWith(".md")) out[relative(base, p).split(sep).join("/")] = readFileSync(p, "utf8");
    }
  };
  walk(base);
  return out;
}
