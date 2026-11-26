"use client";

import { FormEvent,useState } from "react";
import Link from "next/link";
import { withAccountAccess } from "../account-access";
import { api,errorMessage } from "../../../../lib/api";
import styles from "../account.module.css";

function SecurityPage(){const[error,setError]=useState("");const[notice,setNotice]=useState("");const[busy,setBusy]=useState(false);async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const passwordForm=event.currentTarget;const form=new FormData(passwordForm);const currentPassword=String(form.get("currentPassword"));const newPassword=String(form.get("newPassword"));setBusy(true);setError("");setNotice("");try{await api("/auth/password",{method:"POST",body:JSON.stringify({currentPassword,newPassword})});setNotice("Password updated. For your security, sign in again on other devices if needed.");passwordForm.reset()}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}return <div className={styles.subpage}><header className={styles.heading}><h1>Account security</h1></header><section className={styles.panel}><div className={styles.panelHead}><h2>Change password</h2></div><p>Use at least 12 characters.</p>{error&&<div className="inline-error">{error}</div>}{notice&&<div className="inline-success">{notice}</div>}<form className="stack-form security-form" onSubmit={submit}><label>Current password<input name="currentPassword" type="password" required autoComplete="current-password"/></label><label>New password<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label><button className="primary-button" disabled={busy}>{busy?"Updating…":"Update password"}<span>→</span></button></form></section><Link className="under-link" href="/account">← Back to account</Link></div>}

export default withAccountAccess(SecurityPage);
