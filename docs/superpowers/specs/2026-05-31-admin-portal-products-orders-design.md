# Admin Portal (Products + Orders) — Design Spec

Date: 2026-05-31  
Project: Nutrient Store  
Scope: Admin UX direction B (Modern Dashboard + Workflows)

## Goals

- Deliver a professional, workflow-oriented admin portal that is fast on desktop and usable on mobile.
- Support single-vendor operations: one admin manages catalog and orders; customers buy.
- Reduce operational risk: draft products, explicit order status pipeline, and auditability via a timeline.
- Keep business logic stable: inventory is manual in Phase 1; no auto stock deduction.

## Non-Goals (Phase 1)

- Payment gateway integration and real payment reconciliation.
- Automated inventory deduction or backorder rules.
- Returns, refunds, shipment carrier integration, invoices, or tax/shipping rate engines.
- Variant pricing (sizes/flavors) or subscription plans.

## Current State (Baseline)

- Admin routes exist: `/admin`, `/admin/products`, `/admin/users`.
- Product admin CRUD exists but focuses on a small set of fields and lacks inventory/media workflows.
- There is no admin Orders UI and no dedicated order fulfillment status beyond `paymentStatus`.

## Target Information Architecture

- `/admin` — Dashboard
  - KPI cards (revenue, total orders, customers, low-stock count)
  - Recent orders list with quick status update
  - Low stock list (based on manual stock)
- `/admin/products` — Products management
  - Table list + filters + bulk actions
  - Add/edit via right-side drawer workflow (not a separate route)
- `/admin/orders` — Orders management
  - Table list + filters
  - Order detail view (shipping + items + timeline)
- `/admin/users` — Keep existing (secondary priority)
- `/admin/settings` — Placeholder only (future)

## Data Model Changes

### Product

Add the following fields:

- `status`: `"draft"` | `"active"`
  - Draft products are not visible on the storefront.
  - Active products are visible on the storefront (subject to other rules like stock visibility).
- `stock`: number (integer, min 0)
- `inStock`: boolean
  - Admin-controlled manual flag.
  - Storefront add-to-cart should be blocked if `inStock === false` (exact UX handled in implementation).
- `compareAtPrice`: optional number (min 0)
  - If present and greater than `price`, storefront renders a sale:
    - discounted price = `price`
    - original price crossed out = `compareAtPrice`
    - discount percent is derived dynamically.

Derived only (never stored):

- `discountPercent` = `round(((compareAtPrice - price) / compareAtPrice) * 100)` when valid.

Compatibility note:

- Existing `Product.status` currently uses `"draft"` | `"published"`. The new semantics should be migrated to `"draft"` | `"active"` consistently across controllers and UI, with a clear mapping:
  - `"published"` → `"active"`
  - `"draft"` → `"draft"`

### Order

Add:

- `fulfillmentStatus`: `"new"` | `"processing"` | `"shipped"` | `"delivered"` | `"cancelled"`
  - Defaults to `"new"` when an order is created.
  - Separate from `paymentStatus`.
- `shippingAddress` object
  - `fullName`
  - `phone`
  - `addressLine1`
  - `addressLine2` (optional)
  - `city`
  - `state` (optional)
  - `postalCode` (optional)
  - `country` (optional)

Add timeline:

- `timeline`: array of events:
  - `type`: `"created"` | `"status_changed"` | `"note"` (extendable)
  - `message`: string (human readable)
  - `meta`: object (optional)
  - `createdAt`: timestamp
  - `by`: user id (admin) when relevant

Timeline requirements:

- Append an `Order Created` event on creation.
- Append an event whenever fulfillment status changes, e.g. `Status → Processing`.

## Backend API Changes (Admin)

### Orders (new)

- `GET /api/admin/orders`
  - Supports filters: `fulfillmentStatus`, `search` (by user email/name/order id), `dateFrom`, `dateTo`
  - Pagination can be added if needed (recommended, but optional in Phase 1)
- `GET /api/admin/orders/:id`
  - Returns full order detail including shipping + timeline.
