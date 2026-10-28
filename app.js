// B.F.A.I storefront — public key is designed for browser use; never add service-role secrets here.
const SUPABASE_URL = "https://wumavjnrcahhnoacppdc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vSfuRFzwCAXrk93Ma-6rcg_gaTRotQs";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const productsEl = document.getElementById("products");
const statusEl = document.getElementById("status");
const dialog = document.getElementById("order-dialog");
const orderForm = document.getElementById("order-form");
const paymentPanel = document.getElementById("payment-panel");
const myOrdersSection = document.getElementById("my-orders");
const ordersListEl = document.getElementById("orders-list");
const ordersMessageEl = document.getElementById("orders-message");
const ORDERS_KEY = "bfai_orders";
let selectedProduct = null;
let currentOrder = null;

document.getElementById("year").textContent = new Date().getFullYear();

function formatHTG(value) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(value)) + " HTG";
}
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
}

// --- Kòmann mwen yo : commandes gardées dans ce navigateur (avec le jeton de téléchargement) ---
function loadSavedOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch (_e) {
    return [];
  }
}
function saveOrder(order) {
  try {
    const list = loadSavedOrders().filter(o => o.order_id !== order.order_id);
    list.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(0, 20)));
  } catch (_e) { /* stockage indisponible : on ignore */ }
  renderMyOrders();
}
function renderMyOrders() {
  const orders = loadSavedOrders();
  if (!orders.length) {
    myOrdersSection.classList.add("hidden");
    return;
  }
  myOrdersSection.classList.remove("hidden");
  ordersListEl.innerHTML = "";
  for (const o of orders) {
    const card = document.createElement("article");
    card.className = "product-card";
    const amount = o.amount_htg ? formatHTG(o.amount_htg) + "<br>" : "";
    card.innerHTML = `<div class="product-info"><h3>${safeText(o.title)}</h3><p>${amount}<small>Kòmann: ${safeText(o.order_id)}</small></p><div class="product-bottom"><button class="buy-button" type="button">Telechaje PDF</button></div></div>`;
    card.querySelector("button").addEventListener("click", (e) => downloadOrder(o, e.currentTarget));
    ordersListEl.appendChild(card);
  }
}
async function downloadOrder(order, button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Ap verifye…";
  ordersMessageEl.textContent = "";
  try {
    const { data, error } = await db.functions.invoke("bfai-download-pdf", {
      body: { order_id: order.order_id, download_token: order.token }
    });
    if (error) {
      const status = error?.context?.status;
      if (status === 403) throw new Error("Peman an poko verifye. Tanpri tann ekip B.F.A.I konfime li, epi eseye ankò.");
      if (status === 404) throw new Error("PDF la poko disponib oswa lyen an pa bon ankò. Kontakte nou sou WhatsApp.");
      throw new Error("Nou pa t kapab prepare telechajman an. Eseye ankò pita.");
    }
    if (!data?.download_url) throw new Error("Lyen telechajman an pa disponib. Eseye ankò.");
    window.location.href = data.download_url;
  } catch (err) {
    ordersMessageEl.textContent = err?.message || "Erè pandan telechajman an.";
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}
// Lien de récupération envoyé par l'admin : https://site/#dl=<order_id>.<token>&t=<titre>
function handleDownloadLink() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw.includes("dl=")) return;
  const params = new URLSearchParams(raw);
  const [orderId, token] = (params.get("dl") || "").split(".");
  if (!/^[0-9a-f-]{36}$/i.test(orderId || "") || !/^[0-9a-f]{64}$/i.test(token || "")) return;
  const title = (params.get("t") || "").slice(0, 160) || "Feyton mwen an";
  saveOrder({ order_id: orderId, token, title, amount_htg: null, created_at: Date.now() });
  history.replaceState(null, "", location.pathname + location.search);
  ordersMessageEl.textContent = "Kòmann ou an ajoute. Klike sou « Telechaje PDF » pou rekipere fichye a.";
  myOrdersSection.scrollIntoView({ behavior: "smooth" });
}

