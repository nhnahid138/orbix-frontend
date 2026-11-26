"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useSession } from "../../providers";
import styles from "./account.module.css";

const navigation = [
  { href: "/account", label: "Overview", icon: "⌂" },
  { href: "/account/orders", label: "Orders", icon: "▤" },
  { href: "/account/wishlist", label: "Wishlist", icon: "♡" },
  { href: "/account/addresses", label: "Addresses", icon: "⌖" },
  { href: "/account/security", label: "Security", icon: "⚿" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await logout().catch(() => {});
    router.replace("/login");
  }

  return (
    <div className={styles.frame}>
      <div className={styles.crumb}><Link href="/">Home</Link><span aria-hidden="true">/</span>My account</div>
      <div className={user ? styles.layout : undefined}>
        {user && <aside className={styles.sidebar}>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
            <div><strong>{user.name}</strong><small>{user.email}</small></div>
          </div>
          <nav aria-label="Account navigation" className={styles.nav}>
            {navigation.map(({ href, label, icon }) => {
              const active = pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`));
              return <Link key={href} href={href} aria-current={active ? "page" : undefined}><span aria-hidden="true">{icon}</span>{label}</Link>;
            })}
          </nav>
          <button type="button" className={styles.logout} onClick={signOut} disabled={signingOut}><span aria-hidden="true">↪</span>{signingOut ? "Signing out…" : "Sign out"}</button>
        </aside>}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
