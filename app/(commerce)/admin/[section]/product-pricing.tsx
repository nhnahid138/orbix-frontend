"use client";

import { useState } from "react";

export type VariantPricing = {
  priceMinor: number;
  compareAtMinor: number | null;
  costMinor: number | null;
};

export function money(minor: number) {
  return "৳" + (minor / 100).toLocaleString("en-BD", { maximumFractionDigits: 2 });
}

export function readPricing(form: FormData) {
  function minor(field: string) {
    const raw = form.get(field);
    return raw === null || raw === "" ? null : Math.round(Number(raw) * 100);
  }
  const regular = minor("regular");
  const offer = minor("offer");
  if (regular === null || (offer !== null && offer >= regular)) {
    throw new Error("Offer price must be lower than the regular price.");
  }
  return { priceMinor: offer ?? regular, compareAtMinor: offer === null ? null : regular, costMinor: minor("cost") };
}

export function PricingFields({ variant }: { variant?: VariantPricing }) {
  const initialRegular = variant && (variant.compareAtMinor ?? variant.priceMinor);
  const [regular, setRegular] = useState(initialRegular == null ? "" : String(initialRegular / 100));
  const [offer, setOffer] = useState(variant?.compareAtMinor == null ? "" : String(variant.priceMinor / 100));
  const [cost, setCost] = useState(variant?.costMinor == null ? "" : String(variant.costMinor / 100));
  const amount = { type: "number", min: 0, max: 20000000, step: "0.01" };
  const profit = Math.round(Number(offer || regular) * 100) - Math.round(Number(cost) * 100);
  return <>
    <label>Regular price (BDT)<input {...amount} name="regular" required value={regular} onChange={e => setRegular(e.target.value)} /></label>
    <label>Offer price (optional)<input {...amount} name="offer" max={Number(regular || 0) - 0.01} value={offer} onChange={e => setOffer(e.target.value)} /></label>
    <label>Purchase cost per unit (BDT)<input {...amount} name="cost" value={cost} onChange={e => setCost(e.target.value)} /></label>
    <output aria-live="polite">Gross {profit < 0 ? "loss" : "profit"} per unit: {cost && regular ? money(Math.abs(profit)) : "—"}</output>
  </>;
}
