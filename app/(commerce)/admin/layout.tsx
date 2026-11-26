import Link from "next/link";
import { BrandSign } from "../../store-branding";
import { AdminGuard } from "./ui";
import "../../admin.css";

const links=[["/admin","Overview","◫"],["/admin/products","Products & stock","□"],["/admin/categories","Categories","▦"],["/admin/orders","Orders","↗"],["/admin/coupons","Coupons","%"],["/admin/reviews","Reviews","☆"],["/admin/users","Customers","♙"],["/admin/audit-logs","Audit trail","⌁"],["/admin/content","Homepage banners","▤"],["/admin/branding","Branding & footer","◈"]];
export default function AdminLayout({children}:{children:React.ReactNode}){return <AdminGuard><div className="admin-layout"><aside className="admin-sidebar"><Link className="admin-brand" href="/"><BrandSign /><small>STORE STUDIO</small></Link><nav>{links.map(([href,label,icon])=><Link href={href} key={href}><span>{icon}</span>{label}</Link>)}</nav><div className="admin-sidebar-bottom"><small>MANAGE YOUR STORE</small><Link href="/">← Back to storefront</Link></div></aside><div className="admin-workspace"><header className="admin-topbar"><span>Orbix Store Studio</span><span>Commerce administration <i/></span></header><div className="admin-content">{children}</div></div></div></AdminGuard>}
