"use client";

import Link from "next/link";
import { withAccountAccess } from "../account-access";
import { useEffect, useState } from "react";
import { api, errorMessage, formatMoney } from "../../../../lib/api";
import { useSession } from "../../../providers";
import styles from "../account.module.css";

type Order={orderNumber:string;orderStatus:string;paymentStatus:string;fulfillmentStatus:string;totalMinor:number;createdAt:string;items:{productName:string;quantity:number}[]};
function OrdersPage() {
  const { user } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    api<{ items: Order[] }>("/orders?limit=100", { signal: controller.signal })
      .then(({ items }) => setOrders(items))
      .catch((reason) => { if (!controller.signal.aborted) setError(errorMessage(reason)); });
    return () => controller.abort();
  }, [user]);

  return (
    <>
      <header className={styles.heading}><h1>Order history</h1></header>
      {error ? <p className="inline-error" role="alert">{error}</p> : !orders ? <p role="status">Loading orders…</p> : orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.orderNumber}>
              <div className="order-card-head">
                <span><small>ORDER</small><b>{order.orderNumber}</b></span>
                <span><small>PLACED</small><b>{new Date(order.createdAt).toLocaleDateString("en-BD", { dateStyle: "medium", timeZone: "Asia/Dhaka" })}</b></span>
                <span><small>STATUS</small><b className={`status-pill status-${order.orderStatus}`}>{order.orderStatus.replaceAll("_", " ")}</b></span>
                <strong>{formatMoney(order.totalMinor)}</strong>
                <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>View order →</Link>
              </div>
              <div className="order-item-preview">
                {order.items.map((item, index) => <span key={index}>{item.productName} <small>× {item.quantity}</small></span>)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.panel}>
          <div className={styles.empty}><span aria-hidden="true">▤</span><strong>No orders yet</strong><Link className={styles.action} href="/products">Browse products →</Link></div>
        </section>
      )}
    </>
  );
}

export default withAccountAccess(OrdersPage);
