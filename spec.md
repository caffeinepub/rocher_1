# ROCHER

## Current State
Full-featured e-commerce landing page with luxury cream/gold theme (near-black background, cream text, gold accents, Playfair Display font). All features: admin panel, UPI payments, multi-method login, product sections, order management, AI search, SEO, photo gallery, activity log, etc. Single-file React app (App.tsx) with internal CSS in index.css.

## Requested Changes (Diff)

### Add
- Hero section: Large bold heading "ROCHER – FEEL THE STRENGTH", subheading "Premium Gym & Streetwear for the New Generation", CTA button "SHOP NOW"
- Trust bar: "Free Delivery Available" | "Limited Drop – Few Pieces Only" | "Premium Quality Streetwear"
- Why Rocher section with the four pillars of brand identity
- Product highlights bar: Compression Fit | Breathable Fabric | Streetwear Aesthetic | Summer Ready
- Urgency/Limited Drop section with "GET YOURS NOW" CTA
- Brand story section
- Social proof tagline section
- Discounted pricing display format: ₹999 → ₹699 (LIMITED OFFER)

### Modify
- **Complete theme overhaul**: Replace cream/gold luxury palette with Gen-Z black/white streetwear palette
  - Background: pure black (#000000)
  - Primary text: clean white (#FFFFFF)
  - Accent: sharp white or electric accent (no gold)
  - Font: Switch to bold modern sans-serif (e.g. system or Google Sans, keep Playfair only if user wants)
  - Buttons: white background, black text (inverted high-contrast)
  - Cards: dark gray (#111111 or #0a0a0a)
  - Remove gold color variables, replace with white/gray contrast
- Homepage sections reordered to match requested structure: Hero → Trust Bar → Trending Products → Why Rocher → Product Highlights → Limited Drop → Brand Story → Social Proof → Footer
- Product cards to show discounted pricing format
- Footer with Instagram link, contact, about

### Remove
- Gold/cream color variables from CSS
- Playfair Display font (replace with bold modern sans-serif)

## Implementation Plan
1. Update index.css: replace all CSS custom properties — background to #000, text to #fff, accent to white/gray, remove gold. Add new bold sans-serif font stack.
2. Update App.tsx: restructure the visible homepage sections to match the requested layout above the fold.
3. Use existing uploaded product images throughout:
   - T-shirt: /assets/uploads/rocher-tshirt-front-019d2487-1aae-72cf-be47-9d1b16657d9b-3.jpg
   - T-shirt Back: /assets/uploads/rocher-tshirt-back-019d2487-184a-74e6-8aa3-064541c0ea63-2.jpg
   - Baggy Pants: /assets/uploads/rocher-pants-019d2487-1736-7709-b86b-513acfef4591-1.jpg
   - Logo: /assets/uploads/rocher_original_logo-019d3a32-1c8a-762b-93e3-31ff13ea8fd4-1.png
   - Banner: /assets/uploads/rocher-banner-019d2803-de4c-7516-938d-f7ddc535d35e-1.jpg
4. Keep ALL existing features intact: admin panel, UPI payment, login, orders, sections, search, SEO, photo gallery, etc.
