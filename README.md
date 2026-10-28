# B.F.A.I — Bèl feyton an imaj

Premye vèsyòn entèfas piblik la. Li konekte ak pwòjè Supabase `bfai-site`.

## Fichye
- `index.html`: paj katalòg la, kòmann ak soumèt Txn ID MonCash.
- `styles.css`: aparans adaptatif pou telefòn ak òdinatè.
- `app.js`: chaje pwodwi aktif yo epi rele RPC Supabase yo.

## Anvan lansman
1. Ajoute pwodwi reyèl, pri yo, kouvèti yo ak chemen PDF yo nan Supabase.
2. Verifye nimewo MonCash la se nimewo ofisyèl resepsyon an (nan `index.html`).
3. Kreye epi teste yon kont administratè; pwoteje epi teste revizyon peman an.
4. Fè tès sekirite sou RPC piblik yo, ajoute limit kont spam, epi verifye tout RLS.
5. Verifye fonksyon `bfai-download-pdf` nan yon tès ak yon kòmann ki peye.
6. Pa mete okenn service-role key oswa sekrè prive nan fichye navigatè a.

## MonCash
Kliyan an voye lajan an, epi soumèt Txn ID ki sou SMS konfirmasyon an. Peman an pa konfime sèlman paske kliyan an bay yon Txn ID: sistèm nan konpare Txn ID ak montan an ak SMS MonCash la (egz: `Ou resevwa G154.00 pa MonCash de 509XXXXXXXX. Txn ID: 003576552812`).

Verifikasyon otomatik SMS la fonksyone konsa:
- Yon app ki transfè SMS yo (sou telefòn ki resevwa MonCash la) fè yon `POST` sou `https://wumavjnrcahhnoacppdc.supabase.co/functions/v1/bfai-receive-moncash-sms` ak header `x-internal-secret` (menm valyè ak sekrè `SMS_WEBHOOK_SECRET` nan Supabase) ak tekst SMS la nan jaman `message`.
- Si SMS la rive anvan oswa apre kliyan an soumèt Txn ID a, peman an pase an « verified » sèlman si Txn ID ak montan an koresponn.
- Si sa pa koresponn, peman an rete « submitted » epi yon administratè dwe verifye li nan `admin.html`.

## Pibliye
Pibliye fichye sa yo kòm sit estatik sou yon hosting tankou Cloudflare Pages. Pa itilize `service_role` nan sit piblik la.


## Administrasyon
- Fichye administrasyon an se `admin.html`; `admin.css` ak `admin.js` mache avèl.
- Li itilize Supabase Auth. Pou sekirite, kont lan dwe gen `app_metadata.role = "admin"`.
- Kreye itilizatè a nan Supabase Dashboard → Authentication → Users. Apre sa mete `role=admin` nan **app_metadata** (pa `user_metadata`), epi konekte ak kont sa a.
- Pa mete `service_role` key nan fichye sit la. Paj admin nan itilize sèlman publishable key la.
- Kouvèti yo ale nan bucket `bfai-covers`; PDF yo ale nan bucket prive `bfai-pdfs`.
- Valide MonCash sèlman apre ou verifye tranzaksyon an ak montan an.
- Fè tès anvan lansman: yon vrè peman MonCash ak telechajman PDF la poko pase nan yon tès bout-an-bout.
