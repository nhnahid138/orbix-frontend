"use client";

import { useMemo, useState, useEffect } from "react";
import { BrandSign, StoreFooter, useBranding } from "./store-branding";
import searchStyles from "./product-search.module.css";
import ProductSearch from "./product-search";
import CategoryNav from "./category-nav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addGuestLine, readGuestCart } from "../lib/guest-cart";
import { useSession } from "./providers";
import { api } from "../lib/api";

export type StoreProduct = {
  id: string; isFeatured?: boolean; productId?: number; variantId?: number; name: string; slug: string; price: number; compareAtPrice: number | null;
  category: string; image: string; badge: string; tone: string;
};

function taka(value: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(value);
}

function HomeProductCard({ product, index, onBuy, onAdded }: { product: StoreProduct; index: number; onBuy: (product: StoreProduct, quantity: number) => void; onAdded: (name: string) => void }) {
  const [quantity, setQuantity] = useState(1);
  const add = () => { if (!product.variantId) return; addGuestLine({ variantId: product.variantId, productId: product.productId ?? Number(product.id), name: product.name, slug: product.slug, image: product.image, priceMinor: Math.round(product.price * 100), quantity }); onAdded(product.name); };
  const href = product.variantId ? `/products/${product.slug}` : `/products?q=${encodeURIComponent(product.name)}`;
  const badge = product.badge || (index === 0 ? "Trending" : "");
  return (
    <article className="trend-card">
      <Link href={href} className="trend-photo" aria-label={`View ${product.name}`}>
        {product.image && <img src={product.image} alt="" loading="lazy" />}
        {badge && <span>{badge}</span>}
      </Link>
      <div className="trend-info">
        <p>{product.category}</p>
        <h3><Link href={href}>{product.name}</Link></h3>
        <div className="trend-price">
          <strong>৳{taka(product.price)}</strong>
          {product.compareAtPrice !== null && product.compareAtPrice > product.price && <>
            <del>৳{taka(product.compareAtPrice)}</del>
            <span className="trend-saving">৳{taka(product.compareAtPrice - product.price)} OFF</span>
          </>}
        </div>
        <div className="trend-quantity">
          <span>Quantity</span>
          <div>
            <button disabled={quantity === 1} aria-label={`Decrease ${product.name} quantity`} onClick={() => setQuantity(value => Math.max(1, value - 1))}>−</button>
            <b>{quantity}</b>
            <button aria-label={`Increase ${product.name} quantity`} onClick={() => setQuantity(value => value + 1)}>+</button>
          </div>
        </div>
        <div className="trend-actions">
          <button disabled={!product.variantId} onClick={add}>Add to cart</button>
          <button disabled={!product.variantId} onClick={() => onBuy(product, quantity)}>Buy now</button>
        </div>
      </div>
    </article>
  );
}

