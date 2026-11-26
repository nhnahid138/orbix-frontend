"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageTitle } from "../../../shop-shell";

export default function CheckoutReturnPage(){const params=useSearchParams();const order=params.get("order");const status=params.get("status")??"verification_pending";const paid=status==="paid"||status==="success";const confirmed=status==="confirmed";return <div className="store-page return-page"><div className={paid||confirmed?"return-icon success":"return-icon pending"}>{paid||confirmed?"✓":"…"}</div><PageTitle eyebrow={paid?"PAYMENT CONFIRMED":confirmed?"ORDER RECEIVED":"PAYMENT STATUS"} title={paid?"It's on its way to you.":confirmed?"Your order is in good hands.":"We're checking your payment."} text={paid?"Your payment was verified. Thank you for choosing Orbix.":confirmed?"We've received your cash-on-delivery order and reserved your pieces.":"The payment gateway has returned you to Orbix. Our server is confirming the transaction."}/>{order&&<div className="order-reference"><small>ORDER REFERENCE</small><b>{order}</b></div>}<div className="return-actions"><Link className="primary-button" href={order?`/account/orders/${encodeURIComponent(order)}`:"/account/orders"}>View your order <span>→</span></Link><Link className="under-link" href="/products">Continue exploring</Link></div></div>}
