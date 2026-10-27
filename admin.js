// B.F.A.I admin — frontend key only. Never put service_role keys here.
const SUPABASE_URL = "https://wumavjnrcahhnoacppdc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vSfuRFzwCAXrk93Ma-6rcg_gaTRotQs";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);
const loginPanel=$("loginPanel"), adminPanel=$("adminPanel");
const say=(id,msg,error=false)=>{const e=$(id);e.textContent=msg;e.classList.toggle("error",!!error)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let products=[];
function isAdmin(user){return user?.app_metadata?.role==="admin"}
async function showSession(){
  const {data:{session}}=await db.auth.getSession();
  if(!session){loginPanel.hidden=false;adminPanel.hidden=true;return}
  if(!isAdmin(session.user)){
    await db.auth.signOut();loginPanel.hidden=false;adminPanel.hidden=true;
    say("loginMsg","Kont sa a pa gen wòl admin. Mete app_metadata.role = admin nan Supabase Auth.",true);return;
  }
  loginPanel.hidden=true;adminPanel.hidden=false;await loadProducts();await loadPayments();
}
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();say("loginMsg","Ap konekte…");
  const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(error){say("loginMsg",error.message,true);return} await showSession();
});
$("logoutBtn").onclick=async()=>{await db.auth.signOut();await showSession()};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));
  $("productsTab").hidden=b.dataset.tab!=="products";$("paymentsTab").hidden=b.dataset.tab!=="payments";
});
function resetForm(){ $("productForm").reset();$("productId").value="";say("productMsg","");}
$("resetBtn").onclick=resetForm;
function safeSlug(s){return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
$("title").addEventListener("input",()=>{if(!$("productId").value && !$("slug").dataset.edited)$("slug").value=safeSlug($("title").value)});
$("slug").addEventListener("input",()=>{$("slug").dataset.edited="1"});
async function uploadFile(file,bucket,path){
  if(!file)return null;
  if(bucket==="bfai-pdfs" && file.type!=="application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))throw new Error("Chwazi yon fichye PDF.");
  const {error}=await db.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type||undefined});
  if(error)throw error;return path;
}
async function loadProducts(){
  const {data,error}=await db.from("products").select("*").order("created_at",{ascending:false});
  if(error){say("productMsg",error.message,true);return}
  products=data||[];const rows=$("productsRows");
  if(!products.length){rows.innerHTML='<tr><td colspan="4">Pa gen pwodwi pou kounye a.</td></tr>';return}
  rows.innerHTML=products.map(p=>`<tr><td><strong>${esc(p.title)}</strong><br><small>${esc(p.slug)}</small></td><td>${Number(p.price_htg).toLocaleString()} HTG</td><td>${p.is_active?"Vizib":"Kache"}</td><td><button data-edit="${p.id}">Modifye</button><button class="secondary" data-toggle="${p.id}">${p.is_active?"Kache":"Pibliye"}</button></td></tr>`).join("");
  rows.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));
  rows.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>toggleProduct(b.dataset.toggle));
}
function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;
 $("productId").value=p.id;$("title").value=p.title;$("slug").value=p.slug;$("slug").dataset.edited="1";$("price").value=p.price_htg;$("description").value=p.description||"";$("active").checked=!!p.is_active;
 $("productMsg").textContent="Ou ap modifye: "+p.title;window.scrollTo({top:0,behavior:"smooth"});
}
async function toggleProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const {error}=await db.from("products").update({is_active:!p.is_active}).eq("id",id);if(error){say("productMsg",error.message,true);return}await loadProducts()}
$("productForm").addEventListener("submit",async e=>{
 e.preventDefault();say("productMsg","Ap sove pwodwi a…");
 try{
  const id=$("productId").value||null, slug=$("slug").value.trim(), title=$("title").value.trim();
  if(!/^[a-z0-9-]+$/.test(slug))throw new Error("Slug la dwe gen lèt miniskil, chif oswa tirè sèlman.");
  let old=products.find(p=>p.id===id),cover_path=old?.cover_path||null,pdf_path=old?.pdf_path||null;
  const cover=$("coverFile").files[0],pdf=$("pdfFile").files[0];
  if(cover){if(!cover.type.startsWith("image/"))throw new Error("Kouvèti a dwe yon imaj.");cover_path=await uploadFile(cover,"bfai-covers",`${slug}/${Date.now()}-${cover.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`)}
  if(pdf)pdf_path=await uploadFile(pdf,"bfai-pdfs",`${slug}/${Date.now()}-${pdf.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`);
  const row={slug,title,description:$("description").value.trim(),price_htg:Number($("price").value),cover_path,pdf_path,is_active:$("active").checked};
  const result=id?await db.from("products").update(row).eq("id",id):await db.from("products").insert(row);
  if(result.error)throw result.error;
  resetForm();say("productMsg","Pwodwi a sove.");await loadProducts();
 }catch(err){say("productMsg",err.message||"Erè pandan anrejistreman.",true)}
});
async function loadPayments(){
 const body=$("paymentsRows");body.innerHTML='<tr><td colspan="6">Ap chaje…</td></tr>';
 const {data,error}=await db.from("natcash_payments").select("id,order_id,transaction_code,amount_htg,sender_phone,status,created_at,orders(customer_name,customer_whatsapp,status)").order("created_at",{ascending:false}).limit(100);
 if(error){body.innerHTML='<tr><td colspan="6">Pa kapab chaje peman yo.</td></tr>';say("paymentMsg",error.message,true);return}
 const pending=(data||[]).filter(p=>p.status==="submitted");
 if(!pending.length){body.innerHTML='<tr><td colspan="6">Pa gen peman k ap tann verifikasyon.</td></tr>';return}
 body.innerHTML=pending.map(p=>`<tr><td>${esc(new Date(p.created_at).toLocaleString())}</td><td>${esc(p.transaction_code)}</td><td>${Number(p.amount_htg).toLocaleString()} HTG</td><td>${esc(p.sender_phone||p.orders?.customer_whatsapp||"—")}</td><td>${esc(p.orders?.customer_name||"—")}<br><small>${esc(p.order_id)}</small></td><td><button data-approve="${p.id}">Valide</button><button class="secondary" data-reject="${p.id}">Refize</button></td></tr>`).join("");
 body.querySelectorAll("[data-approve]").forEach(b=>b.onclick=()=>reviewPayment(b.dataset.approve,"verified"));
 body.querySelectorAll("[data-reject]").forEach(b=>b.onclick=()=>reviewPayment(b.dataset.reject,"rejected"));
}
async function reviewPayment(id,decision){
 const msg=decision==="verified"?"Konfime ou verifye tranzaksyon NatCash sa a epi montan an kòrèk?":"Konfime ou vle refize peman sa a?";
 if(!confirm(msg))return;say("paymentMsg","Ap trete peman an…");
 const {error}=await db.rpc("bfai_admin_review_payment",{p_payment_id:id,p_decision:decision});
 if(error){say("paymentMsg",error.message,true);return}
 say("paymentMsg",decision==="verified"?"Peman valide.":"Peman refize.");await loadPayments();
}
$("refreshPayments").onclick=loadPayments;
db.auth.onAuthStateChange(()=>{setTimeout(showSession,0)});
showSession();
