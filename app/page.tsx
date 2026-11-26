import { productImageUrl } from "../lib/product-image";
import Storefront, { type StoreProduct } from "./storefront";
import { Suspense } from "react";
import { connection } from "next/server";
import FeaturedCategories from "./featured-categories";
import BannerCarousel from "./banner-carousel";

const fallbackProducts: StoreProduct[] = [
  { id: "p1", name: "Nova X Pro Smartphone", slug: "nova-x-pro-smartphone", price: 84990, compareAtPrice: 92990, category: "Smartphones", image: "https://images.unsplash.com/photo-1511707267537-b85faf000f8b?auto=format&fit=crop&w=900&q=85", badge: "BESTSELLER", tone: "sand" },
  { id: "p2", name: "Sonic Pro Wireless Headphones", slug: "sonic-pro-wireless-headphones", price: 12990, compareAtPrice: null, category: "Audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", badge: "NEW ARRIVAL", tone: "sage" },
  { id: "p3", name: "AirBook 14 Creator Laptop", slug: "airbook-14-creator-laptop", price: 124990, compareAtPrice: null, category: "Laptops", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85", badge: "", tone: "clay" },
  { id: "p4", name: "Pulse Active Smartwatch", slug: "pulse-active-smartwatch", price: 8990, compareAtPrice: null, category: "Wearables", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85", badge: "LIMITED", tone: "blue" },
];

export type StoreBanner = { id?: number; eyebrow: string; title: string; subtitle: string | null; imageUrl: string; ctaLabel: string; ctaHref: string; sortOrder?: number };
export type StoreCategory = { id: number; name: string; slug: string; description?: string | null; mainImageUrl?: string | null };
type ApiProduct = { isFeatured?: boolean; id: number; name: string; slug: string; category?: { name: string } | null; variants?: { id: number; priceMinor: number; compareAtMinor?: number | null }[]; images?: { url: string }[] };
const fallbackBanners: StoreBanner[] = [
  { eyebrow: "THE NEXT GENERATION IS HERE", title: "Your world.\nUpgraded.", subtitle: "Discover the latest smartphones, laptops and everyday tech, all in one place.", imageUrl: "https://images.unsplash.com/photo-1511707267537-b85faf000f8b?auto=format&fit=crop&w=2200&q=90", ctaLabel: "Explore gadgets", ctaHref: "#shop", sortOrder: 0 },
  { eyebrow: "SOUND THAT MOVES WITH YOU", title: "Find your\nfrequency.", subtitle: "Immersive audio and accessories for wherever the day takes you.", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=2200&q=90", ctaLabel: "Shop audio", ctaHref: "#shop", sortOrder: 1 },
  { eyebrow: "BUILT FOR WHAT'S NEXT", title: "Power up\nyour everyday.", subtitle: "Meet the smart devices that make more of every moment.", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=2200&q=90", ctaLabel: "Find your tech", ctaHref: "#shop", sortOrder: 2 },
];

async function getProducts(): Promise<StoreProduct[]> {
  await connection();
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return process.env.NODE_ENV === "production" ? [] : fallbackProducts;
  try {
    const items: ApiProduct[] = [];
    for (let page = 1; ; page++) {
      const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/products?limit=100&sort=created&page=${page}`);
      if (!response.ok) throw new Error("Catalog unavailable");
      const result = await response.json() as { items: ApiProduct[]; total: number };
      items.push(...result.items);
      if (!result.items.length || items.length >= result.total) break;
    }
    return items.map((product, index) => {
      const variant = product.variants?.[0];
      return {
        id: String(product.id), isFeatured: !!product.isFeatured, name: product.name, slug: product.slug,
        productId: Number(product.id), variantId: variant?.id ? Number(variant.id) : undefined,
        price: Number(variant?.priceMinor ?? 0) / 100,
        compareAtPrice: variant?.compareAtMinor ? Number(variant.compareAtMinor) / 100 : null,
        category: product.category?.name ?? "Objects",
        image: productImageUrl(product.images?.[0]?.url) ?? fallbackProducts[index % fallbackProducts.length].image,
        badge: index === 0 ? "JUST DROPPED" : "", tone: fallbackProducts[index % fallbackProducts.length].tone,
      };
    });
  } catch {
    return process.env.NODE_ENV === "production" ? [] : fallbackProducts;
  }
}

async function getBanners(): Promise<StoreBanner[]> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return process.env.NODE_ENV === "production" ? [] : fallbackBanners;
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/banners`, { cache: "no-store" });
    if (!response.ok) return process.env.NODE_ENV === "production" ? [] : fallbackBanners;
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map((banner: StoreBanner) => {
      const image = new URL(banner.imageUrl, base);
      // Serve files from our upload directory through the storefront, including older localhost URLs.
      if (/^\/media\/banners\/[a-f0-9-]+\.(jpg|png|webp|avif)$/i.test(image.pathname)
        && (image.origin === new URL(base).origin || ["localhost", "127.0.0.1", "[::1]"].includes(image.hostname))) {
        return { ...banner, imageUrl: image.pathname };
      }
      return banner;
    });
  } catch {
    return process.env.NODE_ENV === "production" ? [] : fallbackBanners;
  }
}

async function getCategories(): Promise<StoreCategory[]> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return [];
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/categories`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function HomepageBanners() {
  await connection();
  return <BannerCarousel banners={await getBanners()} />;
}

async function HomepageCategories() {
  await connection();
  return <FeaturedCategories categories={await getCategories()} />;
}

export default function Home() {
  return <Suspense fallback={<main aria-busy="true" aria-label="Loading store" />}><HomeCatalog /></Suspense>;
}

async function HomeCatalog() {
  const products = await getProducts();
  return <Storefront products={products} hero={<Suspense fallback={<div className="hero home-banner" aria-label="Loading banners" />}><HomepageBanners /></Suspense>} categories={<Suspense fallback={null}><HomepageCategories /></Suspense>} />;
}
