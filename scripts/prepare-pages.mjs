import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = new URL("../dist/client/", import.meta.url);
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

if (basePath && !basePath.startsWith("/")) {
  throw new Error("NEXT_PUBLIC_BASE_PATH must be empty or start with a slash.");
}

const entries = await readdir(outputDirectory, { withFileTypes: true });
const htmlFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".html"));

for (const entry of htmlFiles) {
  const path = join(outputDirectory.pathname, entry.name);
  const html = await readFile(path, "utf8");
  const prepared = basePath
    ? html.replaceAll("/assets/", `${basePath}/assets/`)
    : html;
  await writeFile(path, prepared);
}
