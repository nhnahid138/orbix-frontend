import { ShopShell } from "../shop-shell";
import "../commerce.css";
import "../gadget-commerce.css";

export default function CommerceLayout({ children }: { children: React.ReactNode }) {
  return <ShopShell>{children}</ShopShell>;
}
