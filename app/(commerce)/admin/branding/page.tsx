"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage } from "../../../../lib/api";
import { StoreFooter, useBranding, type Branding, type BrandingRecord } from "../../../store-branding";
import "./editor.css";

type ListName = "locations" | "about" | "policies" | "apps" | "social";
type TextName = Exclude<keyof Branding, ListName>;
const lists: { key: ListName; title: string; add: string }[] = [
  {key:"locations",title:"Store locations",add:"location"},
  {key:"about",title:"Company links",add:"company link"},
  {key:"policies",title:"Policy links",add:"policy link"},
  {key:"apps",title:"App downloads",add:"app link"},
  {key:"social",title:"Social media & WhatsApp",add:"social link"},
];
const allowedLink = /^(?:https?:\/\/[^\s\\/]+(?:[/?#][^\s\\]*)?|\/(?!\/)[^\s\\]*)$/i;
const socialPlatforms = ["Facebook", "YouTube", "Instagram", "TikTok"] as const;

export default function BrandingPage() {
  const {record, error, publish} = useBranding();
  if (!record) return <div className="admin-page" role="status">{error || "Loading branding settings…"}</div>;
  return <BrandingEditor initial={record} publish={publish}/>;
}

function BrandingEditor({initial, publish}: {initial: BrandingRecord; publish: (record: BrandingRecord) => void}) {
  const [draft, setDraft] = useState<Branding>({...initial.content, whatsapp: initial.content.whatsapp || "01581633218"});
  const [version, setVersion] = useState(initial.version);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function setText(key: TextName, value: string) {
    setDraft(current=>({...current,[key]:value}));
    setNotice("");
  }
  function field(key: TextName, label: string, type = "text") {
    return <label>{label}<input type={type} value={draft[key] ?? ""} required={key==="brand"} onChange={event=>setText(key,event.target.value)}/></label>;
  }
  function socialValue(platform: string) {
    return draft.social.find(item => item.label.toLowerCase().includes(platform.toLowerCase()) || item.href.toLowerCase().includes(`${platform.toLowerCase()}.com`))?.href ?? "";
  }
  function setSocial(platform: string, href: string) {
    setDraft(current => {
      const index = current.social.findIndex(item => item.label.toLowerCase().includes(platform.toLowerCase()) || item.href.toLowerCase().includes(`${platform.toLowerCase()}.com`));
      const social = [...current.social];
      if (index >= 0) {
        if (href) social[index] = {...social[index], href};
        else social.splice(index, 1);
      } else if (href) social.push({label: platform, href});
      return {...current, social};
    });
    setNotice("");
  }
  async function upload(file?: File) {
    if (!file) return;
    setError(""); setNotice("");
    if (file.size > 8 * 1024 * 1024) { setError("Choose an image up to 8 MB."); return; }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const image = await api<{url:string}>("/admin/media/logos",{method:"POST",body});
      setText("logo", image.url);
      setNotice("Logo uploaded. Save & publish to use it in the website header and footer.");
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setNotice(""); setError("");
    const urls = [draft.logo,draft.creditUrl,...lists.flatMap(({key})=>draft[key].map(item=>item.href))];
    if (urls.some(url=>url && !allowedLink.test(url))) { setError("Use a full http(s) URL or a path beginning with /."); return; }
    setBusy(true);
    try {
      const result=await api<BrandingRecord>("/admin/branding",{method:"PATCH",body:JSON.stringify({version,content:draft})});
      setVersion(result.version); publish(result); setNotice("Branding and footer published.");
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }
  return <div className="admin-page branding-editor">
    <h1>Branding & footer</h1>
    <form onSubmit={save}>
      <fieldset disabled={busy}>
        <section><h2>Store identity</h2><div className="branding-fields">
          {field("brand","Store name")}{field("tagline","Footer description")}
          <label>Main website logo · JPG, PNG, WebP or AVIF<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0]; e.target.value=""; void upload(file);}}/></label>
          {field("logo","Header & footer logo URL (clear to show store name)")}
        </div></section>
        <section><h2>Contact details</h2><div className="branding-fields">
          {field("phoneLabel","Phone label")}{field("phone","Phone number","tel")}
          {field("whatsapp","Call us · WhatsApp number","tel")}
          {field("emailLabel","Email label")}{field("email","Email address","email")}
        </div></section>
        {lists.map(({key,title,add})=><section key={key}><h2>{title}</h2>
          {key==="social" && <div className="branding-fields">{socialPlatforms.map(platform=><label key={platform}>{platform} URL<input type="url" value={socialValue(platform)} placeholder={`https://${platform.toLowerCase()}.com/…`} onChange={event=>setSocial(platform,event.target.value)}/></label>)}</div>}
          {key==="locations" && field("locationHeading","Column heading")}
          {key==="about" && field("aboutHeading","Column heading")}
          {key==="policies" && field("policyHeading","Column heading")}
          {draft[key].map((item,index)=>{
            function change(prop: "label"|"href"|"detail", value: string) {
              setDraft(current=>({...current,[key]:current[key].map((row,i)=>i===index?{...row,[prop]:value}:row)}));
              setNotice("");
            }
            return <div className="branding-entry" key={index}>
              <label>{key==="locations"?"Outlet name":"Link label"}<input required maxLength={key==="locations"?160:100} value={item.label} onChange={e=>change("label",e.target.value)}/></label>
              {key==="locations" && <label>Address / hours<textarea rows={2} value={"detail" in item ? String(item.detail) : ""} onChange={e=>change("detail",e.target.value)}/></label>}
              <label>{key==="locations"?"Map or outlet URL (optional)":"Destination"}<input required={key!=="locations"} value={item.href} onChange={e=>change("href",e.target.value)} placeholder="/contact or https://…"/></label>
              <button type="button" className="remove-link" onClick={()=>{setDraft(current=>({...current,[key]:current[key].filter((_,i)=>i!==index)}));setNotice("");}}>Remove</button>
            </div>;
          })}
          <button type="button" className="text-button" onClick={()=>{setDraft(current=>({...current,[key]:[...current[key],key==="locations"?{label:"",detail:"",href:""}:{label:"",href:""}]}));setNotice("");}}>＋ Add {add}</button>
        </section>)}
        <section><h2>Copyright & credit</h2><div className="branding-fields">
          {field("copyright","Copyright line")}{field("credit","Developer credit")}{field("creditUrl","Credit link (optional)")}
        </div></section>
        <h2>Footer preview</h2><div inert><StoreFooter preview={draft}/></div>
        {error && <p role="alert" className="inline-error">{error}</p>}
        {notice && <p role="status" className="inline-success">{notice}</p>}
        <button className="admin-primary" type="submit">{busy?"Working…":"Save & publish"}</button>
      </fieldset>
    </form>
  </div>;
}
