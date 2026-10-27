# B.F.A.I — Bèl feyton an imaj

Premye vèsyon entèfas piblik la. Li konekte ak pwojè Supabase `bfai-site`.

## Fichye
- `index.html`: paj katalòg la, kòmann ak soumèt kòd NatCash.
- `styles.css`: aparans adaptatif pou telefòn ak òdinatè.
- `app.js`: chaje pwodwi aktif yo epi rele RPC Supabase yo.

## Anvan lansman
1. Ajoute pwodwi reyèl, pri yo, kouvèti yo ak chemen PDF yo nan Supabase.
2. Verifye nimewo NatCash la se nimewo ofisyèl resepsyon an.
3. Kreye epi teste yon kont administratè; pwoteje epi teste revizyon peman an.
4. Fè tès sekirite sou RPC piblik yo, ajoute limit kont spam, epi verifye tout RLS.
5. Verifye fonksyon `bfai-download-pdf` nan yon tès ak yon kòmann ki peye.
6. Pa mete okenn service-role key oswa sekrè prive nan fichye navigatè a.

## NatCash
Soumèt kòd tranzaksyon an pa konfime peman an. Yon administratè dwe konpare li ak resi/istorik NatCash la epi verifye li anvan livrezon.

## Pibliye
Pibliye fichye sa yo kòm sit estatik sou yon hosting tankou Cloudflare Pages. Pa itilize `service_role` nan sit piblik la.


## Administrasyon
- Fichye administrasyon an se `admin.html`; `admin.css` ak `admin.js` mache avè l.
- Li itilize Supabase Auth. Pou sekirite, kont lan dwe gen `app_metadata.role = "admin"`.
- Kreye itilizatè a nan Supabase Dashboard → Authentication → Users. Apre sa mete `role=admin` nan **app_metadata** (pa `user_metadata`), epi konekte ak kont sa a.
- Pa mete `service_role` key nan fichye sit la. Paj admin nan itilize sèlman publishable key la.
- Kouvèti yo ale nan bucket `bfai-covers`; PDF yo ale nan bucket prive `bfai-pdfs`.
- Valide NatCash sèlman apre ou verifye tranzaksyon an ak montan an. Pa gen verifikasyon SMS otomatik ki konfigire.
- Fè tès anvan lansman. Peman ak download yo poko pase nan yon tès bout-an-bout.
