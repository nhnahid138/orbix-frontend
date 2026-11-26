"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useSession } from "../../providers";
import styles from "./account.module.css";

export function withAccountAccess(Page: ComponentType) {
  return function AccountAccess() {
    const { user, loading } = useSession();
    const pathname = usePathname();

    if (loading) return <p role="status">Loading your account…</p>;
    if (user) return <Page key={user.id} />;

    return (
      <section className={styles.heading}>
        <h1>My account</h1>
        <p>Sign in to see your orders and manage your account.</p>
        <Link className={`primary-button ${styles.signIn}`} href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in <span>→</span></Link>
      </section>
    );
  };
}
