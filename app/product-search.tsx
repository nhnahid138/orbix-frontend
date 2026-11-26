"use client";

import { productImageUrl } from "../lib/product-image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { api, errorMessage, formatMoney } from "../lib/api";
import styles from "./product-search.module.css";

type Match = {
  id: number;
  name: string;
  slug: string;
  category?: { name: string };
  images?: { url: string }[];
  variants?: { priceMinor: number }[];
};
type SearchResult = { term: string; items: Match[]; error?: string };

function SearchIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
}

export default function ProductSearch({ categoryId }: { categoryId?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const term = query.trim();
  const current = result?.term === term ? result : null;

  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: term, limit: "8" });
        if (categoryId) params.set("categoryId", categoryId);
        const { items } = await api<{ items: Match[] }>(`/products?${params}`, { signal: controller.signal });
        if (!controller.signal.aborted) setResult({ term, items });
      } catch (reason) {
        if (!controller.signal.aborted) setResult({ term, items: [], error: errorMessage(reason) });
      }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [term, categoryId]);

  function navigateResults(event: KeyboardEvent<HTMLDivElement>) {
    const links = Array.from(list.current?.querySelectorAll("a") ?? []);
    if (!links.length) return;
    if (event.key === "Enter" && event.target === input.current && !event.nativeEvent.isComposing) {
      event.preventDefault();
      links[0].click();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (event.key === "ArrowDown") links[Math.min(index + 1, links.length - 1)].focus();
      else if (index > 0) links[index - 1].focus();
      else input.current?.focus();
    }
  }

  return <div className={styles.search} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
        <div className={styles.searchRow}>
          <input ref={input} type="search" aria-label="Search the product catalog" placeholder="Search products…" maxLength={100}
            value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} autoComplete="off" />
          <button className={styles.searchBadge} type="button" aria-label="Search products" onClick={() => { input.current?.focus(); setOpen(true); }}><SearchIcon /></button>
        </div>
    {open && <div className={styles.searchBox} onKeyDown={navigateResults}>
        <p className={styles.status} role="status">
          {!term ? "Type a product name to search." : !current ? "Searching…" : current.error ? current.error :
            !current.items.length ? `No products found for “${term}”.` : `Showing ${current.items.length} matching ${current.items.length === 1 ? "product" : "products"}`}
        </p>
        <ul className={styles.results} ref={list}>
          {current?.items.map(product => <li key={product.id}>
            <Link href={`/products/${encodeURIComponent(product.slug)}`} onNavigate={() => setOpen(false)}>
              <span className={styles.photo} aria-hidden="true" style={product.images?.[0]?.url ? {
                backgroundImage: `url(${JSON.stringify(productImageUrl(product.images[0].url))})`,
              } : undefined}>{!product.images?.[0]?.url && product.name.charAt(0)}</span>
              <span className={styles.label}><strong>{product.name}</strong>{product.category && <small>{product.category.name}</small>}</span>
              {product.variants?.[0] && <b className={styles.price}>{formatMoney(product.variants[0].priceMinor)}</b>}
            </Link>
          </li>)}
        </ul>
      </div>}
  </div>;
}
