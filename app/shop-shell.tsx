"use client";

import { BrandSign, StoreFooter } from "./store-branding";
import searchStyles from "./product-search.module.css";
import ProductSearch from "./product-search";
import CategoryNav from "./category-nav";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "./providers";

export function ShopHeader() {
  const { user, logout } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const categoryId = usePathname() === "/products" ? params.get("categoryId") : null;
  return <div className={searchStyles.masthead}><div className="shop-announce">Smartphones, tech & everyday gadgets <span>Delivery across Bangladesh</span></div><header className={`shop-header ${searchStyles.header}`}><Link href="/" className="shop-logo"><BrandSign /></Link>
        <ProductSearch key={categoryId} categoryId={categoryId} /><CategoryNav /><div className="shop-head-actions"><Link href="/cart" className="header-cart">Cart</Link>{user ? <><Link href={user.role === "admin" ? "/admin" : "/account"}>{user.role === "admin" ? "Studio" : "Account"}</Link><button className="header-logout" onClick={async () => { await logout().catch(() => {}); router.push("/"); }}>Sign out</button></> : <Link href="/login">Sign in</Link>}</div></header></div>;
}

export function ShopShell({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="commerce-shell"/>}><ShopFrame>{children}</ShopFrame></Suspense>;
}

function ShopFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <div className="commerce-shell"><ShopHeader/><div className="shop-content" key={pathname}>{children}</div><StoreFooter/></div>;
}

export function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <div className="page-title"><span>{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div>;
}
