"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import Link from "next/link";
import { api, errorMessage, formatMoney } from "../../../../lib/api";
import { addGuestLine } from "../../../../lib/guest-cart";
import { useWishlist } from "../../../../lib/wishlist";
import { useSession } from "../../../providers";

type Product = { id:number; name:string; slug:string; description:string; category?:{name:string}; images:{url:string;alt?:string}[]; variants:{id:number;sku:string;name?:string;priceMinor:number;compareAtMinor?:number;stockQuantity:number;attributes:Record<string,string>}[] };
type Review = { id:number; rating:number; body:string; user?:{name:string}; createdAt:string };
export default function ProductDetailPage() {
  const params = useParams<{slug:string}>(); const router=useRouter(); const {user}=useSession(); const [product,setProduct]=useState<Product|null>(null); const [reviews,setReviews]=useState<Review[]>([]); const [variantIndex,setVariantIndex]=useState(0); const [imageIndex,setImageIndex]=useState(0); const [quantity,setQuantity]=useState(1); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  useEffect(()=>{let live=true; api<Product>(`/products/${encodeURIComponent(params.slug)}`).then((data)=>{if(live){setProduct(data);if(data.id) api<{items:Review[]}>(`/products/${data.id}/reviews`).then((result)=>live&&setReviews(result.items??[])).catch(()=>{});}}).catch((reason)=>live&&setError(errorMessage(reason)));return()=>{live=false};},[params.slug]);
  const { items: wishlist, toggle: toggleWishlist } = useWishlist(user?.id);
  const [wishlistError, setWishlistError] = useState("");
  if(error) return <div className="store-page"><div className="inline-error">{error}</div><Link className="under-link" href="/products">← Back to all gadgets</Link></div>;
  if(!product) return <div className="store-page"><div className="skeleton-detail"/></div>;
  const variant=product.variants[variantIndex]; const image=product.images?.[imageIndex]?.url;
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
  async function submitReview(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!user){setNotice("Sign in with the account used for this purchase to leave a review.");return;}const reviewForm=event.currentTarget;const form=new FormData(reviewForm);try{await api(`/products/${product!.id}/reviews`,{method:"POST",body:JSON.stringify({variantId:variant?.id,rating:Number(form.get("rating")),title:form.get("title")||undefined,body:form.get("body")||undefined})});setNotice("Thanks. Your review is sent for moderation.");reviewForm.reset();}catch(reason){setError(errorMessage(reason));}}
  function addToBag(){if(!variant)return;addGuestLine({variantId:variant.id,productId:product!.id,name:product!.name,slug:product!.slug,image:image??"",sku:variant.sku,priceMinor:variant.priceMinor,quantity,attributes:variant.attributes});setNotice("Added to your cart.")}
  function buyNow(){if(!variant)return;addGuestLine({variantId:variant.id,productId:product!.id,name:product!.name,slug:product!.slug,image:image??"",sku:variant.sku,priceMinor:variant.priceMinor,quantity,attributes:variant.attributes});router.push("/checkout")}
  return <div className="store-page"><div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/products">Shop</Link> / {product.name}</div><section className="product-detail"><div className="detail-gallery"><div className="detail-image" style={image?{backgroundImage:`url('${image}')`}:undefined}/><div className="detail-thumbs">{product.images?.map((item,index)=><button key={item.url} aria-label={`View image ${index+1}`} style={{backgroundImage:`url('${item.url}')`}} className={index===imageIndex?"selected":""} onClick={()=>setImageIndex(index)}/>)}</div></div><div className="detail-info"><small>{product.category?.name??"ORBIX GADGET"}</small><h1>{product.name}</h1><div className="detail-rating">★★★★★ <span>{reviews.length ? `${reviews.length} verified reviews` : "Be the first to review"}</span></div><strong>{variant?formatMoney(variant.priceMinor):"—"}</strong><p className="detail-description">{product.description || "A great gadget, selected for reliable everyday performance. Check the specifications and choose your preferred option below."}</p>{variant?.attributes && Object.keys(variant.attributes).length>0&&<label className="variant-select">Choose an option<select value={variantIndex} onChange={(event)=>setVariantIndex(Number(event.target.value))}>{product.variants.map((item,index)=><option key={item.id} value={index}>{item.name||Object.values(item.attributes).join(" / ")||item.sku}</option>)}</select></label>}<div className="availability">{variant?.stockQuantity>0?<><i/> In stock · ships with care</>:"Currently unavailable"}</div><div className="detail-buy gadget-detail-buy"><div className="quantity-control"><button onClick={()=>setQuantity((n)=>Math.max(1,n-1))}>−</button><span>{quantity}</span><button onClick={()=>setQuantity((n)=>Math.min(variant?.stockQuantity??1,n+1))}>+</button></div><button className="primary-button" disabled={!variant||variant.stockQuantity<1} onClick={addToBag}>Add to cart <span>{variant?formatMoney(variant.priceMinor*quantity):""}</span></button><button className="primary-button buy-now-button" disabled={!variant||variant.stockQuantity<1} onClick={buyNow}>Buy now <span>→</span></button></div><button type="button" className="text-button" aria-pressed={isSaved} onClick={saveProduct}>{isSaved ? "♥ Saved to wishlist" : "♡ Save to wishlist"}</button>{wishlistError && <p role="alert">{wishlistError}</p>}<div className="detail-promises"><p>✓ &nbsp; Genuine gadgets</p><p>⌂ &nbsp; Delivery across Bangladesh</p><p>৳ &nbsp; Secure checkout</p></div><Link href="/shipping" className="under-link">Delivery, returns & care</Link></div></section><section className="reviews-section"><div><small>WHAT CUSTOMERS SAY</small><h2>Reviews.</h2></div><div className="review-feed">{reviews.length?reviews.map((review)=><article key={review.id}><span>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span><p>{review.body}</p><small>{review.user?.name??"Verified customer"} · Verified purchase</small></article>):<p>Reviews appear here after verified customers share their experience.</p>}{user&&<form className="review-form" onSubmit={submitReview}><h3>Share your experience</h3><label>Rating<select name="rating" defaultValue="5">{[5,4,3,2,1].map((rating)=><option key={rating} value={rating}>{rating} stars</option>)}</select></label><label>Title<input name="title" maxLength={180}/></label><label>Your review<textarea name="body" maxLength={5000} rows={4}/></label><button className="primary-button">Send for review <span>→</span></button></form>}</div></section>{error&&<div className="inline-error">{error}</div>}{notice&&<div className="toast" role="status">{notice}<Link href="/cart">View cart</Link><button onClick={()=>setNotice("")}>×</button></div>}</div>;
}
