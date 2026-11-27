"use client";

import { productImageUrl } from "../../../../lib/product-image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import Link from "next/link";
import styles from "./product-detail.module.css";
import { api, errorMessage, formatMoney } from "../../../../lib/api";
import { addGuestLine } from "../../../../lib/guest-cart";
import { useWishlist } from "../../../../lib/wishlist";
import { useSession } from "../../../providers";

type Product = { id:number; name:string; slug:string; description:string; category?:{name:string}; images:{url:string;alt?:string}[]; variants:{id:number;sku:string;name?:string;priceMinor:number;compareAtMinor?:number;stockQuantity:number;attributes:Record<string,string>}[] };
type Review = { id:number; rating:number; body:string; user?:{name:string}; createdAt:string };
export default function ProductDetailPage() {
  const params = useParams<{slug:string}>(); const router=useRouter(); const {user}=useSession(); const [product,setProduct]=useState<Product|null>(null); const [reviews,setReviews]=useState<Review[]>([]); const [variantIndex,setVariantIndex]=useState(0); const [imageIndex,setImageIndex]=useState(0); const [quantity,setQuantity]=useState(1); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  useEffect(()=>{let live=true; api<Product>(`/products/${encodeURIComponent(params.slug)}`).then((data)=>{if(live){setProduct(data);setImageIndex(0);setVariantIndex(0);setQuantity(1);setReviews([]);if(data.id) api<{items:Review[]}>(`/products/${data.id}/reviews`).then((result)=>live&&setReviews(result.items??[])).catch(()=>{});}}).catch((reason)=>live&&setError(errorMessage(reason)));return()=>{live=false};},[params.slug]);
  const { items: wishlist, toggle: toggleWishlist } = useWishlist(user?.id);
  const [wishlistError, setWishlistError] = useState("");
  const [reviewError, setReviewError] = useState("");
  if(error) return <div className="store-page"><div className="inline-error">{error}</div><Link className="under-link" href="/products">← Back to all gadgets</Link></div>;
  if(!product) return <div className="store-page"><div className="skeleton-detail"/></div>;
  const variant = product.variants[variantIndex];
  const photos = product.images ?? [];
  const selectedPhoto = photos[imageIndex];
  const image = productImageUrl(selectedPhoto?.url);
  const available = !!variant && variant.stockQuantity > 0;
  const totalPhotos = photos.length;
  const onSale = variant?.compareAtMinor != null && variant.compareAtMinor > variant.priceMinor;
  function movePhoto(offset: number) {
    setImageIndex((current) => (current + offset + totalPhotos) % totalPhotos);
  }
  const specifications = Object.entries(variant?.attributes ?? {});
  const isSaved = wishlist.some((item) => item.slug === product.slug);
  function saveProduct() {
    if (!product) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/products/${encodeURIComponent(product.slug)}`)}`);
      return;
    }
    try {
      toggleWishlist({ slug: product.slug, name: product.name });
      setWishlistError("");
    } catch {
      setWishlistError("Could not update your wishlist on this device.");
    }
  }
  async function submitReview(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!user){setNotice("Sign in with the account used for this purchase to leave a review.");return;}setReviewError("");const reviewForm=event.currentTarget;const form=new FormData(reviewForm);try{await api(`/products/${product!.id}/reviews`,{method:"POST",body:JSON.stringify({variantId:variant?.id,rating:Number(form.get("rating")),title:form.get("title")||undefined,body:form.get("body")||undefined})});setNotice("Thanks. Your review is sent for moderation.");reviewForm.reset();}catch(reason){setReviewError(errorMessage(reason));}}
  function addToBag(){if(!variant)return;addGuestLine({variantId:variant.id,productId:product!.id,name:product!.name,slug:product!.slug,image:image??"",sku:variant.sku,priceMinor:variant.priceMinor,quantity,attributes:variant.attributes});setNotice("Added to your cart.")}
  function buyNow(){if(!variant)return;addGuestLine({variantId:variant.id,productId:product!.id,name:product!.name,slug:product!.slug,image:image??"",sku:variant.sku,priceMinor:variant.priceMinor,quantity,attributes:variant.attributes});router.push("/checkout")}
  return (
    <div className={`store-page ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">›</span>
        <Link href="/products">Shop</Link><span aria-hidden="true">›</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <section className={styles.detail}>
        <div className={styles.gallery} aria-label="Product photos">
          <div className={styles.stage}>
            {image ? (
              <img className={styles.photo} src={image} alt={selectedPhoto?.alt || product.name} fetchPriority="high" />
            ) : <p className={styles.noPhoto}>No product photo available</p>}
            {totalPhotos > 1 && <>
              <button type="button" className={styles.previous} onClick={() => movePhoto(-1)} aria-label="Previous photo">‹</button>
              <button type="button" className={styles.next} onClick={() => movePhoto(1)} aria-label="Next photo">›</button>
              <span className={styles.counter} aria-live="polite">{imageIndex + 1} / {totalPhotos}</span>
            </>}
          </div>
          {totalPhotos > 1 && <div className={styles.thumbnails}>
            {photos.map((photo, index) => (
              <button key={index} type="button" aria-label={`View photo ${index + 1}`}
                aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}>
                <img src={productImageUrl(photo.url)} alt="" loading="lazy" />
              </button>
            ))}
          </div>}
        </div>

        <div className={styles.info}>
          {product.category && <small className={styles.category}>{product.category.name}</small>}
          <h1>{product.name}</h1>
          <div className={styles.offer}>
            <div className={styles.price}>
              <strong>{variant ? formatMoney(variant.priceMinor) : "Price on request"}</strong>
              {onSale && <del>{formatMoney(variant.compareAtMinor!)}</del>}
            </div>
            <span className={styles.stock} data-available={available}>{available ? "In stock" : "Currently unavailable"}</span>
          </div>
          {product.variants.length > 1 && (
            <label className={styles.variant}>Choose an option
              <select value={variantIndex} onChange={(event) => {
                setVariantIndex(Number(event.target.value));
                setQuantity(1);
              }}>
                {product.variants.map((option, index) => (
                  <option key={option.id} value={index}>{option.name || Object.values(option.attributes ?? {}).join(" / ") || option.sku}</option>
                ))}
              </select>
            </label>
          )}
          <div className={styles.purchase}>
            <div className={styles.quantity}>
              <span>Quantity</span>
              <div className="quantity-control" role="group" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}>−</button>
                <span>{quantity}</span>
                <button type="button" aria-label="Increase quantity" disabled={!available || quantity >= Math.min(99, variant.stockQuantity)} onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>
            <button className="primary-button" disabled={!available} onClick={addToBag}>Add to cart</button>
            <button className={styles.buyNow} disabled={!available} onClick={buyNow}>Buy now</button>
          </div>
          <button type="button" className={styles.wishlist} aria-pressed={isSaved} onClick={saveProduct}>
            {isSaved ? "♥ Saved to wishlist" : "♡ Save to wishlist"}
          </button>
          {wishlistError && <p role="alert">{wishlistError}</p>}
          <ul className={styles.benefits}>
            <li>Genuine gadgets</li><li>Delivery across Bangladesh</li><li>Secure checkout</li>
          </ul>
          <Link href="/shipping" className="under-link">Delivery, returns &amp; care</Link>
        </div>
      </section>
      {(product.description || specifications.length > 0) && (
        <section className={styles.overview} aria-labelledby="product-details-title">
          <h2 id="product-details-title">Product details</h2>
          {product.description && <p className={styles.description}>{product.description}</p>}
          {specifications.length > 0 && (
            <dl className={styles.specs}>
              {specifications.map(([name, value]) => (
                <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          )}
        </section>
      )}
      <section className={styles.reviews} aria-labelledby="reviews-title">
        <div>
          <h2 id="reviews-title">Customer reviews</h2>
          {reviews.length > 0 && <p>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>}
        </div>
        <div className="review-feed">
          {reviews.length ? reviews.map((review) => (
            <article key={review.id}>
              <span aria-label={`Rated ${review.rating} out of 5`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
              <p>{review.body}</p>
              <small>{review.user?.name ?? "Verified customer"} · Verified purchase</small>
            </article>
          )) : <p>No reviews yet.</p>}
          {user && (
            <form className="review-form" onSubmit={submitReview}>
              <h3>Share your experience</h3>
              <label>Rating<select name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></label>
              <label>Title<input name="title" maxLength={180}/></label>
              <label>Your review<textarea name="body" maxLength={5000} rows={4}/></label>
              {reviewError && <p className="inline-error" role="alert">{reviewError}</p>}
              <button className="primary-button">Send for review</button>
            </form>
          )}
        </div>
      </section>
      {notice&&<div className="toast" role="status">{notice}<Link href="/cart">View cart</Link><button onClick={()=>setNotice("")}>×</button></div>}
    </div>
  );
}
