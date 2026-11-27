"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import paymentMethodsBanner from "../images/eps.png";
import { apiUrl, errorMessage } from "../lib/api";

export type FooterLink = { label: string; href: string };
export type Outlet = FooterLink & { detail: string };
export type Branding = {
  brand: string; logo: string; tagline: string;
  phoneLabel: string; phone: string; emailLabel: string; email: string;
  whatsapp?: string;
  locationHeading: string; aboutHeading: string; policyHeading: string;
  locations: Outlet[]; about: FooterLink[]; policies: FooterLink[]; apps: FooterLink[]; social: FooterLink[];
  copyright: string; credit: string; creditUrl: string;
};
export type BrandingRecord = { version: number; content: Branding };
const BrandingContext = createContext<{
  record: BrandingRecord | null; error: string; publish: (value: BrandingRecord) => void;
} | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [record, publish] = useState<BrandingRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const url = process.env.NEXT_PUBLIC_API_URL ? "/store-branding.json" : apiUrl("/branding");
    fetch(url, {signal:controller.signal, cache:"no-store"}).then(async response => {
      if (!response.ok) throw Error("Could not load store branding.");
      const data: BrandingRecord = await response.json();
      publish(current => !current || current.version < data.version ? data : current);
    }).catch(reason => { if (!controller.signal.aborted) setError(errorMessage(reason)); });
    return () => controller.abort();
  }, []);
  return <BrandingContext.Provider value={{record, error, publish}}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) throw Error("Missing BrandingProvider");
  return context;
}

export function BrandSign({ content }: { content?: Branding }) {
  const {record} = useBranding();
  const brand = content ?? record?.content;
  // eslint-disable-next-line @next/next/no-img-element
  if (brand?.logo) return <img className="store-logo-image" src={brand.logo} alt={brand.brand} />;
  return <span className="store-wordmark">{brand?.brand || "Orbix"}</span>;
}

function LinkList({ title, items }: { title: string; items: FooterLink[] }) {
  if (!items.length) return null;
  return <section><h2>{title}</h2><ul>{items.map((item,i)=><li key={i}><a href={item.href}>{item.label}</a></li>)}</ul></section>;
}

function PaymentMethods() {
  return <div className="store-footer-payments">
    <Image src={paymentMethodsBanner} sizes="(max-width: 500px) 88vw, 380px"
      alt="EPS payment methods: Visa, Mastercard, American Express, DBBL Nexus, UnionPay, Rocket, OK Wallet, bKash, tap, Meghna Pay, Nagad, mCash, Upay and CellFin" />
  </div>;
}

