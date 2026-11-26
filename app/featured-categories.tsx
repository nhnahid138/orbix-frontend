import Link from "next/link";
import type { StoreCategory } from "./page";

// Entries follow the thumbnail sheet from left to right, then top to bottom.
const thumbnailSlugs = [
  ["laptop", "laptops"],
  ["graphics-card", "graphics-cards", "gpu"],
  ["computer-processor", "processor", "processors", "cpu"],
  ["motherboard", "motherboards"],
  ["monitor", "monitors"],
  ["power-supply", "power-supplies", "psu"],
  ["ram", "memory"],
  ["ssd", "solid-state-drives"],
  ["macbook", "macbooks"],
  ["ipad", "ipads"],
  ["iphone", "iphones", "phone", "phones", "smartphones"],
  ["smart-watch", "smart-watches", "smartwatch", "smartwatches"],
  ["hd-camera", "security-cameras", "camera"],
  ["wi-fi-router", "wifi-router", "routers"],
  ["air-fryer", "air-fryers"],
  ["induction-cooker", "induction-cookers"],
];

export default function FeaturedCategories({
  categories,
}: {
  categories: StoreCategory[];
}) {
  if (!categories.length) return null;

  return (
    <section
      id="collections"
      className="featured-categories"
      aria-labelledby="featured-categories-title"
    >
      <div className="featured-categories-heading">
        <h2 id="featured-categories-title">
          Featured <span>Categories</span>
        </h2>
        <Link href="/products">
          View all gadgets <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <ul className="featured-category-grid">
        {categories.map(({ id, name, slug, mainImageUrl }) => {
          const index = thumbnailSlugs.findIndex((aliases) =>
            aliases.includes(slug),
          );
          return (
            <li key={id}>
              <Link
                href={`/products?categoryId=${id}`}
                className="featured-category"
              >
                {mainImageUrl ? (
                  <span aria-hidden="true" className="category-main-image" style={{ backgroundImage: `url("${mainImageUrl}")` }} />
                ) : index >= 0 ? (
                  <span
                    aria-hidden="true"
                    className="category-thumbnail"
                    style={{
                      backgroundPosition: `${((index % 4) * 100) / 3}% ${(Math.floor(index / 4) * 100) / 3}%`,
                    }}
                  />
                ) : (
                  <span aria-hidden="true" className="category-initial">
                    {name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="category-label">{name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