async function loadProducts() {
  const { data, error } = await db.from("products")
    .select("id,slug,title,description,price_htg,cover_path")
    .eq("is_active", true).order("created_at", { ascending: false });
  if (error) {
    statusEl.textContent = "Katalòg la poko disponib. Tanpri eseye ankò pita oswa ekri nou sou WhatsApp.";
    return;
  }
  statusEl.classList.add("hidden");
  productsEl.innerHTML = "";
  if (!data || data.length === 0) {
    productsEl.innerHTML = '<div class="empty-state"><strong>Nou ap prepare premye feyton yo.</strong><p>Pa gen okenn pwodwi ki pibliye pou kounye a. Retounen pita oswa kontakte nou sou WhatsApp.</p></div>';
    return;
  }
  for (const p of data) {
    let cover = '<div class="cover" aria-hidden="true">📖</div>';
    if (p.cover_path) {
      const { data: imageData } = db.storage.from("bfai-covers").getPublicUrl(p.cover_path);
      if (imageData?.publicUrl) cover = `<div class="cover"><img loading="lazy" src="${safeText(imageData.publicUrl)}" alt="Kouvèti ${safeText(p.title)}"></div>`;
    }
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `${cover}<div class="product-info"><h3>${safeText(p.title)}</h3><p>${safeText(p.description || "Dekouvri feyton sa a nan koleksyon B.F.A.I.")}</p><div class="product-bottom"><span class="price">${formatHTG(p.price_htg)}</span><button class="buy-button" type="button">Kòmande</button></div></div>`;
    card.querySelector("button").addEventListener("click", () => openOrder(p));
    productsEl.appendChild(card);
  }
}
function openOrder(product) {
  selectedProduct = product;
  currentOrder = null;
  document.getElementById("selected-title").textContent = product.title;
  document.getElementById("selected-price").textContent = formatHTG(product.price_htg);
  document.getElementById("order-message").textContent = "";
  document.getElementById("payment-message").textContent = "";
  orderForm.classList.remove("hidden");
  paymentPanel.classList.add("hidden");
  orderForm.reset();
  dialog.showModal();
}
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
document.getElementById("close-payment").addEventListener("click", () => dialog.close());

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedProduct) return;
  const button = orderForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Ap kreye kòmann…";
  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  try {
    const { data, error } = await db.rpc("bfai_create_order", {
      p_product_slug: selectedProduct.slug,
      p_customer_whatsapp: phone,
      p_customer_name: name || null
    });
    if (error) throw error;
    currentOrder = data;
    saveOrder({
      order_id: data.order_id,
      token: data.download_token,
      title: data.product_title,
      amount_htg: data.amount_htg,
      created_at: Date.now()
    });
    document.getElementById("order-summary").textContent = `${data.product_title} — ${formatHTG(data.amount_htg)}. Nimewo kòmann: ${data.order_id}`;
    const message = `Bonjou B.F.A.I, mwen kreye kòmann ${data.order_id} pou ${data.product_title}, montan ${formatHTG(data.amount_htg)}.`;
    document.getElementById("whatsapp-order").href = "https://wa.me/50941319310?text=" + encodeURIComponent(message);
    orderForm.classList.add("hidden");
    paymentPanel.classList.remove("hidden");
  } catch (err) {
    document.getElementById("order-message").textContent = err?.message || "Nou pa t kapab kreye kòmann nan. Eseye ankò.";
  } finally {
    button.disabled = false;
    button.textContent = "Kreye kòmann";
  }
});

document.getElementById("submit-payment").addEventListener("click", async () => {
  const messageEl = document.getElementById("payment-message");
  const button = document.getElementById("submit-payment");
  if (!currentOrder?.order_id) {
    messageEl.textContent = "Pa gen kòmann aktif. Tanpri rekòmanse.";
    return;
  }
  const code = document.getElementById("transaction-code").value.trim();
  const sender = document.getElementById("sender-phone").value.trim();
  if (code.length < 3) {
    messageEl.textContent = "Antre Txn ID a jan li parèt sou SMS MonCash la.";
    return;
  }
  button.disabled = true;
  button.textContent = "Ap soumèt…";
  try {
    const { data, error } = await db.rpc("bfai_submit_moncash_payment", {
      p_order_id: currentOrder.order_id,
      p_transaction_code: code,
      p_amount_htg: currentOrder.amount_htg,
      p_sender_phone: sender || null
    });
    if (error) throw error;
    if (data?.status === "verified") {
      messageEl.textContent = "Peman an verifye otomatikman! Ou ka eseye telechaje PDF la nan seksyon « Kòmann mwen yo ».";
    } else if (data?.status === "amount_mismatch") {
      messageEl.textContent = "SMS la jwenn, men montan li pa koresponn ak kòmann nan. Pa soumèt yon lòt fwa; kontakte B.F.A.I sou WhatsApp.";
    } else {
      messageEl.textContent = "Txn ID a resevwa. Sistèm nan ap tann SMS MonCash la pou verifye Txn ID a ak montan an. Kenbe SMS la; pa peye yon dezèm fwa.";
    }
    const message = `Bonjou B.F.A.I, mwen soumèt Txn ID MonCash ${code} pou kòmann ${currentOrder.order_id}. Montan: ${formatHTG(currentOrder.amount_htg)}. Tanpri verifye li.`;
    document.getElementById("whatsapp-order").href = "https://wa.me/50941319310?text=" + encodeURIComponent(message);
  } catch (err) {
    messageEl.textContent = err?.message || "Nou pa t kapab soumèt kòd la. Tanpri kontakte nou sou WhatsApp.";
  } finally {
    button.disabled = false;
    button.textContent = "Soumèt pou verifikasyon";
  }
});
renderMyOrders();
handleDownloadLink();
loadProducts();
