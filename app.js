// B.F.A.I storefront — public key is designed for browser use; never add service-role secrets here.
const SUPABASE_URL = "https://wumavjnrcahhnoacppdc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vSfuRFzwCAXrk93Ma-6rcg_gaTRotQs";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const productsEl = document.getElementById("products");
const statusEl = document.getElementById("status");
const dialog = document.getElementById("order-dialog");
const orderForm = document.getElementById("order-form");
const paymentPanel = document.getElementById("payment-panel");
let selectedProduct = null;
let currentOrder = null;

document.getElementById("year").textContent = new Date().getFullYear();

function formatHTG(value) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(value)) + " HTG";
}
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
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
    messageEl.textContent = "Antre kòd tranzaksyon an jan li parèt sou resi a.";
    return;
  }
  button.disabled = true;
  button.textContent = "Ap soumèt…";
  try {
    const { data, error } = await db.rpc("bfai_submit_natcash_payment", {
      p_order_id: currentOrder.order_id,
      p_transaction_code: code,
      p_amount_htg: currentOrder.amount_htg,
      p_sender_phone: sender || null
    });
    if (error) throw error;
    messageEl.textContent = "Kòd la resevwa pou verifikasyon manyèl. Sa pa vle di peman an deja konfime. Tanpri kenbe resi NatCash la.";
    const message = `Bonjou B.F.A.I, mwen soumèt kòd NatCash ${code} pou kòmann ${currentOrder.order_id}. Montan: ${formatHTG(currentOrder.amount_htg)}. Tanpri verifye li.`;
    document.getElementById("whatsapp-order").href = "https://wa.me/50941319310?text=" + encodeURIComponent(message);
  } catch (err) {
    messageEl.textContent = err?.message || "Nou pa t kapab soumèt kòd la. Tanpri kontakte nou sou WhatsApp.";
  } finally {
    button.disabled = false;
    button.textContent = "Soumèt pou verifikasyon";
  }
});
loadProducts();
