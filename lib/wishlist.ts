"use client";

import { useSyncExternalStore } from "react";

type SavedProduct = { slug: string; name: string };
const empty = "[]";
const changeEvent = "orbix:wishlist";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}

function read(key: string) {
  try {
    return localStorage.getItem(key) ?? empty;
  } catch {
    return empty;
  }
}

function parse(snapshot: string): SavedProduct[] {
  try {
    const data: unknown = JSON.parse(snapshot);
    return Array.isArray(data)
      ? data.filter((item) => item && typeof item.slug === "string" && typeof item.name === "string")
      : [];
  } catch {
    return [];
  }
}

export function useWishlist(userId?: number) {
  const key = userId === undefined ? null : `orbix:wishlist:${userId}`;
  const snapshot = useSyncExternalStore(subscribe, () => key ? read(key) : empty, () => empty);

  function toggle(product: SavedProduct) {
    if (!key) return;
    const current = parse(read(key));
    const next = current.some((item) => item.slug === product.slug)
      ? current.filter((item) => item.slug !== product.slug)
      : [product, ...current];
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(changeEvent));
  }

  return { items: parse(snapshot), toggle };
}
