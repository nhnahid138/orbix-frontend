"use client";

import { BrandSign } from "../../store-branding";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "../../providers";

export function AdminGuard({children}:{children:React.ReactNode}){const{user,loading}=useSession();const router=useRouter();useEffect(()=>{if(!loading&&(!user||user.role!=="admin"))router.replace("/login?next=%2Fadmin")},[user,loading,router]);if(loading||user?.role!=="admin")return <div className="admin-gate"><Link href="/"><BrandSign/></Link><p>Verifying your store access…</p></div>;return children}