- `PATCH /api/admin/orders/:id/fulfillment-status`
  - Body: `{ fulfillmentStatus }`
  - Validates allowed transitions (Phase 1: allow any change among allowed statuses, but always logged to timeline)
  - Appends timeline event.

### Products (extend existing)

- `PUT /api/admin/products/:id`
  - Accept new fields: `status`, `stock`, `inStock`, `compareAtPrice`
  - Validation rules:
    - `stock` must be integer >= 0
    - `compareAtPrice` >= 0
    - If `compareAtPrice` exists, it should be >= `price` (storefront expects compare-at to represent original price)

### Bulk Sale Pricing (new)

- `POST /api/admin/products/bulk-sale/preview`
  - Body: `{ percent }`
  - Returns `{ affectedCount }` (count of products that will change)
  - “Affected” definition:
    - Products with `status === "active"` are eligible (drafts excluded by default)
    - Products with `price > 0`
- `POST /api/admin/products/bulk-sale/apply`
  - Body: `{ percent }`
  - Requires explicit UI confirmation prior to calling.
  - Behavior (as specified):
    - For each eligible product:
      - If `compareAtPrice` is empty: set `compareAtPrice = current price`
      - Set `price = round2(compareAtPrice * (1 - percent/100))`
- `POST /api/admin/products/bulk-sale/remove`
  - Requires explicit UI confirmation prior to calling.
  - Behavior:
    - For each product with a valid `compareAtPrice`:
      - Set `price = compareAtPrice`
      - Clear `compareAtPrice`

Safety and consistency:

- Bulk sale actions should be atomic per product (best-effort); failures are returned in a summary array.
- Controllers should avoid producing negative prices.
- `round2(x)` means rounding to 2 decimal places.

## Storefront Behavior

- Draft products are not shown in product listing and are not accessible via public product pages.
- Sale pricing display:
  - If `compareAtPrice` is missing or `compareAtPrice <= price`, show only `price`.
  - If enabled (`compareAtPrice > price`), show:
    - `price` prominently
    - `compareAtPrice` crossed out
    - derived discount percentage
- Inventory:
  - If `inStock === false`, product shows “Out of stock” and disables purchase.
  - `stock` is an informational/operational field for admin in Phase 1 (no auto-deduction).

## Admin UX Details

### Dashboard

- KPI cards: Total Revenue, Total Orders, Total Customers, Low Stock (count)
- Recent Orders:
  - Displays: created time, customer, total, fulfillmentStatus, paymentStatus
  - Quick action: change fulfillment status
- Low Stock:
  - Displays top N products sorted by stock ascending where `inStock === true`

### Products Page

List:

- Filters: status (draft/active), inStock, category
- Search: title, category, tags
- Bulk actions:
  - Apply X% sale to all (with preview + confirmation)
  - Remove sale from all (with preview + confirmation)

Editor (drawer):

- Basics: title, description, category, tags, brandName
- Media: coverImage + gallery management (use existing upload capability)
- Pricing: price, compareAtPrice (optional)
- Inventory: inStock toggle + stock number
- Visibility: draft/active, featured toggle

### Orders Page

List:

- Filters: fulfillmentStatus, paymentStatus, date range
- Search: order id, customer name/email

Detail:

- Shipping address block
- Items list
- Status control
- Timeline stream (reverse chronological) with status change events

## Validation & Error Handling

- Server-side validation for new enums and numeric fields.
- Admin UI should show:
  - inline field errors for product editor
  - confirmation modals for destructive/bulk actions
  - toast/snackbar feedback for success/failure

## Testing Strategy (Phase 1)

- Backend:
  - Unit tests for bulk sale apply/remove calculations and validation.
  - Unit tests for order status update creating timeline events.
- Frontend:
  - Smoke test flows:
    - Create draft product → edit → publish (active) → verify visible in storefront
    - Apply sale X% to all → verify UI shows compare-at + discount
    - Remove sale → verify restoration
    - Change order status → verify timeline entry appears

## Open Questions (Resolved)

- Inventory mode: manual stock + inStock (no auto deduction) — confirmed.
- Sale percentage: apply by lowering price by X% and storing original in compareAtPrice — confirmed.