function FollowUs({ social, email }: Pick<Branding, "social" | "email">) {
  const icons = [
    { name: "Facebook", path: "M14 21v-8h3l.5-4H14V7c0-1 .4-2 2-2h2V1.5A22 22 0 0 0 15 1c-3 0-5 2-5 5v3H7v4h3v8z" },
    { name: "YouTube", path: "M22 7s-.2-2-2-2.5C18 4 6 4 4 4.5 2.2 5 2 7 2 7s-1 5 0 10c.2 1.5 1 2.2 2 2.5 2 .5 14 .5 16 0 1-.3 1.8-1 2-2.5 1-5 0-10 0-10z M10 8l6 4-6 4z" },
    { name: "Instagram", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z M7 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M18 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" },
    { name: "TikTok", path: "M14 2h3c.3 3 2 4 5 4v3c-2 0-4-.7-5-1.5V16a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z" },
    { name: "Email", path: "M3 4h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M3 6l9 7 9-7z M3 8v10h18V8l-9 7z" },
  ];
  return <div className="store-footer-social">
    <h2>Follow us</h2>
    <div className="store-social-icons">{icons.map(icon => {
      const entry = social.find(item => item.label.toLowerCase().includes(icon.name.toLowerCase())
        || item.href.toLowerCase().includes(icon.name.toLowerCase() + ".com"));
      const href = icon.name === "Email" ? (email ? `mailto:${email}` : entry?.href) : entry?.href;
      const image = <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={icon.path} fill="currentColor" fillRule="evenodd"/></svg>;
      return href ? <a key={icon.name} href={href} aria-label={icon.name} title={icon.name}>{image}</a>
        : <span key={icon.name} aria-label={`${icon.name} link not configured`} title={`${icon.name} link not configured`}>{image}</span>;
    })}</div>
  </div>;
}

export function StoreFooter({ preview }: { preview?: Branding }) {
  const {record} = useBranding();
  const value = preview ?? record?.content;
  if (!value) return <footer className="store-footer"><Link href="/"><BrandSign /></Link><PaymentMethods /></footer>;
  const whatsappNumber = (value.whatsapp || "01581633218").replace(/\D/g, "");
  const whatsappInternational = whatsappNumber.startsWith("0") ? `88${whatsappNumber}` : whatsappNumber;
  return (
    <footer className="store-footer">
      <div className="store-footer-grid">
        <div>
          <Link href="/" className="store-footer-logo"><BrandSign content={value}/></Link>
          {value.tagline && <p>{value.tagline}</p>}
          {value.phone && <div className="store-footer-contact"><strong>{value.phoneLabel}</strong><a href={`tel:${value.phone.replace(/[ ()-]/g,"")}`}>{value.phone}</a></div>}
          {value.email && <div className="store-footer-contact"><strong>{value.emailLabel}</strong><a href={`mailto:${value.email}`}>{value.email}</a></div>}
          {!!value.apps.length && <div className="store-footer-pills">{value.apps.map((entry,i)=><a href={entry.href} key={i}>{entry.label}</a>)}</div>}
        </div>
        <section>
          {!!value.locations.length && <><h2>{value.locationHeading}</h2><ul className="store-outlets">{value.locations.map((outlet,i)=><li key={i}><strong>{outlet.href ? <a href={outlet.href}>{outlet.label}</a> : outlet.label}</strong>{outlet.detail && <p>{outlet.detail}</p>}</li>)}</ul></>}
          <div className="store-whatsapp">
            <h2><span>Call us</span></h2>
            <a href={`https://wa.me/${whatsappInternational}`} target="_blank" rel="noopener noreferrer" aria-label={`Message ${value.whatsapp || "01581633218"} on WhatsApp`}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.6Z"/>
                <path d="M8.5 8.2c-.3.4-.6 1-.4 1.7.5 2.1 2.8 4.5 4.9 5 .8.2 1.4-.1 1.8-.5l.5-.7-2.1-1-1 1c-1.2-.5-2.2-1.5-2.7-2.7l1-1-1-2.1Z"/>
              </svg>
              <span>{value.whatsapp || "01581633218"}</span>
            </a>
          </div>
        </section>
        <LinkList title={value.aboutHeading} items={value.about}/>
        <LinkList title={value.policyHeading} items={value.policies}/>
      </div>
      <div className="store-footer-connect">
        <div className="store-footer-link-columns">
        <nav className="store-footer-support" aria-label="Customer support">
          <h2>Customer Support</h2>
          <ul>
            <li><Link href="/contact">Contact us</Link></li>
            <li><Link href="/shipping">Delivery information</Link></li>
            <li><Link href="/faq">Frequently asked questions</Link></li>
          </ul>
        </nav>
        <nav className="store-footer-support store-footer-account" aria-label="My account">
          <h2>My Account</h2>
          <ul>
            <li><Link href="/account">My account</Link></li>
            <li><Link href="/account/orders">My orders</Link></li>
            <li><Link href="/cart">Shopping cart</Link></li>
          </ul>
        </nav>
        </div>
        <div className="store-footer-payment-group">
        <FollowUs social={value.social} email={value.email} />
        <div className="store-footer-payment-panel">
          <h2>Payment methods <span>via EPS</span></h2>
          <PaymentMethods />
        </div>
        </div>
      </div>
      <div className="store-footer-base">
        <span>{value.copyright}</span>
        {value.credit && <span>{value.creditUrl ? <a href={value.creditUrl}>{value.credit}</a> : value.credit}</span>}
      </div>
    </footer>
  );
}
