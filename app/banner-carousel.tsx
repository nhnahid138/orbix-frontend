"use client";

import { useEffect, useState } from "react";
import type { StoreBanner } from "./page";

const defaultBanner: StoreBanner = { eyebrow: "THE NEXT GENERATION IS HERE", title: "Your world.\nUpgraded.", subtitle: "Discover the latest smartphones, laptops and everyday tech, all in one place.", imageUrl: "https://images.unsplash.com/photo-1511707267537-b85faf000f8b?auto=format&fit=crop&w=2200&q=90", ctaLabel: "Explore gadgets", ctaHref: "#shop" };
export default function BannerCarousel({ banners }: { banners: StoreBanner[] }) {
  const [activeBanner, setActiveBanner] = useState(0);
  const slides = banners.length ? banners : [defaultBanner];
  const currentSlide = activeBanner % slides.length;
  const banner = slides[currentSlide];
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActiveBanner((index) => (index + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="hero home-banner" id="top">
      {/* Uploaded and remote banners can use hosts chosen by the store administrator. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hero-image" src={banner.imageUrl} alt="" width={1440} height={660} fetchPriority="high" />
    </section>
  );
}