export default function Storefront({ products, hero, categories }: { products: StoreProduct[]; hero: React.ReactNode; categories: React.ReactNode }) {
  const { user } = useSession();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All gadgets");
  const [searchTerm, setSearchTerm] = useState("");
  const email = useBranding().record?.content.email;
  const [notice, setNotice] = useState("");
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeFilter === "All gadgets" || product.category.toLowerCase().includes(activeFilter.toLowerCase());
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [activeFilter, products, searchTerm]);
  useEffect(() => {
    let active = true;
    let requestNumber = 0;
    const update = () => {
      const currentRequest = ++requestNumber;
      const guestCount = readGuestCart().reduce((total, line) => total + line.quantity, 0);
      if (!user) {
        setCartCount(guestCount);
        return;
      }
      api<{ items: { quantity: number }[] }>("/cart")
        .then((cart) => {
          if (active && currentRequest === requestNumber) {
            setCartCount(guestCount + cart.items.reduce((total, item) => total + item.quantity, 0));
          }
        })
        .catch(() => {
          if (active && currentRequest === requestNumber) setCartCount(guestCount);
        });
    };
    update(); window.addEventListener("orbix-cart-change", update);
    return () => { active = false; window.removeEventListener("orbix-cart-change", update); };
  }, [user]);
  function buyNow(product: StoreProduct, quantity: number) {
    if (!product.variantId) { router.push(`/products/${product.slug}`); return; }
    addGuestLine({variantId:product.variantId,productId:product.productId??Number(product.id),name:product.name,slug:product.slug,image:product.image,priceMinor:Math.round(product.price*100),quantity});
    router.push("/checkout");
  }

  return (
    <main>
      <div className={searchStyles.masthead}>
      <header className={`site-header ${searchStyles.header}`}>
        <a href="#top" className="wordmark"><BrandSign /></a>
        <ProductSearch />
        <CategoryNav />
        <div className="header-actions"><Link className="account-link" href={user?(user.role==="admin"?"/admin":"/account"):"/login"}>{user?(user.role==="admin"?"Studio":"Account"):"Sign in"}</Link><Link className="bag-button" href="/cart" aria-label={`Shopping bag, ${cartCount} items`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><span>Bag <b>{cartCount}</b></span></Link></div>
      </header>

      </div>
      {hero}


      <section className="store-benefits" aria-label="Store benefits">
        <div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="m8 11.5 2.7 2.7 5.3-5.4"/></svg><span>100% Genuine Products</span></div>
        <div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16H2V5h12v11H8m6-9h4l4 5v4h-2m-6 0h1m0-5h6"/><circle cx="5.5" cy="16.5" r="2.5"/><circle cx="17.5" cy="16.5" r="2.5"/></svg><span>Super Fast Delivery</span></div>
        <div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h9l9 9-8 8L3 11z"/><circle cx="7.5" cy="8" r="1"/></svg><span>Best Price in Bangladesh</span></div>
        <div><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="12" rx="3"/><path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3m-4.5 5v2"/></svg><span>Secure Payment</span></div>
      </section>

      {categories}

      {products.some(product => product.isFeatured) && (
        <section className="section shop-section featured-shelf" aria-labelledby="featured-title">
          <div className="section-heading"><h2 id="featured-title">Featured <span>Products</span></h2><a href="#shop">All products ↓</a></div>
          <div className="product-grid">
            {products.filter(product => product.isFeatured).map((product, index) => (
              <HomeProductCard key={product.id} product={product} index={index} onBuy={buyNow} onAdded={name => setNotice(`${name} added to cart.`)} />
            ))}
          </div>
        </section>
      )}
      <section className="section shop-section" id="shop"><div className="section-heading shop-heading"><div><h2>All <span>Products</span></h2></div><div className="shop-tools"><label className="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input id="shop-search" placeholder="Find your thing" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><Link className="text-link desktop-link" href="/products">Shop all <span>↗</span></Link></div></div><div className="filter-row">{["All gadgets", ...new Set(products.map(product => product.category))].map((filter) => <button onClick={() => setActiveFilter(filter)} className={activeFilter === filter ? "filter active" : "filter"} key={filter}>{filter}</button>)}</div><div className="product-grid">{visibleProducts.length ? visibleProducts.map((product,index)=><HomeProductCard key={product.id} product={product} index={index} onBuy={buyNow} onAdded={(name)=>setNotice(`${name} added to cart.`)}/>) : <div className="empty-products">More great gadgets are on the way.</div>}</div><div className="mobile-shop-all"><Link className="button button-outline" href="/products">Shop all gadgets <span>↗</span></Link></div></section>

      <section className="store-benefits" aria-label="Store benefits">
        <div>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 2 8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" />
            <path d="m8 11.5 2.7 2.7 5.3-5.4" />
          </svg>
          <span>100% Genuine Products</span>
        </div>
        <div>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 16H2V5h12v11H8m6-9h4l4 5v4h-2m-6 0h1m0-5h6" />
            <circle cx="5.5" cy="16.5" r="2.5" /><circle cx="17.5" cy="16.5" r="2.5" />
          </svg>
          <span>Super Fast Delivery</span>
        </div>
        <div>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 4h9l9 9-8 8L3 11z" /><circle cx="7.5" cy="8" r="1" />
          </svg>
          <span>Best Price in Bangladesh</span>
        </div>
        <div>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="10" width="16" height="12" rx="3" />
            <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3m-4.5 5v2" />
          </svg>
          <span>Secure Payment</span>
        </div>
      </section>

      <section className="contact-band" aria-labelledby="contact-heading">
        <div>
          <h2 id="contact-heading">Get in touch</h2>
          <p>Have a product question or need help with an order?</p>
        </div>
        <a href={email ? `mailto:${email}` : "/contact"}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 6 9 7 9-7" /></svg>
          {email || "Contact us"} <span aria-hidden="true">↗</span>
        </a>
      </section>

      <StoreFooter />
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
    </main>
  );
}
