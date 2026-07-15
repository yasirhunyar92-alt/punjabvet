
# Phase 1 Upgrade Plan — Punjab Veterinary

Focused scope: payments rework, checkout with proof upload, new realistic hero image, expanded navigation, and an in-app notification system. Other requested items (product page zoom/gallery, smart search, blog SEO polish, wishlist widgets, social manager, admin analytics, etc.) are deferred to later phases.

---

## 1. Payments — remove COD, require advance payment

**Checkout flow changes**
- Remove any Cash on Delivery option from Checkout UI and backend.
- Add a "Payment Method" step with two options:
  - **JazzCash** — Account Title: Qaisar HUSSAIN, Mobile: 03065757283
  - **Bank Transfer (UBL)** — Title: Punjab Veterinary Medical Store, Acct: 1300351503696
- Selecting a method reveals the account details in a clean card with a Copy button.
- Required fields before "Place Order" is enabled:
  - Payment method (radio)
  - Transaction ID / Reference Number (text, validated non-empty, 4–64 chars)
  - Payment screenshot (image upload; ≤ 5 MB; jpg/png/webp)
- On submit, order is created with `status = 'pending_verification'`, `payment_method`, `payment_reference`, `payment_proof_path`.
- Success screen shows: *"Thank you for your payment. Your payment is under verification. Once verified, your order will be processed and shipped."*
- Global banner on cart/checkout: *"Cash on Delivery is not available. All orders require 100% advance payment."*

**Data model**
- Extend `orders`:
  - `payment_method` text (`jazzcash` | `bank_transfer`)
  - `payment_reference` text
  - `payment_proof_path` text (storage path in private bucket)
  - Widen `status` allowed values: `pending_verification`, `paid`, `packed`, `shipped`, `delivered`, `rejected`. (Kept as text for minimal disruption; existing `pending` orders remain valid but no new orders use it.)

**Storage (private bucket)**
- Create bucket `payment-proofs` (public = false) via `storage_create_bucket`.
- RLS on `storage.objects` for that bucket:
  - Authenticated user can INSERT into own folder `{auth.uid()}/…`.
  - Owner can SELECT own objects.
  - Admin (`has_role(auth.uid(),'admin')`) can SELECT all.
- Client uploads to `payment-proofs/{user_id}/{order_id}-{timestamp}.{ext}` and stores the path (not a public URL) on the order.
- Admin views proof via short-lived signed URL created on demand.

**Admin panel — Orders**
- Status dropdown updated to the new set.
- New column/section: Payment method, reference, "View proof" button (fetches signed URL).
- Filter by `pending_verification` at top by default.

---

## 2. Navigation

Update `Header.tsx` desktop + mobile nav to:
- Home
- Shop (→ `/products`)
- Shop by Animal (dropdown: Cow, Buffalo, Goat, Sheep, Poultry, Pets, Horse → `/products?animal=<slug>`)
- Categories (dropdown from `categories` table)
- Offers (`/products?offers=1`)
- Blog
- About
- Contact
- My Account (`/profile`)
- Order Tracking (`/profile?tab=orders`)

Notes:
- "Shop by Animal" needs a filter param on `/products`. If products don't yet have an `animal` field, filtering will match on category/tags for now; a proper `animal_type` column can be added in a later phase (called out here so we don't silently pretend it filters).
- Nav uses Radix NavigationMenu with hover/click dropdowns and stays mobile-friendly (accordion in the drawer).

---

## 3. Premium hero image

- Generate one photoreal composite (1600×900) via the agent's `generate_image` tool with `premium` quality.
- Subject brief: healthy cow, buffalo, goat, sheep, poultry, a dog/cat, a professional veterinarian in a white coat with a stethoscope examining an animal, a foreground shelf/tray of veterinary medicine bottles and vaccine vials, clean modern farm background, bright natural daylight, shallow depth of field. No text, no cartoon style.
- Save to `src/assets/hero-vet.jpg`, import into `Index.tsx`.
- Existing "hero_banner" `site_images` slot remains as an admin override; if the DB value is empty the new generated asset is the fallback.
- Add `<link rel="preload" as="image">` for the hero in `index.html` for LCP.

