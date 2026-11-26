"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../../../../lib/api";
import { PageTitle } from "../../../shop-shell";

type Banner = {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};
const emptyForm = {
  eyebrow: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "Shop the collection",
  ctaHref: "/products",
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
  isActive: true,
};
function localTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
export default function AdminContentPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [image, setImage] = useState<{ file: File; preview: string } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.preview);
    },
    [image],
  );

  function clearImage() {
    setImage(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function chooseImage(file?: File) {
    setImage(null);
    setError("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type,
      ) ||
      file.size > 8 * 1024 * 1024 ||
      !file.size
    ) {
      clearImage();
      setError("Choose a JPG, PNG, WebP or AVIF image up to 8 MB.");
      return;
    }
    setImage({ file, preview: URL.createObjectURL(file) });
  }

  const load = () =>
    api<Banner[]>("/admin/banners")
      .then((items) => setBanners(items))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  function startEdit(banner: Banner) {
    clearImage();
    setError("");
    setNotice("");
    setForm({
      eyebrow: banner.eyebrow,
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl,
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      sortOrder: String(banner.sortOrder),
      startsAt: localTime(banner.startsAt),
      endsAt: localTime(banner.endsAt),
      isActive: banner.isActive,
    });
    setEditing(banner.id);
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeForm() {
    clearImage();
    setOpen(false);
    setError("");
  }
  function startCreate() {
    clearImage();
    setError("");
    setNotice("");
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let imageUrl = form.imageUrl;
      if (image) {
        setUploading(true);
        const body = new FormData();
        body.append("file", image.file);
        const result = await api<{ url: string }>("/admin/media/banners", {
          method: "POST",
          body,
        });
        imageUrl = result.url;
        update("imageUrl", imageUrl);
        clearImage();
        setUploading(false);
      }
      const data = {
        ...form,
        imageUrl,
        subtitle: form.subtitle || undefined,
        sortOrder: Number(form.sortOrder),
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };
      await api(editing ? `/admin/banners/${editing}` : "/admin/banners", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(data),
      });
      setNotice(editing ? "Banner updated." : "Banner added.");
      setOpen(false);
      setEditing(null);
      await load();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setUploading(false);
      setBusy(false);
    }
  }
  async function archive(banner: Banner) {
    if (!confirm(`Archive “${banner.title.replace("\n", " ")}”?`)) return;
    try {
      await api(`/admin/banners/${banner.id}`, { method: "DELETE" });
      setNotice("Banner archived.");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  function update<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <PageTitle
          eyebrow="STOREFRONT CONTENT"
          title="Homepage banners."
          text="Create a small carousel of seasonal stories. Schedule, reorder, preview, and publish from here."
        />
        <button
          className="admin-primary"
          disabled={busy}
          onClick={open ? closeForm : startCreate}
        >
          {open ? "Close" : "＋ Add banner"}
        </button>
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      {notice && <div className="inline-success">{notice}</div>}
      {open && (
        <form onSubmit={submit}>
          <fieldset className="admin-create-form banner-form" disabled={busy}>
            <h2>
              {editing ? "Edit homepage banner" : "Create homepage banner"}
            </h2>
            <label>
              Eyebrow
              <input
                required
                maxLength={100}
                value={form.eyebrow}
                onChange={(e) => update("eyebrow", e.target.value)}
              />
            </label>
            <label>
              Headline
              <input
                required
                maxLength={180}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Make room for better days"
              />
            </label>
            <label>
              Button label
              <input
                required
                maxLength={80}
                value={form.ctaLabel}
                onChange={(e) => update("ctaLabel", e.target.value)}
              />
            </label>
            <label className="span-two">
              Supporting text
              <textarea
                rows={3}
                maxLength={3000}
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </label>
            <div className="banner-image-picker">
              <label>
                Upload banner image
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  aria-describedby="banner-image-help"
                  onChange={(event) =>
                    chooseImage(event.currentTarget.files?.[0])
                  }
                />
              </label>
              <small id="banner-image-help">
                JPG, PNG, WebP or AVIF · Up to 8 MB
              </small>
              {image && (
                <div>
                  <span>{image.file.name}</span>{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={clearImage}
                  >
                    Remove selection
                  </button>
                </div>
              )}
              <label>
                Or use an image URL
                <input
                  type="url"
                  required={!image}
                  disabled={!!image}
                  maxLength={2048}
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  placeholder="https://…"
                />
              </label>
            </div>
            <label>
              Button destination
              <input
                required
                maxLength={255}
                value={form.ctaHref}
                onChange={(e) => update("ctaHref", e.target.value)}
                placeholder="/products"
              />
            </label>
            <label>
              Display order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", e.target.value)}
              />
            </label>
            <label>
              Starts at
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => update("startsAt", e.target.value)}
              />
            </label>
            <label>
              Ends at
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => update("endsAt", e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
              />{" "}
              Active (respecting schedule)
            </label>
            <div className="banner-form-actions">
              <button className="admin-primary" disabled={busy}>
                {uploading
                  ? "Uploading image…"
                  : busy
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Publish banner"}
              </button>
              <button type="button" className="text-button" onClick={closeForm}>
                Cancel
              </button>
            </div>
            <div
              className="banner-live-preview"
              style={{
                backgroundImage: `linear-gradient(90deg,#f2ede2e8,transparent),url(${JSON.stringify(image?.preview || form.imageUrl)})`,
              }}
            >
              <small>{form.eyebrow || "BANNER EYEBROW"}</small>
              <b>{form.title || "Your headline"}</b>
              <span>{form.ctaLabel || "Button label"} ↗</span>
            </div>
          </fieldset>
        </form>
      )}
      <div className="banner-list-head">
        <div>
          <small>HOMEPAGE SLIDES</small>
          <h2>{banners.length} banners</h2>
        </div>
        <span>
          Shown by display order. Scheduled and inactive slides stay hidden from
          visitors.
        </span>
      </div>
      {loading ? (
        <div className="admin-loading">Loading banners…</div>
      ) : banners.length ? (
        <div className="banner-admin-grid">
          {banners.map((banner) => (
            <article className="banner-admin-card" key={banner.id}>
              <div
                className="banner-admin-preview"
                style={{
                  backgroundImage: `linear-gradient(90deg,#f2ede2ed,transparent),url('${banner.imageUrl}')`,
                }}
              >
                <small>{banner.eyebrow}</small>
                <b>{banner.title}</b>
                <span>{banner.ctaLabel} ↗</span>
              </div>
              <div className="banner-admin-info">
                <div>
                  <span
                    className={
                      banner.isActive ? "banner-active" : "banner-inactive"
                    }
                  >
                    {banner.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <small>
                    ORDER {banner.sortOrder}
                    {banner.startsAt
                      ? ` · FROM ${new Date(banner.startsAt).toLocaleString()}`
                      : ""}
                    {banner.endsAt
                      ? ` · UNTIL ${new Date(banner.endsAt).toLocaleString()}`
                      : ""}
                  </small>
                </div>
                <div>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => startEdit(banner)}
                  >
                    Edit
                  </button>
                  <button
                    className="remove-link"
                    disabled={busy}
                    onClick={() => archive(banner)}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-empty banner-empty">
          No banners yet. Add the first story for the Orbix homepage.
        </div>
      )}
    </div>
  );
}
