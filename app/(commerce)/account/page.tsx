"use client";

import Link from "next/link";
import { withAccountAccess } from "./account-access";
import { useEffect, useState, type FormEvent } from "react";
import { api, errorMessage, formatMoney } from "../../../lib/api";
import { useSession, type User } from "../../providers";
import { useWishlist } from "../../../lib/wishlist";
import styles from "./account.module.css";

type Order = { orderNumber: string; orderStatus: string; paymentStatus: string; totalMinor: number; createdAt: string };
type Address = { id: number; recipient: string; line1: string; line2?: string; city: string; region?: string; isDefault: boolean };
type Result<T> = { data?: T; error?: string };

function AccountPage() {
  const { user } = useSession();
  return user && <AccountOverview key={user.id} user={user} />;
}

function AccountOverview({ user }: { user: User }) {
  const { updateProfile } = useSession();
  const [orders, setOrders] = useState<Result<Order[]>>({});
  const [addresses, setAddresses] = useState<Result<Address[]>>({});
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { items: wishlist } = useWishlist(user.id);
  const initials = user.name.trim().split(/\s+/).slice(0, 2)
    .map((part) => Array.from(part)[0]).join("").toLocaleUpperCase();
  const address = addresses.data?.find((entry) => entry.isDefault) ?? addresses.data?.[0];

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    api<{ items: Order[] }>("/orders?limit=5", options)
      .then(({ items }) => setOrders({ data: items }))
      .catch((reason) => { if (!options.signal.aborted) setOrders({ error: errorMessage(reason) }); });
    api<Address[]>("/addresses", options)
      .then((data) => setAddresses({ data }))
      .catch((reason) => { if (!options.signal.aborted) setAddresses({ error: errorMessage(reason) }); });
    return () => controller.abort();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const phoneNumber = String(form.get("phoneNumber")).trim();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await updateProfile({ name, phoneNumber: phoneNumber || undefined });
      setEditing(false);
      setNotice("Account details saved.");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className={styles.profileHero}>
        <span className={styles.heroAvatar} aria-hidden="true">{initials}</span>
        <div className={styles.heroText}>
          <h1>My account</h1>
          <p>{user.name}</p>
          <nav aria-label="Jump to account section" className={styles.shortcuts}>
            <a href="#shopping">Shopping</a>
            <a href="#settings">Account settings</a>
            <a href="#delivery">Delivery & help</a>
          </nav>
        </div>
      </header>

      <section id="shopping" className={styles.group} aria-labelledby="shopping-heading">
        <h2 id="shopping-heading" className={styles.groupTitle}>Shopping</h2>
        <div className={styles.groupGrid}>
          <section className={styles.panel} aria-labelledby="recent-orders">
            <div className={styles.panelHead}><h3 id="recent-orders">Recent orders</h3><Link className={styles.action} href="/account/orders">View all <span aria-hidden="true">→</span></Link></div>
            {orders.error ? <p role="alert">{orders.error}</p> : !orders.data ? <p role="status">Loading orders…</p> : orders.data.length ? (
              <ul className={styles.orderList}>
                {orders.data.map((order) => (
                  <li key={order.orderNumber}>
                    <Link className={styles.order} href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>
                      <span><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" })}</small></span>
                      <span><span className={`status-pill status-${order.orderStatus}`}>{order.orderStatus.replaceAll("_", " ")}</span><small>Payment {order.paymentStatus.replaceAll("_", " ")}</small></span>
                      <strong>{formatMoney(order.totalMinor)}</strong><span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}><span aria-hidden="true">▤</span><strong>No orders yet</strong><Link className={styles.action} href="/products">Browse products <span aria-hidden="true">→</span></Link></div>
            )}
          </section>
          <section className={`${styles.panel} ${styles.wishlistCard}`} aria-labelledby="overview-wishlist">
            <div className={styles.panelHead}><h3 id="overview-wishlist">Wishlist</h3><span className={styles.heart} aria-hidden="true">♡</span></div>
            <p className={styles.savedCount}><strong>{wishlist.length}</strong> {wishlist.length === 1 ? "saved product" : "saved products"}</p>
            <Link href="/account/wishlist" className={styles.action}>Open wishlist <span aria-hidden="true">→</span></Link>
          </section>
        </div>
      </section>

      <section id="settings" className={styles.group} aria-labelledby="settings-heading">
        <h2 id="settings-heading" className={styles.groupTitle}>Account settings</h2>
        <div className={styles.groupGrid}>
          <section className={styles.panel} aria-labelledby="account-details">
            <div className={styles.panelHead}>
              <h3 id="account-details">Personal information</h3>
              <button type="button" className={styles.outlineButton} disabled={busy} aria-expanded={editing} onClick={() => { setEditing(!editing); setError(""); setNotice(""); }}>{editing ? "Cancel" : "Edit profile"}</button>
            </div>
            {error && <p className="inline-error" role="alert">{error}</p>}
            {notice && <p className="inline-success" role="status">{notice}</p>}
            {editing ? (
              <form className={`stack-form ${styles.edit}`} onSubmit={saveProfile} aria-label="Edit personal information">
                <label>Full name<input name="name" autoComplete="name" defaultValue={user.name} required minLength={2} maxLength={120} /></label>
                <label>Phone number<input name="phoneNumber" type="tel" autoComplete="tel" defaultValue={user.phoneNumber ?? ""} required={Boolean(user.phoneNumber)} maxLength={30} /></label>
                <button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
              </form>
            ) : (
              <dl className={styles.details}>
                <div><dt>Full name</dt><dd>{user.name}</dd></div>
                <div><dt>Phone number</dt><dd>{user.phoneNumber || "Not added"}</dd></div>
                <div><dt>Email address</dt><dd>{user.email}</dd></div>
              </dl>
            )}
          </section>

          <section className={`${styles.panel} ${styles.securityCard}`} aria-labelledby="profile-security">
            <div>
              <h3 id="profile-security">Password & security</h3>
              <p>Update the password you use to sign in.</p>
            </div>
            <Link className={styles.outlineButton} href="/account/security">Change password <span aria-hidden="true">→</span></Link>
          </section>
        </div>
      </section>

      <section id="delivery" className={styles.group} aria-labelledby="delivery-heading">
        <h2 id="delivery-heading" className={styles.groupTitle}>Delivery & help</h2>
        <div className={styles.tiles}>
          <section className={styles.panel}>
            <div className={styles.panelHead}><h3>Delivery address</h3><Link className={styles.action} href="/account/addresses">Manage <span aria-hidden="true">→</span></Link></div>
            {addresses.error ? <p role="alert">{addresses.error}</p> : !addresses.data ? <p role="status">Loading addresses…</p> : address ? (
              <p><strong>{address.recipient}</strong><br />{[address.line1, address.line2, address.city, address.region].filter(Boolean).join(", ")}</p>
            ) : <p>No saved addresses yet.</p>}
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}><h3>Customer support</h3></div>
            <div className={styles.support}><Link className={styles.action} href="/contact">Contact support ↗</Link><Link className={styles.action} href="/shipping">Delivery & returns ↗</Link></div>
          </section>
        </div>
      </section>

    </>
  );
}

export default withAccountAccess(AccountPage);
