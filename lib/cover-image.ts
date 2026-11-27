export function coverImageUrl(value: string, folder: "banners" | "categories") {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return value;
  try {
    const image = new URL(value, base);
    const host = new URL(base).hostname;
    if ([host, "api.orbixbd.tech", "localhost", "127.0.0.1", "[::1]"].includes(image.hostname)
      && image.pathname.startsWith(`/media/${folder}/`)) {
      return image.pathname + image.search;
    }
  } catch {
    return value;
  }
  return value;
}
