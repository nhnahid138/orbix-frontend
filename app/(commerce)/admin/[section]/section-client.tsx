"use client";

import Link from "next/link";
import { FormEvent,useCallback,useEffect,useState } from "react";
import { useParams } from "next/navigation";
import { api,errorMessage } from "../../../../lib/api";

import { PricingFields, readPricing, money, type VariantPricing } from "./product-pricing";

function categoryOptions(categories: Row[], excludedId?: number) {
  const byId = new Map(categories.map(category => [category.id, category]));
  const options = categories.flatMap(category => {
    const names: string[] = [];
    const visited = new Set<number>();
    let current: Row | undefined = category;
    while (current?.id !== undefined) {
      if (current.id === excludedId || visited.has(current.id)) return [];
      visited.add(current.id);
      names.unshift(current.name ?? "");
      current = current.parent ? byId.get(current.parent.id) : undefined;
    }
    return [{ id: category.id, label: names.join(" › ") }];
  });
  return options.sort((a, b) => a.label.localeCompare(b.label))
    .map(option => <option key={option.id} value={option.id}>{option.label}</option>);
}

type VariantRow=VariantPricing & {id:number;sku:string;name?:string|null;stockQuantity:number};
type Row={ [key:string]:unknown; id?:number; orderNumber?:string; name?:string; status?:string; orderStatus?:string; isActive?:boolean; variants?:VariantRow[]; images?:{url:string;alt?:string|null;sortOrder?:number}[]; parent?: {id:number; name:string} | null; };
const config:Record<string,{title:string;eyebrow:string;endpoint:string;columns:string[]}>={products:{title:"Products & stock",eyebrow:"CATALOG",endpoint:"/admin/products?limit=100",columns:["name","status","category","variants"]},categories:{title:"Categories",eyebrow:"CATALOG",endpoint:"/admin/categories",columns:["name","mainImageUrl","coverImageUrl","parent","slug","isActive","sortOrder"]},orders:{title:"Orders",eyebrow:"FULFILMENT",endpoint:"/admin/orders?limit=100",columns:["orderNumber","orderStatus","paymentStatus","totalMinor","createdAt"]},coupons:{title:"Coupons",eyebrow:"PROMOTIONS",endpoint:"/admin/coupons",columns:["code","discountType","discountValue","usageCount","isActive"]},reviews:{title:"Customer reviews",eyebrow:"COMMUNITY",endpoint:"/admin/reviews",columns:["product","user","rating","body","status"]},users:{title:"Customers",eyebrow:"PEOPLE",endpoint:"/admin/users?limit=100",columns:["name","email","phoneNumber","status","createdAt"]},"audit-logs":{title:"Store audit trail",eyebrow:"ACCOUNTABILITY",endpoint:"/admin/audit-logs?limit=100",columns:["action","entityType","entityId","actor","createdAt"]}};
function show(value:unknown,key:string){if(value===null||value===undefined)return "—";if(typeof value==="boolean")return value?"Active":"Hidden";if(typeof value==="object"){if(Array.isArray(value))return `${value.length} items`;if("name"in value)return String(value.name);if("email"in value)return String(value.email);if("slug"in value)return String(value.slug);return JSON.stringify(value)}if(typeof value==="number"&&key.toLowerCase().includes("minor"))return `৳${Math.round(value/100).toLocaleString("en-BD")}`;if(typeof value==="string"&&(key.toLowerCase().includes("date")||key==="createdAt"))return new Date(value).toLocaleDateString("en-BD");return String(value)}
export default function AdminSectionPage(){const{section}=useParams<{section:string}>();const details=config[section];const[rows,setRows]=useState<Row[]>([]);const[categories,setCategories]=useState<Row[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");const[notice,setNotice]=useState("");const[search,setSearch]=useState("");const[showForm,setShowForm]=useState(false);const[busy,setBusy]=useState(false);const[stockTarget,setStockTarget]=useState<Row|null>(null);
const [editingPrice, setEditingPrice] = useState<{ product: Row; variant: VariantRow } | null>(null);
const [editingProductImage, setEditingProductImage] = useState<Row | null>(null);
const [editingCategory, setEditingCategory] = useState<Row | null>(null);

function editCategory(row: Row) {
  setEditingCategory(row);
  setShowForm(true);
  setError("");
  setNotice("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteCategory(row: Row) {
  if (!window.confirm(`Permanently delete “${row.name}”? Its products will become uncategorized and its subcategories will become top-level categories.`)) return;
  setBusy(true);
  setError("");
  setNotice("");
  try {
    await api(`/admin/categories/${row.id}/permanent`, { method: "DELETE" });
    setRows((current) => current.filter((entry) => entry.id !== row.id));
    if (editingCategory?.id === row.id) {
      setEditingCategory(null);
      setShowForm(false);
    }
    setNotice(`Deleted “${row.name}”.`);
  } catch (reason) {
    setError(errorMessage(reason));
  } finally {
    setBusy(false);
  }
}

const load=useCallback(()=>{if(!details)return;return api<Row[]|{items:Row[]}>(details.endpoint).then((data)=>setRows(Array.isArray(data)?data:(data as {items:Row[]}).items??[])).catch((e)=>setError(errorMessage(e))).finally(()=>setLoading(false))},[details]);useEffect(()=>{load();if(section==="products")api<Row[]>("/admin/categories").then(setCategories).catch(()=>{})},[load,section]);
async function action(row:Row,actionName:string,value?:string){setBusy(true);setError("");setNotice("");try{if(section==="orders")await api(`/admin/orders/${row.id}/status`,{method:"PATCH",body:JSON.stringify({status:value})});else if(section==="reviews")await api(`/admin/reviews/${row.id}`,{method:"PATCH",body:JSON.stringify({status:value})});else if(section==="users")await api(`/admin/users/${row.id}/status`,{method:"PATCH",body:JSON.stringify({status:value})});else if(section==="categories"&&actionName==="archive")await api(`/admin/categories/${row.id}`,{method:"DELETE"});else if(section==="coupons"&&actionName==="archive")await api(`/admin/coupons/${row.id}/archive`,{method:"POST"});else if(section==="products"&&actionName==="feature")await api(`/admin/products/${row.id}`,{method:"PATCH",body:JSON.stringify({isFeatured:!row.isFeatured})});else if(section==="products"&&actionName==="archive")await api(`/admin/products/${row.id}`,{method:"PATCH",body:JSON.stringify({status:"archived"})});setNotice("Changes saved and recorded.");await load()}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget);try{if(section==="products"){const name=String(form.get("name"));const pricing=readPricing(form);const stock=Number(form.get("stock"));const category=Number(form.get("category"));let image=String(form.get("image"));const imageFile=form.get("imageFile");if(imageFile instanceof File&&imageFile.size>0){const uploadData=new FormData();uploadData.append("file",imageFile);const uploaded=await api<{url:string}>("/admin/media/products",{method:"POST",body:uploadData});image=uploaded.url;}await api("/admin/products",{method:"POST",body:JSON.stringify({name,categoryId:category||undefined,status:"active",isFeatured:form.get("featured")==="on",description:form.get("description"),variants:[{sku:String(form.get("sku")||`${Date.now()}`),...pricing,stockQuantity:stock}],images:image?[{url:image,alt:name,sortOrder:0}]:[]})});}else if(section==="categories"){
  const id = editingCategory?.id;
  const saved = await api<Row>(id ? `/admin/categories/${id}` : "/admin/categories", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify({
      name: String(form.get("name")).trim(),
      coverImageUrl: await (async () => {
        const file = form.get("coverImage") as File;
        if (!file || file.size === 0) return editingCategory?.coverImageUrl ?? null;
        const data = new FormData(); data.append("file", file);
        return (await api<{url:string}>("/admin/media/categories", {method:"POST", body:data})).url;
      })(),
      mainImageUrl: await (async () => {
        const file = form.get("mainImage") as File;
        if (!file || file.size === 0) return editingCategory?.mainImageUrl ?? null;
        const data = new FormData(); data.append("file", file);
        return (await api<{url:string}>("/admin/media/categories", {method:"POST", body:data})).url;
      })(),
      slug: String(form.get("slug")).trim() || undefined,
      description: String(form.get("description")).trim(),
      parentId: Number(form.get("parentId")) || null,
      sortOrder: Number(form.get("sortOrder") || 0),
      isActive: form.get("isActive") === "on",
    }),
  });
  setRows((current) => id ? current.map((row) => row.id === id ? saved : row) : [...current, saved]);
  setEditingCategory(null);
}else if(section==="coupons"){await api("/admin/coupons",{method:"POST",body:JSON.stringify({code:form.get("code"),discountType:form.get("discountType"),discountValue:Number(form.get("discountValue")),minimumSubtotalMinor:Math.round(Number(form.get("minimumSubtotal")||0)*100),usageLimit:form.get("usageLimit")?Number(form.get("usageLimit")):undefined,isActive:true})});}setShowForm(false);setNotice("Saved successfully.");await load()}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
async function submitStock(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!stockTarget)return;setBusy(true);const form=new FormData(event.currentTarget);try{await api(`/admin/products/${stockTarget.id}/stock-adjustments`,{method:"POST",body:JSON.stringify({variantId:Number(form.get("variantId")),quantityDelta:Number(form.get("quantityDelta")),reason:form.get("reason"),note:form.get("note")||undefined})});setNotice("Stock adjustment saved to the inventory ledger.");setStockTarget(null);load()}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
if(!details)return <div className="admin-page"><h1>Section not found</h1><Link href="/admin">Back to overview</Link></div>;
const filtered=rows.filter((row)=>JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
return <div className="admin-page"><div className="admin-page-heading"><div><small>{details.eyebrow}</small><h1>{details.title}</h1><p>Manage this part of the Orbix store.</p></div>{["products","categories","coupons"].includes(section)&&<button className="admin-primary" disabled={busy} onClick={()=>{setEditingCategory(null);setShowForm((value)=>!value);setNotice("");setError("")}}>{showForm?"Close":"＋ Create new"}</button>}</div>{error&&<div className="inline-error">{error}</div>}{notice&&<div className="inline-success">{notice}</div>}{showForm&&<form key={editingCategory?.id ?? "create"} className="admin-create-form" onSubmit={submit}><h2>{section==="products"?"Add a product":section==="categories"?(editingCategory?"Edit category":"Create category"):"Create a coupon"}</h2>{section==="products"?<><label>Product name<input name="name" required minLength={1}/></label><label>SKU<input name="sku" required/></label><PricingFields/><label>Feature on homepage<input name="featured" type="checkbox"/></label><label>Opening stock<input name="stock" type="number" min="0" required/></label><label>Category / subcategory<select name="category"><option value="">Uncategorized</option>{categoryOptions(categories)}</select></label><label>Upload product image<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/></label><label>Or use image URL<input name="image" type="url" placeholder="https://…"/></label><label className="span-two">Description<textarea name="description" rows={3}/></label></>:section==="categories"?<>
  <label>Parent category<select name="parentId" defaultValue={editingCategory?.parent?.id ?? ""}><option value="">None (top-level category)</option>{categoryOptions(rows, editingCategory?.id)}</select></label>
  <label>Category name<input name="name" defaultValue={editingCategory?.name ?? ""} required maxLength={100} pattern=".*\S.*"/></label>
  <label>URL slug<input name="slug" defaultValue={String(editingCategory?.slug ?? "")} maxLength={120}/></label>
  <label className="span-two">Main photo (home page category)<input name="mainImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/></label>
  {editingCategory?.mainImageUrl && <img src={String(editingCategory.mainImageUrl)} alt="Current category main photo" style={{maxWidth:180,borderRadius:12}}/>}
  <label className="span-two">Cover photo (category page banner)<input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/></label>
  {editingCategory?.coverImageUrl && <img src={String(editingCategory.coverImageUrl)} alt="Current category cover" style={{maxWidth:320,borderRadius:12}}/>}
  <label>Sort order<input name="sortOrder" type="number" step="1" defaultValue={Number(editingCategory?.sortOrder ?? 0)}/></label>
  <label className="span-two">Description<textarea name="description" rows={2} maxLength={3000} defaultValue={String(editingCategory?.description ?? "")}/></label>
  <label>Show on storefront<input type="checkbox" name="isActive" defaultChecked={editingCategory?.isActive ?? true}/></label>
</>:<><label>Coupon code<input name="code" required/></label><label>Discount type<select name="discountType"><option value="fixed">Fixed amount</option><option value="percent">Percent</option></select></label><label>Discount value<input name="discountValue" type="number" min="1" required/></label><label>Minimum subtotal (BDT)<input name="minimumSubtotal" type="number" min="0" defaultValue="0"/></label><label>Usage limit<input name="usageLimit" type="number" min="1"/></label></>}<button disabled={busy} className="admin-primary">{busy?"Saving…":"Save"}</button></form>}{editingProductImage && <form className="admin-create-form" onSubmit={async event=>{event.preventDefault();setBusy(true);setError("");try{const form=new FormData(event.currentTarget);let image=String(form.get("imageUrl")??"").trim();const file=form.get("imageFile");if(file instanceof File&&file.size>0){const data=new FormData();data.append("file",file);image=(await api<{url:string}>("/admin/media/products",{method:"POST",body:data})).url;}if(!image)throw new Error("Choose an image or enter an image URL.");const existing=editingProductImage.images??[];await api(`/admin/products/${editingProductImage.id}`,{method:"PATCH",body:JSON.stringify({images:[{url:image,alt:String(editingProductImage.name??""),sortOrder:0},...existing.slice(1)]})});setEditingProductImage(null);await load();setNotice("Product image saved.")}catch(reason){setError(errorMessage(reason))}finally{setBusy(false)}}}><h2>Product image · {editingProductImage.name}</h2>{editingProductImage.images?.[0]?.url&&<img className="admin-edit-image" src={editingProductImage.images[0].url} alt="Current product image"/>}<label>Upload new image<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/></label><label>Or image URL<input name="imageUrl" type="url" placeholder="https://…"/></label><button disabled={busy} className="admin-primary">{busy?"Saving…":"Save image"}</button><button type="button" onClick={()=>setEditingProductImage(null)}>Cancel</button></form>}{editingPrice && <form className="admin-create-form" key={editingPrice.variant.id} onSubmit={async event => {
  event.preventDefault(); setBusy(true); setError("");
  try {
    const pricing = readPricing(new FormData(event.currentTarget));
    const {sku, stockQuantity} = editingPrice.variant;
    await api(`/admin/products/${editingPrice.product.id}`, {method:"PATCH",body:JSON.stringify({variants:[{sku, stockQuantity, ...pricing}]})});
    setEditingPrice(null); await load(); setNotice("Pricing saved.");
  } catch(reason) { setError(errorMessage(reason)); } finally { setBusy(false); }
}}><h2>Pricing · {editingPrice.product.name} · {editingPrice.variant.sku}</h2><PricingFields variant={editingPrice.variant}/><button className="admin-primary" disabled={busy}>Save pricing</button><button type="button" onClick={()=>setEditingPrice(null)}>Cancel</button></form>}{stockTarget&&<form className="admin-create-form" onSubmit={submitStock}><h2>Adjust inventory · {String(stockTarget.name??"")}</h2><label>Variant<select name="variantId" required>{(stockTarget.variants??[]).map((variant)=><option key={variant.id} value={variant.id}>{variant.name||variant.sku} · {variant.stockQuantity} in stock</option>)}</select></label><label>Quantity change<input name="quantityDelta" type="number" required/></label><label>Reason<input name="reason" minLength={3} maxLength={40} required placeholder="restock, damage, correction"/></label><label className="span-two">Note<input name="note" maxLength={240}/></label><button disabled={busy} className="admin-primary">{busy?"Saving…":"Record adjustment"}</button><button type="button" className="text-button" onClick={()=>setStockTarget(null)}>Cancel</button></form>}<div className="admin-table-tools"><label>⌕ <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search this list"/></label><span>{filtered.length} records</span></div><div className="admin-table-wrap">{loading?<div className="admin-loading">Loading store data…</div>:<table className="admin-table"><thead><tr>{details.columns.map((column)=><th key={column}>{column.replace(/[A-Z]/g,(letter)=>` ${letter}`).toUpperCase()}</th>)}<th>ACTIONS</th></tr></thead><tbody>{filtered.map((row,index)=><tr key={row.id??row.orderNumber??index}>{details.columns.map((column)=><td key={column}>{section==="categories"&&(column==="mainImageUrl"||column==="coverImageUrl")?(typeof row[column]==="string"&&row[column]?<img className="admin-list-image" src={String(row[column])} alt={`${row.name} ${column==="mainImageUrl"?"main":"cover"} photo`}/>:"—"):section==="products"&&column==="name"?<span className="admin-product-name">{row.images?.[0]?.url?<img className="admin-list-image" src={row.images[0].url} alt={String(row.name??"Product")}/>:<span className="admin-list-image admin-image-empty">No image</span>}{row.name}</span>:column==="orderNumber"?<Link href={`/admin/orders`}>{show(row[column],column)}</Link>:column==="variants"?row.variants?.map(v=><div key={v.id}>{v.sku} · Gross profit/unit: {v.costMinor == null ? "—" : money(v.priceMinor-v.costMinor)} <button type="button" className="text-button" onClick={()=>{setEditingPrice({product:row,variant:v});window.scrollTo({top:0,behavior:"smooth"});}}>Edit pricing</button></div>):show(row[column],column)}</td>)}<td><div className="row-actions">{section==="orders"&&<select aria-label="Update order status" value={row.orderStatus} onChange={(e)=>action(row,"status",e.target.value)}><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select>}{section==="reviews"&&row.status==="pending"&&<><button onClick={()=>action(row,"status","published")}>Publish</button><button onClick={()=>action(row,"status","rejected")}>Reject</button></>}{section==="users"&&<button onClick={()=>action(row,"status",row.status==="blocked"?"active":"blocked")}>{row.status==="blocked"?"Unblock":"Block"}</button>}{section==="categories"&&<>
  <button disabled={busy} onClick={()=>editCategory(row)}>Edit</button>
  {row.isActive && <button disabled={busy} onClick={()=>action(row,"archive")}>Archive</button>}
  <button disabled={busy} className="remove-link" onClick={()=>deleteCategory(row)}>Delete</button>
</>}{section==="coupons"&&row.isActive&&<button onClick={()=>action(row,"archive")}>Archive</button>}{section==="products"&&<><button disabled={busy} onClick={()=>{setEditingProductImage(row);window.scrollTo({top:0,behavior:"smooth"})}}>Edit image</button><button disabled={busy} aria-pressed={Boolean(row.isFeatured)} onClick={()=>action(row,"feature")}>{row.isFeatured?"Remove from featured":"Feature on homepage"}</button><button onClick={()=>setStockTarget(row)}>Adjust stock</button><button onClick={()=>action(row,"archive")}>Archive</button></>}</div></td></tr>)}</tbody></table>}{!loading&&!filtered.length&&<div className="admin-empty">Nothing here yet.</div>}</div>{section==="products"&&<div className="admin-note">Every inventory change is sent to the backend stock ledger with an operator supplied reason.</div>}</div>}
