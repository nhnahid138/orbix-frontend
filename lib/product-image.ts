export function productImageUrl<T extends string | null | undefined>(url: T): T | string {
  if (!url) return url;
  const path = url.replace(/^https?:\/\/api\.orbixbd\.tech(?=\/media\/products\/)/i, "");
  if (!path.startsWith("/media/products/")) return url;
  const origin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return origin ? origin + path : url;
}
