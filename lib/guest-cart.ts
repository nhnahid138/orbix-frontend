export type GuestCartLine = { variantId: number; productId: number; name: string; slug: string; image: string; sku?: string; priceMinor: number; quantity: number; attributes?: Record<string,string> };
const KEY = "orbix_cart_v1";
export function readGuestCart(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try { const data = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(data) ? data : []; } catch { return []; }
}
export function writeGuestCart(lines: GuestCartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("orbix-cart-change"));
}
export function addGuestLine(line: GuestCartLine) {
  const lines = readGuestCart();
  const found = lines.find((item) => item.variantId === line.variantId);
  if (found) found.quantity = Math.min(found.quantity + line.quantity, 99); else lines.push(line);
  writeGuestCart(lines);
}
export function clearGuestCart() { writeGuestCart([]); }