---

## 4. In-app notification system (Phase 1: bell + admin sender)

**Table `notifications`**
- Fields: `user_id` (nullable — null = broadcast), `title`, `body`, `type` (`order_status` | `promo` | `new_product` | `restock` | `discount` | `system`), `link` (optional route), `read_at`, `created_at`.
- RLS: user reads own + broadcast rows; admin inserts any; user updates `read_at` on own rows.
- Table `notification_preferences` (`user_id`, `order_updates` bool, `promotions` bool, `new_products` bool) — user-managed.

**UI**
- Bell icon in `Header` (auth-gated) with unread badge; dropdown lists last 20, "Mark all read", link to `/profile?tab=notifications`.
- Profile tab: full list + preferences toggle.
- Admin panel: new "Notifications" section — compose title/body/type/link, target = All customers / Specific user (email lookup); shows recent sent history.

**Auto-notifications wired in Phase 1**
- Order status change (admin update on `orders` → trigger inserts notification for `orders.user_id`).
- New product created (admin insert on `products` → trigger inserts broadcast notification, respecting user prefs at read-time filter).
- Discount / back-in-stock hooks are stubbed with the same trigger pattern but only fire when the admin flips `sale_price` or moves `stock_qty` from 0 → >0.

Email/SMS/WhatsApp channels are **not** implemented in this phase — the schema and admin UI are ready for them.

---

## 5. Out of scope for this plan (Phase 2+)

Called out so expectations are clear:
- Product-page image zoom & gallery upgrade, related products, "Buy Again", FBT.
- Smart instant-search with suggestions by disease/animal/brand.
- Homepage sections: Best Sellers, New Arrivals, Top Brands, Veterinary Tips, Newsletter (some already partially exist).
- Social Media Manager admin page + auto-injecting links.
- Blog SEO auto-generation, sitemap regeneration hooks.
- Sales analytics dashboard, best-seller reports.
- Verified-buyer-only review enforcement (currently reviews table exists; verification rule to be added).
- Email/SMS/WhatsApp notification delivery.

---

## Technical notes

**Files touched**
- `src/pages/Checkout.tsx` — payment method UI, proof upload, validation, submit.
- `src/pages/Cart.tsx` — advance-payment notice banner.
- `src/pages/Profile.tsx` — new "Notifications" tab, order status labels updated.
- `src/components/Header.tsx` — new nav (desktop dropdowns via NavigationMenu, mobile accordion), notification bell.
- `src/components/NotificationBell.tsx` (new).
- `src/pages/Admin.tsx` + `src/components/admin/OrdersManagement.tsx` (new or extended in ProductsManagement neighbor) — payment proof viewer, new statuses.
- `src/components/admin/NotificationsManagement.tsx` (new).
- `src/pages/Index.tsx` + `src/assets/hero-vet.jpg` + `index.html` preload.
- `src/pages/Products.tsx` — accept `animal` and `offers` query params.

**Migrations (single migration file)**
- `ALTER TABLE orders` add columns above.
- `CREATE TABLE notifications` + GRANTs + RLS + policies + updated_at trigger.
- `CREATE TABLE notification_preferences` + GRANTs + RLS.
- Triggers on `orders` (AFTER UPDATE OF status) and `products` (AFTER INSERT, AFTER UPDATE OF sale_price, stock_qty) to insert notifications.
- Storage RLS policies for `payment-proofs` bucket.

**Bucket creation** via `storage_create_bucket` tool (private).

**Validation**: Zod schemas on checkout form and admin notification composer.

**Performance**: preload hero, lazy-load admin bundles, keep react-query cache times reasonable. No routing/architecture rewrite in this phase.

---

Approve to start with the migration + bucket creation, then UI in order: Checkout → Header/Nav → Hero → Notifications → Admin.
