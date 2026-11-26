"use client";

import Link from "next/link";
import { withAccountAccess } from "../account-access";
import { useState } from "react";
import { useWishlist } from "../../../../lib/wishlist";
import { useSession } from "../../../providers";
import styles from "../account.module.css";

function WishlistPage() {
  const { user } = useSession();
  const { items, toggle } = useWishlist(user?.id);
  const [error, setError] = useState("");

  return (
    <>
      <header className={styles.heading}><h1>Wishlist</h1><p>Saved on this device.</p></header>
      <section className={styles.panel} aria-label="Saved products">
        {error && <p role="alert">{error}</p>}
        {items.length ? (
          <ul className={styles.orderList}>
            {items.map((item) => (
              <li key={item.slug} className={styles.wishlistRow}>
                <Link className={styles.action} href={`/products/${encodeURIComponent(item.slug)}`}>{item.name}</Link>
                <button type="button" className={styles.action} aria-label={`Remove ${item.name} from wishlist`} onClick={() => {
                  try { toggle(item); setError(""); } catch { setError("Could not update your wishlist on this device."); }
                }}>Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}><span aria-hidden="true">♡</span><strong>Your wishlist is empty</strong><Link className={styles.action} href="/products">Browse products →</Link></div>
        )}
      </section>
    </>
  );
}

export default withAccountAccess(WishlistPage);
