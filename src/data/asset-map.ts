// Maps stored image keys (e.g. "resource-notes.jpg", "sellers/student-5.jpg")
// to the bundled asset URLs so backend rows can reference images by name.
const modules = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const byName = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  const relative = path.replace("/src/assets/", "");
  byName.set(relative, url);
  const file = relative.split("/").pop();
  if (file && !byName.has(file)) byName.set(file, url);
}

export function resolveAsset(value: string | null | undefined): string {
  if (!value) return "";
  if (/^(https?:|data:|blob:|\/)/.test(value)) return value;
  return byName.get(value) ?? value;
}
