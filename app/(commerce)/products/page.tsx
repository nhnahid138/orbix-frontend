"use client";

import { coverImageUrl } from "../../../lib/cover-image";
import { productImageUrl } from "../../../lib/product-image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, errorMessage, formatMoney } from "../../../lib/api";
import { addGuestLine } from "../../../lib/guest-cart";
import styles from "./catalog.module.css";

type Product = { id: number; name: string; slug: string; description?: string; category?: { id: number; name: string; slug?: string; description?: string | null; coverImageUrl?: string | null; parent?: { id: number } | null }; images?: { url: string; alt?: string }[]; variants?: { id: number; sku: string; name?: string; priceMinor: number; compareAtMinor?: number; stockQuantity: number; attributes?: Record<string,string> }[] };
type Result = { items: Product[]; total: number; page: number; limit: number };
type Category = NonNullable<Product["category"]>;

type Variant = NonNullable<Product["variants"]>[number];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get("categoryId");
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let live = true;
    api<Category[]>("/categories").then((value) => {
      if (live) setCategories(value);
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "48" });
    if (categoryId) params.set("categoryId", categoryId);
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "newest") params.set("sort", sort);

    api<Result>(`/products?${params}`)
      .then((result) => { if (live) setItems(result.items ?? []); })
      .catch((reason) => { if (live) setError(errorMessage(reason)); })
      .finally(() => { if (live) setLoading(false); });

    return () => { live = false; };
  }, [query, sort, categoryId]);

  const category = categories.find((item) => String(item.id) === categoryId);
  const parent = categories.find((item) => item.id === category?.parent?.id);

  function purchase(product: Product, variant: Variant, checkout: boolean) {
    if (variant.stockQuantity <= 0) return;
    try {
      addGuestLine({
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: productImageUrl(product.images?.[0]?.url) ?? "",
        sku: variant.sku,
        priceMinor: variant.priceMinor,
        quantity: 1,
        attributes: variant.attributes,
      });
    } catch {
      setNotice("Could not save this item to your cart. Please try again.");
      return;
    }
    if (checkout) router.push("/checkout");
    else setNotice(`${product.name} added to your cart.`);
  }

  return (
    <div className={`store-page ${styles.catalog}`}>
      {category && (
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/products">All gadgets</Link>
          <span aria-hidden="true">›</span>
          {parent && <><Link href={`/products?categoryId=${parent.id}`}>{parent.name}</Link><span aria-hidden="true">›</span></>}
          <span aria-current="page">{category.name}</span>
        </nav>
      )}
      {category?.coverImageUrl && (
        <img className={`category-hero ${styles.cover}`} src={coverImageUrl(category.coverImageUrl, "categories")} alt="" />
      )}
      <header className={styles.heading}>
        <h1>{category?.name ?? "All gadgets"}</h1>
        {category?.description && <p>{category.description}</p>}
      </header>

      <div className={styles.controls}>
        <label className={styles.search}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input type="search" aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={category ? `Search ${category.name}…` : "Search gadgets…"} />
        </label>
        <label className={styles.sort}>Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Recently added</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading ? (
        <div className={styles.grid} aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : !error && (items.length ? (
        <div className={styles.grid}>
          {items.map((product) => {
            const variants = product.variants ?? [];
            const variant = variants.find((option) => option.stockQuantity > 0) ?? variants[0];
            const available = variant && variant.stockQuantity > 0;
            const image = productImageUrl(product.images?.[0]?.url);
            const href = `/products/${product.slug}`;
            const savings = variant ? (variant.compareAtMinor ?? 0) - variant.priceMinor : 0;

            return (
              <article className={styles.card} key={product.id}>
                <Link href={href} className={styles.image} aria-label={`View ${product.name}`}>
                  {image ? <img src={image} alt="" loading="lazy" /> : <span className={styles.placeholder}>Orbix</span>}
                  <span className={styles.stock} data-available={!!available}>{available ? "In stock" : "Sold out"}</span>
                </Link>
                <div className={styles.cardBody}>
                  {product.category && <span className={styles.category}>{product.category.name}</span>}
                  <h2><Link href={href}>{product.name}</Link></h2>
                  <div className={styles.price}>
                    <strong>{variant ? formatMoney(variant.priceMinor) : "Price on request"}</strong>
                    {savings > 0 && variant?.compareAtMinor != null && <del>{formatMoney(variant.compareAtMinor)}</del>}
                  </div>
                  <div className={styles.actions}>
                    <button type="button" aria-label={`Add ${product.name} to cart`} disabled={!available} onClick={() => variant && purchase(product, variant, false)}>Add to cart</button>
                    <button type="button" aria-label={`Buy ${product.name} now`} disabled={!available} onClick={() => variant && purchase(product, variant, true)}>Buy now <span aria-hidden="true">↗</span></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="catalog-empty" aria-labelledby="catalog-empty-title">
          <h2 id="catalog-empty-title">{query.trim() ? "No matching products" : category ? `No products in ${category.name} yet` : "No products found"}</h2>
          {query.trim()
            ? <button type="button" className="catalog-empty-action" onClick={() => setQuery("")}>Clear search</button>
            : <Link className="catalog-empty-action" href={category ? "/products" : "/"}>{category ? "Explore all products" : "Back to home"}</Link>}
        </section>
      ))}
      {notice && (
        <div className="toast" role="status">
          {notice}<Link href="/cart">View cart</Link>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      )}
    </div>
  );
}
