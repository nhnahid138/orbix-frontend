"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import styles from "./product-search.module.css";

type Category = { id: number; name: string; parent?: { id: number } | null };
const href = (id: number) => `/products?categoryId=${id}`;

export default function CategoryNav() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    api<Category[]>("/categories", { signal: controller.signal })
      .then(setCategories).catch(() => {});
    return () => controller.abort();
  }, []);

  function descendants(id: number, prefix = "", seen = new Set<number>()): { id: number; label: string }[] {
    if (seen.has(id)) return [];
    seen.add(id);
    return categories.filter(category => category.parent?.id === id).flatMap(child => {
      const label = prefix + child.name;
      return [{ id: child.id, label }, ...descendants(child.id, label + " › ", seen)];
    });
  }

  return <nav className={styles.categoryNav} aria-label="Product categories">
    {!categories.length && <Link href="/products">All gadgets</Link>}
    {categories.filter(category => !category.parent).map(category => {
      const children = descendants(category.id);
      return <div key={category.id}>
        <Link href={href(category.id)}>{category.name}</Link>
        {children.length > 0 && <select aria-label={`Browse ${category.name} subcategories`} value=""
          onChange={event => router.push(href(Number(event.target.value)))}>
          <option value="" disabled></option>
          {children.map(child => <option key={child.id} value={child.id}>{child.label}</option>)}
        </select>}
      </div>;
    })}
  </nav>;
}
