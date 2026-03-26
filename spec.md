# ROCHER E-Commerce

## Current State
- Full e-commerce landing page in App.tsx (single component file, ~2800 lines)
- Products, sale settings, promo codes, payment methods all stored in localStorage
- Admin panel accessible via logo 5x click + password `rocher2024`
- Cart system with add-to-cart and Instagram-based ordering
- Product detail modals, sale banners, hero section

## Requested Changes (Diff)

### Add
- **Direct Buy button** on each product card ("Buy Now" style, opens checkout immediately with that product)
- **Checkout Modal** with:
  - Delivery address form (name, phone, address line 1, address line 2, city, state, pincode)
  - Payment method selector (from admin-configured methods)
  - Promo code input with apply button
  - Order summary (product, size, qty, price, discount if promo applied)
  - Place Order button (sends order summary to Instagram DM)
- **Backend persistence** for admin settings using Motoko canister:
  - Products list
  - Sale settings
  - Promo codes
  - Payment methods
  - Banner image URL
  - Background color
- **New banner image** set to: `/assets/uploads/rocher-banner-019d2803-de4c-7516-938d-f7ddc535d35e-1.jpg`

### Modify
- Admin panel save function: saves to backend canister instead of (or in addition to) localStorage
- Load functions: load from backend canister on startup, fall back to localStorage
- Banner constant: updated to new uploaded banner image

### Remove
- Nothing removed

## Implementation Plan
1. Generate Motoko backend with stable storage for: products, sale settings, promo codes, payment methods, banner URL, background color
2. Frontend: Add `DirectBuyButton` on product cards
3. Frontend: Add `CheckoutModal` component with address form, payment selector, promo input
4. Frontend: Wire admin save/load to backend canister
5. Frontend: Update BANNER constant to new uploaded image
