import { Toaster } from "@/components/ui/sonner";
import {
  Check,
  ChevronDown,
  CreditCard,
  Image,
  Instagram,
  Lock,
  LogOut,
  Menu,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const LOGO =
  "/assets/uploads/rocher_2_logo-019d2487-1d4d-76d8-902f-54fb04dc6ff6-5.png";
const BANNER =
  "/assets/uploads/rocher-banner-019d2803-de4c-7516-938d-f7ddc535d35e-1.jpg";
const INSTAGRAM_URL = "https://www.instagram.com/official_rocher";
const SIZES = ["S", "M", "L", "XL"];
const ADMIN_PASSWORD = "rocher2024";
const LS_KEY = "rocher_admin_data";
const LS_SALE_KEY = "rocher_sale_settings";
const LS_PROMO_KEY = "rocher_promo_codes";
const LS_PAYMENT_KEY = "rocher_payment_methods";
const LS_BANNER_KEY = "rocher_custom_banner";
const LS_BG_KEY = "rocher_custom_bg";

const SIZE_GUIDE = [
  { size: "S", chest: '36"', waist: '30"', length: '27"' },
  { size: "M", chest: '38"', waist: '32"', length: '28"' },
  { size: "L", chest: '40"', waist: '34"', length: '29"' },
  { size: "XL", chest: '42"', waist: '36"', length: '30"' },
];

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  stock: number;
  bestSeller: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  size: string;
  qty: number;
  image: string;
}

interface SaleSettings {
  enabled: boolean;
  discount: number;
  label: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  enabled: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  details: string;
  enabled: boolean;
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "tshirt",
    name: "ROCHER T-Shirt",
    price: 250,
    images: [
      "/assets/uploads/rocher-tshirt-front-019d2487-1aae-72cf-be47-9d1b16657d9b-3.jpg",
      "/assets/uploads/rocher-tshirt-back-019d2487-184a-74e6-8aa3-064541c0ea63-2.jpg",
    ],
    description: "Premium heavyweight cotton. Oversized fit.",
    stock: 8,
    bestSeller: true,
  },
  {
    id: "pants",
    name: "ROCHER Baggy Pants",
    price: 550,
    images: [
      "/assets/uploads/rocher-pants-019d2487-1736-7709-b86b-513acfef4591-1.jpg",
    ],
    description: "Wide-leg silhouette. Streetwear ready.",
    stock: 3,
    bestSeller: false,
  },
];

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_PRODUCTS;
    const data = JSON.parse(raw) as {
      products: Partial<Product>[];
      customProducts?: Product[];
    };
    if (!Array.isArray(data.products)) return DEFAULT_PRODUCTS;

    // Deleted default IDs
    const deletedIds = (data as any).deletedDefaultIds as string[] | undefined;

    const merged = DEFAULT_PRODUCTS.filter(
      (d) => !deletedIds?.includes(d.id),
    ).map((def) => {
      const saved = data.products.find((p) => p.id === def.id);
      if (!saved) return def;
      return {
        ...def,
        name: saved.name ?? def.name,
        price: saved.price ?? def.price,
        description: saved.description ?? def.description,
        stock: saved.stock ?? def.stock,
        bestSeller: saved.bestSeller ?? def.bestSeller,
      };
    });

    const custom: Product[] = Array.isArray(data.customProducts)
      ? data.customProducts
      : [];

    return [...merged, ...custom];
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

function loadSaleSettings(): SaleSettings {
  try {
    const raw = localStorage.getItem(LS_SALE_KEY);
    if (!raw) return { enabled: false, discount: 20, label: "SALE" };
    return JSON.parse(raw) as SaleSettings;
  } catch {
    return { enabled: false, discount: 20, label: "SALE" };
  }
}

function loadPromoCodes(): PromoCode[] {
  try {
    const raw = localStorage.getItem(LS_PROMO_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PromoCode[];
  } catch {
    return [];
  }
}

function loadPaymentMethods(): PaymentMethod[] {
  try {
    const raw = localStorage.getItem(LS_PAYMENT_KEY);
    if (!raw)
      return [
        {
          id: "cod",
          type: "cod",
          label: "Cash on Delivery",
          details: "Pay when you receive your order",
          enabled: true,
        },
      ];
    return JSON.parse(raw) as PaymentMethod[];
  } catch {
    return [
      {
        id: "cod",
        type: "cod",
        label: "Cash on Delivery",
        details: "Pay when you receive your order",
        enabled: true,
      },
    ];
  }
}

function loadCustomBanner(): string {
  try {
    return localStorage.getItem(LS_BANNER_KEY) || "";
  } catch {
    return "";
  }
}

function loadCustomBg(): string {
  try {
    return localStorage.getItem(LS_BG_KEY) || "";
  } catch {
    return "";
  }
}

function salePrice(price: number, discount: number): number {
  return Math.round(price * (1 - discount / 100));
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function ImageFallback({
  src,
  alt,
  className,
}: { src: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  return err ? (
    <div
      className={`flex items-center justify-center bg-muted ${className ?? ""}`}
    >
      <span className="font-display text-2xl font-bold tracking-widest text-brand-gold uppercase opacity-30">
        ROCHER
      </span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErr(true)}
    />
  );
}

/* ─── CHECKOUT ITEM ─── */
interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size: string;
  qty: number;
}

/* ─── PRODUCT DETAIL MODAL ─── */
function ProductModal({
  product,
  sale,
  onClose,
  onAddToCart,
  onDirectBuy,
}: {
  product: Product;
  sale: SaleSettings;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onDirectBuy?: (item: CheckoutItem) => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);

  const discountedPrice = sale.enabled
    ? salePrice(product.price, sale.discount)
    : null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleAdd = () => {
    if (!size) {
      setSizeError(true);
      toast.error("Please select a size");
      return;
    }
    setSizeError(false);
    onAddToCart({
      id: `${product.id}-${size}`,
      name: product.name,
      price: discountedPrice ?? product.price,
      size,
      qty: 1,
      image: product.images[0],
    });
    toast.success(`${product.name} (${size}) added to cart!`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="product.modal"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onKeyDown={(e) => e.key === "Enter" && onClose()}
      />
      <div className="relative z-10 bg-card rounded-xl overflow-hidden w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
        <button
          type="button"
          onClick={onClose}
          data-ocid="product.close_button"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:text-brand-gold transition-colors"
        >
          <X size={18} />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Image side */}
          <div className="relative bg-muted" style={{ minHeight: "420px" }}>
            {product.bestSeller && (
              <div className="best-seller-ribbon">★ Best Seller</div>
            )}
            {sale.enabled && (
              <div
                className="best-seller-ribbon"
                style={{
                  background: "oklch(0.45 0.2 25)",
                  top: product.bestSeller ? "48px" : "12px",
                }}
              >
                🔥 -{sale.discount}%
              </div>
            )}
            <ImageFallback
              src={product.images[imgIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {["Front", "Back"].map((label, i) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => setImgIndex(i)}
                    data-ocid="product.toggle"
                    className={`px-4 py-1.5 text-xs font-display tracking-wider rounded-full border transition-all ${
                      imgIndex === i
                        ? "btn-gold border-transparent"
                        : "btn-outline-gold"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details side */}
          <div className="p-7 flex flex-col gap-5">
            <div>
              {product.bestSeller && (
                <span className="inline-flex items-center gap-1 text-brand-gold text-xs font-bold uppercase tracking-widest mb-2">
                  ★ Best Seller
                </span>
              )}
              <h2 className="font-display text-3xl font-bold text-foreground leading-tight mb-1">
                {product.name}
              </h2>
              {sale.enabled && discountedPrice ? (
                <div className="flex items-baseline gap-3">
                  <p className="font-display text-2xl font-bold text-brand-gold">
                    ₹{discountedPrice}
                  </p>
                  <p className="font-display text-lg line-through text-muted-foreground">
                    ₹{product.price}
                  </p>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      background: "oklch(0.45 0.2 25)",
                      color: "white",
                    }}
                  >
                    -{sale.discount}%
                  </span>
                </div>
              ) : (
                <p className="font-display text-2xl font-bold text-brand-gold">
                  ₹{product.price}
                </p>
              )}
            </div>

            {product.stock <= 5 && (
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "oklch(0.78 0.15 60)" }}
              >
                ⚡ Only {product.stock} left in stock
              </div>
            )}

            <div className="gold-divider" />

            <p className="text-muted-foreground text-sm leading-relaxed">
              {product.description}
            </p>
            <p className="text-xs text-muted-foreground italic">
              100% Premium Cotton — Machine wash cold
            </p>

            {/* Size guide */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-2">
                Size Guide
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {["Size", "Chest", "Waist", "Length"].map((h) => (
                        <th
                          key={h}
                          className="py-1.5 px-2 font-bold text-muted-foreground uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_GUIDE.map((row) => (
                      <tr
                        key={row.size}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-1.5 px-2 font-bold text-brand-gold">
                          {row.size}
                        </td>
                        <td className="py-1.5 px-2 text-foreground/80">
                          {row.chest}
                        </td>
                        <td className="py-1.5 px-2 text-foreground/80">
                          {row.waist}
                        </td>
                        <td className="py-1.5 px-2 text-foreground/80">
                          {row.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Size selector */}
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-2 ${sizeError ? "text-destructive" : "text-muted-foreground"}`}
                data-ocid="product.error_state"
              >
                {sizeError ? "Please select a size" : "Select Size"}
              </p>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setSizeError(false);
                    }}
                    data-ocid="product.toggle"
                    className={`w-11 h-11 text-sm font-display font-bold rounded border transition-all ${size === s ? "btn-gold border-transparent" : "btn-outline-gold"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <button
                type="button"
                onClick={handleAdd}
                data-ocid="product.primary_button"
                className="w-full py-3.5 font-display font-bold text-sm tracking-widest uppercase btn-gold rounded-lg shadow-gold-glow"
              >
                Add to Cart
              </button>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="product.secondary_button"
                className="w-full py-3.5 font-display font-bold text-sm tracking-widest uppercase btn-outline-gold rounded-lg text-center block"
              >
                Order via Instagram
              </a>
              {onDirectBuy && (
                <button
                  type="button"
                  data-ocid="product.primary_button"
                  onClick={() => {
                    if (!size) {
                      setSizeError(true);
                      toast.error("Please select a size first");
                      return;
                    }
                    onDirectBuy({
                      id: `${product.id}-${size}`,
                      name: product.name,
                      price: discountedPrice ?? product.price,
                      image: product.images[0],
                      size,
                      qty: 1,
                    });
                    onClose();
                  }}
                  className="w-full py-3.5 font-display font-bold text-sm tracking-widest uppercase rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)",
                    color: "#0a0a0a",
                  }}
                >
                  ⚡ Direct Buy
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CHECKOUT MODAL ─── */
function CheckoutModal({
  item,
  onClose,
  promoCodes,
  paymentMethods,
}: {
  item: CheckoutItem | null;
  onClose: () => void;
  promoCodes: PromoCode[];
  paymentMethods: PaymentMethod[];
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const enabledPayments = paymentMethods.filter((pm) => pm.enabled);
  const [selectedPayment, setSelectedPayment] = useState<string>(
    () => enabledPayments[0]?.id || "",
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!item) return null;

  const discount = appliedPromo ? appliedPromo.discount : 0;
  const finalPrice = Math.round(item.price * item.qty * (1 - discount / 100));

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const found = promoCodes.find((p) => p.code === code && p.enabled);
    if (found) {
      setAppliedPromo(found);
      setPromoError("");
      toast.success(`Promo applied! ${found.discount}% off`);
    } else {
      setAppliedPromo(null);
      setPromoError("Invalid or expired promo code");
    }
  };

  const handlePlaceOrder = () => {
    if (
      !form.name ||
      !form.phone ||
      !form.address1 ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      toast.error("Please fill in all required address fields");
      return;
    }
    const paymentLabel =
      enabledPayments.find((p) => p.id === selectedPayment)?.label ||
      selectedPayment;
    const msg = encodeURIComponent(
      `🛍️ ORDER REQUEST\n\nProduct: ${item.name}\nSize: ${item.size}\nQty: ${item.qty}\nPrice: ₹${finalPrice}${appliedPromo ? ` (Promo: ${appliedPromo.code} -${appliedPromo.discount}%)` : ""}\n\nDelivery Address:\n${form.name}\n${form.phone}\n${form.address1}${form.address2 ? `, ${form.address2}` : ""}\n${form.city}, ${form.state} - ${form.pincode}\n\nPayment: ${paymentLabel}`,
    );
    window.open(
      `https://www.instagram.com/official_rocher?text=${msg}`,
      "_blank",
    );
    toast.success("Redirecting to Instagram DM to confirm order!");
    onClose();
  };

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm font-display placeholder-muted-foreground focus:outline-none focus:border-brand-gold transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="checkout.modal"
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onKeyDown={(e) => e.key === "Enter" && onClose()}
      />
      <div className="relative z-10 bg-card rounded-xl overflow-hidden w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up border border-brand-gold/30">
        <button
          type="button"
          onClick={onClose}
          data-ocid="checkout.close_button"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:text-brand-gold transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-7">
          <h2 className="font-display text-2xl font-bold text-brand-gold mb-1 tracking-wide">
            Checkout
          </h2>
          <div className="gold-divider mb-5" />

          {/* Order Summary */}
          <div className="bg-background/60 rounded-lg p-4 flex gap-4 items-center mb-6 border border-border">
            <img
              src={item.image}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg border border-border"
            />
            <div className="flex-1">
              <p className="font-display font-bold text-foreground text-base">
                {item.name}
              </p>
              <p className="text-muted-foreground text-sm">
                Size: {item.size} · Qty: {item.qty}
              </p>
              <p className="text-brand-gold font-bold font-display text-lg mt-1">
                ₹{item.price * item.qty}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
            Delivery Address
          </p>
          <div className="flex flex-col gap-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputClass}
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                data-ocid="checkout.input"
              />
              <input
                className={inputClass}
                placeholder="Phone Number *"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                data-ocid="checkout.input"
              />
            </div>
            <input
              className={inputClass}
              placeholder="Address Line 1 *"
              value={form.address1}
              onChange={(e) =>
                setForm((f) => ({ ...f, address1: e.target.value }))
              }
              data-ocid="checkout.input"
            />
            <input
              className={inputClass}
              placeholder="Address Line 2 (optional)"
              value={form.address2}
              onChange={(e) =>
                setForm((f) => ({ ...f, address2: e.target.value }))
              }
              data-ocid="checkout.input"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                className={inputClass}
                placeholder="City *"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                data-ocid="checkout.input"
              />
              <input
                className={inputClass}
                placeholder="State *"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
                data-ocid="checkout.input"
              />
              <input
                className={inputClass}
                placeholder="Pincode *"
                value={form.pincode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pincode: e.target.value }))
                }
                data-ocid="checkout.input"
              />
            </div>
          </div>

          {/* Promo Code */}
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
            Promo Code
          </p>
          <div className="flex gap-2 mb-5">
            <input
              className={inputClass}
              placeholder="Enter promo code"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value);
                setPromoError("");
              }}
              data-ocid="checkout.input"
            />
            <button
              type="button"
              onClick={applyPromo}
              data-ocid="checkout.secondary_button"
              className="px-5 py-3 font-display font-bold text-sm uppercase tracking-widest btn-gold rounded-lg whitespace-nowrap"
            >
              Apply
            </button>
          </div>
          {promoError && (
            <p
              className="text-destructive text-xs mb-3"
              data-ocid="checkout.error_state"
            >
              {promoError}
            </p>
          )}
          {appliedPromo && (
            <p
              className="text-green-400 text-xs mb-3"
              data-ocid="checkout.success_state"
            >
              ✓ {appliedPromo.code} applied — {appliedPromo.discount}% off
            </p>
          )}

          {/* Payment Method */}
          {enabledPayments.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
                Payment Method
              </p>
              <div className="flex flex-col gap-2 mb-5">
                {enabledPayments.map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPayment === pm.id ? "border-brand-gold bg-brand-gold/10" : "border-border"}`}
                    data-ocid="checkout.radio"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={pm.id}
                      checked={selectedPayment === pm.id}
                      onChange={() => setSelectedPayment(pm.id)}
                      className="accent-brand-gold"
                    />
                    <span className="font-display text-sm text-foreground">
                      {pm.label}
                    </span>
                    {pm.details && (
                      <span className="text-muted-foreground text-xs ml-auto">
                        {pm.details}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Order Total */}
          <div className="bg-background/60 rounded-lg p-4 border border-border mb-5">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>
                Subtotal ({item.qty} item{item.qty > 1 ? "s" : ""})
              </span>
              <span>₹{item.price * item.qty}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-sm text-green-400 mb-1">
                <span>Promo ({appliedPromo.code})</span>
                <span>-{appliedPromo.discount}%</span>
              </div>
            )}
            <div className="gold-divider my-2" />
            <div className="flex justify-between font-display font-bold text-brand-gold text-lg">
              <span>Total</span>
              <span>₹{finalPrice}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            data-ocid="checkout.submit_button"
            className="w-full py-4 font-display font-bold text-base uppercase tracking-widest btn-gold rounded-lg shadow-gold-glow"
          >
            Place Order via Instagram
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ADMIN LOGIN ─── */
function AdminLoginModal({
  onSuccess,
  onClose,
}: { onSuccess: () => void; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setErr(true);
      setPw("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="admin.modal"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onKeyDown={(e) => e.key === "Enter" && onClose()}
      />
      <div className="relative z-10 bg-card border border-border rounded-xl p-8 w-full max-w-sm shadow-2xl animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck size={22} className="text-brand-gold" />
          <h2 className="font-display text-xl font-bold text-foreground">
            Admin Access
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="admin-pw"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
            >
              Password
            </label>
            <input
              id="admin-pw"
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErr(false);
              }}
              data-ocid="admin.input"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
              placeholder="Enter admin password"
            />
            {err && (
              <p
                className="text-xs text-destructive mt-1"
                data-ocid="admin.error_state"
              >
                Incorrect password
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              data-ocid="admin.submit_button"
              className="flex-1 py-2.5 btn-gold font-display font-bold text-sm rounded-lg flex items-center justify-center gap-2"
            >
              <Lock size={14} /> Enter
            </button>
            <button
              type="button"
              onClick={onClose}
              data-ocid="admin.cancel_button"
              className="flex-1 py-2.5 btn-outline-gold font-display font-bold text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── IMAGE URL PREVIEW ─── */
function ImageUrlField({
  value,
  onChange,
  onRemove,
  showRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const [valid, setValid] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {valid && value ? (
        <img
          src={value}
          alt="preview"
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-brand-gold/30"
          onError={() => setValid(false)}
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border">
          <span className="text-muted-foreground text-xs">IMG</span>
        </div>
      )}
      <input
        type="url"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setValid(false);
        }}
        onBlur={() => setValid(!!value)}
        placeholder="https://... image URL"
        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
      />
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ─── ADMIN PANEL ─── */
interface AdminProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  bestSeller: boolean;
  images: string[];
}

interface NewProductDraft {
  name: string;
  price: string;
  description: string;
  stock: string;
  bestSeller: boolean;
  imageUrls: string[];
}

const EMPTY_DRAFT: NewProductDraft = {
  name: "",
  price: "",
  description: "",
  stock: "",
  bestSeller: false,
  imageUrls: [""],
};

function AdminPanel({
  products,
  saleSettings,
  promoCodes: initialPromos,
  paymentMethods: initialPayments,
  customBanner: initialBanner,
  customBg: initialBg,
  onClose,
}: {
  products: Product[];
  saleSettings: SaleSettings;
  promoCodes: PromoCode[];
  paymentMethods: PaymentMethod[];
  customBanner: string;
  customBg: string;
  onClose: (
    updated?: Product[],
    newSale?: SaleSettings,
    newPromos?: PromoCode[],
    newPayments?: PaymentMethod[],
    newBanner?: string,
    newBg?: string,
  ) => void;
}) {
  const [editData, setEditData] = useState<AdminProduct[]>(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      stock: p.stock,
      bestSeller: p.bestSeller,
      images: p.images,
    })),
  );

  const [sale, setSale] = useState<SaleSettings>(saleSettings);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<NewProductDraft>(EMPTY_DRAFT);
  const [draftError, setDraftError] = useState("");
  const [promos, setPromos] = useState<PromoCode[]>(initialPromos);
  const [payments, setPayments] = useState<PaymentMethod[]>(initialPayments);
  const [bannerPreview, setBannerPreview] = useState<string>(initialBanner);
  const [bgColor, setBgColor] = useState<string>(initialBg || "#0c0b09");
  const [promoAddOpen, setPromoAddOpen] = useState(false);
  const [paymentAddOpen, setPaymentAddOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState(10);
  const [newPromoEnabled, setNewPromoEnabled] = useState(true);
  const [newPromoError, setNewPromoError] = useState("");
  const [newPayLabel, setNewPayLabel] = useState("");
  const [newPayType, setNewPayType] = useState("upi");
  const [newPayDetails, setNewPayDetails] = useState("");
  const [newPayEnabled, setNewPayEnabled] = useState(true);
  const [newPayError, setNewPayError] = useState("");

  const update = (
    id: string,
    field: keyof AdminProduct,
    value: string | number | boolean | string[],
  ) => {
    setEditData((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const deleteProduct = (id: string) => {
    setEditData((prev) => prev.filter((p) => p.id !== id));
  };

  const addImageUrl = () =>
    setDraft((d) => ({ ...d, imageUrls: [...d.imageUrls, ""] }));

  const updateImageUrl = (idx: number, val: string) =>
    setDraft((d) => {
      const urls = [...d.imageUrls];
      urls[idx] = val;
      return { ...d, imageUrls: urls };
    });

  const removeImageUrl = (idx: number) =>
    setDraft((d) => ({
      ...d,
      imageUrls: d.imageUrls.filter((_, i) => i !== idx),
    }));

  const handleAddProduct = () => {
    if (!draft.name.trim()) {
      setDraftError("Product name is required.");
      return;
    }
    if (!draft.price || Number(draft.price) <= 0) {
      setDraftError("Enter a valid price.");
      return;
    }
    setDraftError("");
    const newProd: AdminProduct = {
      id: Date.now().toString(),
      name: draft.name.trim(),
      price: Number(draft.price),
      description: draft.description.trim(),
      stock: Number(draft.stock) || 10,
      bestSeller: draft.bestSeller,
      images: draft.imageUrls.filter((u) => u.trim()),
    };
    setEditData((prev) => [...prev, newProd]);
    setDraft(EMPTY_DRAFT);
    setAddOpen(false);
    toast.success(`"${newProd.name}" added! Remember to Save Changes.`);
  };

  const handleSave = () => {
    // Figure out which default IDs were deleted
    const defaultIds = DEFAULT_PRODUCTS.map((d) => d.id);
    const remainingIds = editData.map((e) => e.id);
    const deletedDefaultIds = defaultIds.filter(
      (id) => !remainingIds.includes(id),
    );

    const defaultEdits = editData.filter((e) => defaultIds.includes(e.id));
    const customProducts: Product[] = editData
      .filter((e) => !defaultIds.includes(e.id))
      .map((e) => ({
        id: e.id,
        name: e.name,
        price: e.price,
        images: e.images,
        description: e.description,
        stock: e.stock,
        bestSeller: e.bestSeller,
      }));

    const saveData = {
      products: defaultEdits,
      customProducts,
      deletedDefaultIds,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(saveData));
    localStorage.setItem(LS_SALE_KEY, JSON.stringify(sale));
    localStorage.setItem(LS_PROMO_KEY, JSON.stringify(promos));
    localStorage.setItem(LS_PAYMENT_KEY, JSON.stringify(payments));
    if (bannerPreview) {
      localStorage.setItem(LS_BANNER_KEY, bannerPreview);
    } else {
      localStorage.removeItem(LS_BANNER_KEY);
    }
    if (bgColor && bgColor !== "#0c0b09") {
      localStorage.setItem(LS_BG_KEY, bgColor);
    } else {
      localStorage.removeItem(LS_BG_KEY);
    }

    // Reconstruct full product list
    const merged: Product[] = DEFAULT_PRODUCTS.filter(
      (d) => !deletedDefaultIds.includes(d.id),
    ).map((def) => {
      const e = editData.find((d) => d.id === def.id);
      if (!e) return def;
      return {
        ...def,
        name: e.name,
        price: e.price,
        description: e.description,
        stock: e.stock,
        bestSeller: e.bestSeller,
      };
    });

    const allProducts = [...merged, ...customProducts];
    toast.success("Changes saved successfully");
    onClose(
      allProducts,
      sale,
      promos,
      payments,
      bannerPreview,
      bgColor !== "#0c0b09" ? bgColor : "",
    );
  };

  const handleAddPromo = () => {
    const code = newPromoCode.trim().toUpperCase();
    if (!code) {
      setNewPromoError("Code is required.");
      return;
    }
    if (promos.some((p) => p.code === code)) {
      setNewPromoError("Code already exists.");
      return;
    }
    setNewPromoError("");
    setPromos((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        code,
        discount: newPromoDiscount,
        enabled: newPromoEnabled,
      },
    ]);
    setNewPromoCode("");
    setNewPromoDiscount(10);
    setNewPromoEnabled(true);
    setPromoAddOpen(false);
    toast.success(`Promo code ${code} added!`);
  };

  const handleAddPayment = () => {
    if (!newPayLabel.trim()) {
      setNewPayError("Label is required.");
      return;
    }
    setNewPayError("");
    setPayments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: newPayType,
        label: newPayLabel.trim(),
        details: newPayDetails.trim(),
        enabled: newPayEnabled,
      },
    ]);
    setNewPayLabel("");
    setNewPayType("upi");
    setNewPayDetails("");
    setNewPayEnabled(true);
    setPaymentAddOpen(false);
    toast.success("Payment method added!");
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBannerPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      data-ocid="admin.panel"
    >
      {/* Admin Header */}
      <header
        className="sticky top-0 z-10 border-b border-border px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: "oklch(0.09 0.008 60 / 0.97)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src={LOGO}
            alt="ROCHER"
            className="h-9 w-9 rounded-full object-contain"
          />
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">
              ROCHER Admin
            </h1>
            <p className="text-xs text-muted-foreground">
              Product & Sale Management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            data-ocid="admin.save_button"
            className="flex items-center gap-2 px-5 py-2 btn-gold font-display font-bold text-sm rounded-lg"
          >
            <Save size={14} /> Save Changes
          </button>
          <button
            type="button"
            onClick={() => onClose()}
            data-ocid="admin.close_button"
            className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-sm rounded-lg"
          >
            <LogOut size={14} /> Exit
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* ── SALE SETTINGS ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-brand-gold" />
            <h2 className="font-display text-xl font-bold text-foreground">
              Sale Settings
            </h2>
          </div>
          <div
            className="bg-card border rounded-xl p-6 shadow-card"
            style={{
              borderColor: sale.enabled
                ? "oklch(0.45 0.2 25 / 0.5)"
                : undefined,
            }}
            data-ocid="admin.panel"
          >
            {sale.enabled && (
              <div
                className="mb-4 px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2"
                style={{ background: "oklch(0.45 0.2 25)" }}
                data-ocid="admin.success_state"
              >
                🔥 Sale is LIVE — {sale.label} · {sale.discount}% OFF
              </div>
            )}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sale-enabled"
                  checked={sale.enabled}
                  onChange={(e) =>
                    setSale((s) => ({ ...s, enabled: e.target.checked }))
                  }
                  data-ocid="admin.checkbox.1"
                  className="w-4 h-4 accent-brand-gold cursor-pointer"
                />
                <label
                  htmlFor="sale-enabled"
                  className="font-bold text-sm text-foreground cursor-pointer select-none"
                >
                  Enable Sale
                </label>
              </div>

              {sale.enabled && (
                <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label
                      htmlFor="sale-discount"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Discount %
                    </label>
                    <input
                      id="sale-discount"
                      type="number"
                      min="1"
                      max="90"
                      value={sale.discount}
                      onChange={(e) =>
                        setSale((s) => ({
                          ...s,
                          discount: Math.min(
                            90,
                            Math.max(1, Number(e.target.value)),
                          ),
                        }))
                      }
                      data-ocid="admin.input"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="sale-label"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Sale Label
                    </label>
                    <input
                      id="sale-label"
                      type="text"
                      value={sale.label}
                      onChange={(e) =>
                        setSale((s) => ({ ...s, label: e.target.value }))
                      }
                      data-ocid="admin.input"
                      placeholder="e.g. SUMMER SALE"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── SITE APPEARANCE ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-brand-gold" />
            <h2 className="font-display text-xl font-bold text-foreground">
              Site Appearance
            </h2>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-6">
            {/* Banner Upload */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Hero Banner Image
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-48 h-24 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                  <img
                    src={bannerPreview || BANNER}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <label
                    className="flex items-center gap-2 px-4 py-2.5 btn-outline-gold font-display font-bold text-xs rounded-lg cursor-pointer w-fit"
                    data-ocid="admin.upload_button"
                  >
                    <Image size={14} /> Upload Banner Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerFile}
                    />
                  </label>
                  {bannerPreview && (
                    <button
                      type="button"
                      onClick={() => setBannerPreview("")}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors w-fit"
                    >
                      <X size={12} /> Reset to Default
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload a JPG or PNG to replace the hero banner.
                  </p>
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Background Color
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  data-ocid="admin.input"
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <span className="font-mono text-sm text-foreground">
                  {bgColor}
                </span>
                {bgColor !== "#0c0b09" && (
                  <button
                    type="button"
                    onClick={() => setBgColor("#0c0b09")}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-brand-gold transition-colors"
                  >
                    <X size={12} /> Reset to Default
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── PAYMENT METHODS ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-brand-gold" />
              <h2 className="font-display text-xl font-bold text-foreground">
                Payment Methods
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setPaymentAddOpen((o) => !o)}
              data-ocid="admin.open_modal_button"
              className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-xs rounded-lg"
            >
              {paymentAddOpen ? (
                <>
                  <X size={12} /> Collapse
                </>
              ) : (
                <>
                  <Plus size={12} /> Add Method
                </>
              )}
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
            {payments.length === 0 && (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="admin.empty_state"
              >
                No payment methods configured.
              </p>
            )}
            {payments.map((pm, i) => (
              <div
                key={pm.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
                data-ocid={`admin.item.${i + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-sm text-foreground">
                      {pm.label}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                      style={{
                        background: "oklch(0.85 0.12 85 / 0.15)",
                        color: "oklch(0.85 0.12 85)",
                      }}
                    >
                      {pm.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {pm.details}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={pm.enabled}
                    onChange={(e) =>
                      setPayments((prev) =>
                        prev.map((p) =>
                          p.id === pm.id
                            ? { ...p, enabled: e.target.checked }
                            : p,
                        ),
                      )
                    }
                    data-ocid={`admin.toggle.${i + 1}`}
                    className="w-4 h-4 accent-brand-gold cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPayments((prev) => prev.filter((p) => p.id !== pm.id))
                    }
                    data-ocid={`admin.delete_button.${i + 1}`}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {paymentAddOpen && (
              <div
                className="border border-brand-gold/30 rounded-xl p-5 animate-fade-in space-y-4 mt-2"
                data-ocid="admin.dialog"
              >
                {newPayError && (
                  <p
                    className="text-xs text-destructive font-bold"
                    data-ocid="admin.error_state"
                  >
                    {newPayError}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="pay-label-new"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Label *
                    </label>
                    <input
                      id="pay-label-new"
                      type="text"
                      value={newPayLabel}
                      onChange={(e) => setNewPayLabel(e.target.value)}
                      placeholder="e.g. UPI Payment"
                      data-ocid="admin.input"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pay-type"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Type
                    </label>
                    <select
                      id="pay-type"
                      value={newPayType}
                      onChange={(e) => setNewPayType(e.target.value)}
                      data-ocid="admin.select"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    >
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="cod">Cash on Delivery</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="pay-details"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Details
                    </label>
                    <input
                      id="pay-details"
                      type="text"
                      value={newPayDetails}
                      onChange={(e) => setNewPayDetails(e.target.value)}
                      placeholder="e.g. yourupi@bank or instructions"
                      data-ocid="admin.input"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pay-enabled"
                      checked={newPayEnabled}
                      onChange={(e) => setNewPayEnabled(e.target.checked)}
                      data-ocid="admin.checkbox.3"
                      className="w-4 h-4 accent-brand-gold cursor-pointer"
                    />
                    <label
                      htmlFor="pay-enabled"
                      className="text-sm font-bold text-foreground cursor-pointer select-none"
                    >
                      Enabled
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    data-ocid="admin.submit_button"
                    className="flex items-center gap-2 px-5 py-2 btn-gold font-display font-bold text-sm rounded-lg"
                  >
                    <Plus size={13} /> Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentAddOpen(false);
                      setNewPayError("");
                    }}
                    data-ocid="admin.cancel_button"
                    className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── PROMO CODES ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Ticket size={16} className="text-brand-gold" />
              <h2 className="font-display text-xl font-bold text-foreground">
                Promo Codes
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setPromoAddOpen((o) => !o)}
              data-ocid="admin.open_modal_button"
              className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-xs rounded-lg"
            >
              {promoAddOpen ? (
                <>
                  <X size={12} /> Collapse
                </>
              ) : (
                <>
                  <Plus size={12} /> Add Code
                </>
              )}
            </button>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-3">
            {promos.length === 0 && (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="admin.empty_state"
              >
                No promo codes yet.
              </p>
            )}
            {promos.map((promo, i) => (
              <div
                key={promo.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
                data-ocid={`admin.item.${i + 1}`}
              >
                <span
                  className="font-mono font-bold text-sm px-3 py-1 rounded-md"
                  style={{
                    background: "oklch(0.85 0.12 85 / 0.1)",
                    color: "oklch(0.85 0.12 85)",
                    border: "1px solid oklch(0.85 0.12 85 / 0.3)",
                  }}
                >
                  {promo.code}
                </span>
                <span className="text-sm text-muted-foreground">
                  {promo.discount}% off
                </span>
                <div className="flex-1" />
                <input
                  type="checkbox"
                  checked={promo.enabled}
                  onChange={(e) =>
                    setPromos((prev) =>
                      prev.map((p) =>
                        p.id === promo.id
                          ? { ...p, enabled: e.target.checked }
                          : p,
                      ),
                    )
                  }
                  data-ocid={`admin.toggle.${i + 1}`}
                  className="w-4 h-4 accent-brand-gold cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPromos((prev) => prev.filter((p) => p.id !== promo.id))
                  }
                  data-ocid={`admin.delete_button.${i + 1}`}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {promoAddOpen && (
              <div
                className="border border-brand-gold/30 rounded-xl p-5 animate-fade-in space-y-4 mt-2"
                data-ocid="admin.dialog"
              >
                {newPromoError && (
                  <p
                    className="text-xs text-destructive font-bold"
                    data-ocid="admin.error_state"
                  >
                    {newPromoError}
                  </p>
                )}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="promo-code"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Promo Code *
                    </label>
                    <input
                      id="promo-code"
                      type="text"
                      value={newPromoCode}
                      onChange={(e) =>
                        setNewPromoCode(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. SAVE10"
                      data-ocid="admin.input"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="promo-discount"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Discount %
                    </label>
                    <input
                      id="promo-discount"
                      type="number"
                      min="1"
                      max="90"
                      value={newPromoDiscount}
                      onChange={(e) =>
                        setNewPromoDiscount(
                          Math.min(90, Math.max(1, Number(e.target.value))),
                        )
                      }
                      data-ocid="admin.input"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="promo-enabled"
                      checked={newPromoEnabled}
                      onChange={(e) => setNewPromoEnabled(e.target.checked)}
                      data-ocid="admin.checkbox.4"
                      className="w-4 h-4 accent-brand-gold cursor-pointer"
                    />
                    <label
                      htmlFor="promo-enabled"
                      className="text-sm font-bold text-foreground cursor-pointer select-none"
                    >
                      Enabled
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddPromo}
                    data-ocid="admin.submit_button"
                    className="flex items-center gap-2 px-5 py-2 btn-gold font-display font-bold text-sm rounded-lg"
                  >
                    <Plus size={13} /> Add Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPromoAddOpen(false);
                      setNewPromoError("");
                    }}
                    data-ocid="admin.cancel_button"
                    className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-sm rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── ADD NEW PRODUCT ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-brand-gold" />
              <h2 className="font-display text-xl font-bold text-foreground">
                Add New Product
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              data-ocid="admin.open_modal_button"
              className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-xs rounded-lg"
            >
              {addOpen ? (
                <>
                  <X size={12} /> Collapse
                </>
              ) : (
                <>
                  <Plus size={12} /> New Product
                </>
              )}
            </button>
          </div>

          {addOpen && (
            <div
              className="bg-card border border-brand-gold/30 rounded-xl p-6 shadow-card animate-fade-in"
              data-ocid="admin.dialog"
            >
              {draftError && (
                <p
                  className="text-xs text-destructive mb-4 font-bold"
                  data-ocid="admin.error_state"
                >
                  {draftError}
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="draft-name"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                  >
                    Product Name *
                  </label>
                  <input
                    id="draft-name"
                    type="text"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    data-ocid="admin.input"
                    placeholder="e.g. ROCHER Hoodie"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="draft-price"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                  >
                    Price (₹) *
                  </label>
                  <input
                    id="draft-price"
                    type="number"
                    min="1"
                    value={draft.price}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, price: e.target.value }))
                    }
                    data-ocid="admin.input"
                    placeholder="e.g. 499"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="draft-desc"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="draft-desc"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    data-ocid="admin.textarea"
                    rows={2}
                    placeholder="Brief product description..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors resize-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="draft-stock"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                  >
                    Stock Count
                  </label>
                  <input
                    id="draft-stock"
                    type="number"
                    min="0"
                    value={draft.stock}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, stock: e.target.value }))
                    }
                    data-ocid="admin.input"
                    placeholder="e.g. 10"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="draft-bs"
                    checked={draft.bestSeller}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, bestSeller: e.target.checked }))
                    }
                    data-ocid="admin.checkbox.2"
                    className="w-4 h-4 accent-brand-gold cursor-pointer"
                  />
                  <label
                    htmlFor="draft-bs"
                    className="text-sm font-bold text-foreground cursor-pointer select-none"
                  >
                    ★ Best Seller
                  </label>
                </div>

                {/* Image URLs */}
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                    Image URLs
                  </p>
                  <div className="flex flex-col gap-2">
                    {draft.imageUrls.map((url, i) => (
                      <ImageUrlField
                        // biome-ignore lint/suspicious/noArrayIndexKey: image list reordering not supported
                        key={i}
                        value={url}
                        onChange={(v) => updateImageUrl(i, v)}
                        onRemove={() => removeImageUrl(i)}
                        showRemove={draft.imageUrls.length > 1}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-brand-gold hover:text-brand-gold/70 transition-colors"
                  >
                    <Plus size={12} /> Add Image
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  data-ocid="admin.submit_button"
                  className="flex items-center gap-2 px-6 py-2.5 btn-gold font-display font-bold text-sm rounded-lg"
                >
                  <Plus size={14} /> Add Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(EMPTY_DRAFT);
                    setAddOpen(false);
                    setDraftError("");
                  }}
                  data-ocid="admin.cancel_button"
                  className="flex items-center gap-2 px-5 py-2.5 btn-outline-gold font-display font-bold text-sm rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── PRODUCTS LIST ── */}
        <section>
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              Products ({editData.length})
            </h2>
            <p className="text-muted-foreground text-sm">
              Edit details or delete products below.
            </p>
          </div>

          {editData.length === 0 && (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="admin.empty_state"
            >
              <p className="font-display text-sm">
                No products yet. Add one above.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-8">
            {editData.map((p, idx) => (
              <div
                key={p.id}
                className="bg-card border border-border rounded-xl p-6 shadow-card"
                data-ocid={`admin.item.${idx + 1}`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {p.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${p.name}"? This cannot be undone.`,
                        )
                      )
                        deleteProduct(p.id);
                    }}
                    data-ocid={`admin.delete_button.${idx + 1}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors"
                    style={{
                      color: "oklch(0.65 0.2 25)",
                      borderColor: "oklch(0.65 0.2 25 / 0.4)",
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`ap-name-${p.id}`}
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Product Name
                    </label>
                    <input
                      id={`ap-name-${p.id}`}
                      type="text"
                      value={p.name}
                      onChange={(e) => update(p.id, "name", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`ap-price-${p.id}`}
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Price (₹)
                    </label>
                    <input
                      id={`ap-price-${p.id}`}
                      type="number"
                      value={p.price}
                      onChange={(e) =>
                        update(p.id, "price", Number(e.target.value))
                      }
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`ap-desc-${p.id}`}
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Description
                    </label>
                    <textarea
                      id={`ap-desc-${p.id}`}
                      value={p.description}
                      onChange={(e) =>
                        update(p.id, "description", e.target.value)
                      }
                      rows={2}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`ap-stock-${p.id}`}
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Stock Count
                    </label>
                    <input
                      id={`ap-stock-${p.id}`}
                      type="number"
                      min="0"
                      value={p.stock}
                      onChange={(e) =>
                        update(p.id, "stock", Number(e.target.value))
                      }
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input
                      type="checkbox"
                      id={`bs-${p.id}`}
                      checked={p.bestSeller}
                      onChange={(e) =>
                        update(p.id, "bestSeller", e.target.checked)
                      }
                      data-ocid={`admin.checkbox.${idx + 3}`}
                      className="w-4 h-4 accent-brand-gold cursor-pointer"
                    />
                    <label
                      htmlFor={`bs-${p.id}`}
                      className="text-sm font-bold text-foreground cursor-pointer select-none"
                    >
                      ★ Mark as Best Seller
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3 justify-end pb-4">
          <button
            type="button"
            onClick={handleSave}
            data-ocid="admin.save_button"
            className="flex items-center gap-2 px-6 py-3 btn-gold font-display font-bold text-sm rounded-lg"
          >
            <Save size={15} /> Save All Changes
          </button>
          <button
            type="button"
            onClick={() => onClose()}
            data-ocid="admin.close_button"
            className="flex items-center gap-2 px-5 py-3 btn-outline-gold font-display font-bold text-sm rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PRODUCT CARD ─── */
function ProductCard({
  product,
  sale,
  onAddToCart,
  onOpenDetail,
  onDirectBuy,
  index,
}: {
  product: Product;
  sale: SaleSettings;
  onAddToCart: (item: CartItem) => void;
  onOpenDetail: (p: Product) => void;
  onDirectBuy: (item: CheckoutItem) => void;
  index: number;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const revealRef = useScrollReveal();

  const discountedPrice = sale.enabled
    ? salePrice(product.price, sale.discount)
    : null;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      toast.error("Please select a size first");
      return;
    }
    setSizeError(false);
    onAddToCart({
      id: `${product.id}-${selectedSize}`,
      name: product.name,
      price: discountedPrice ?? product.price,
      size: selectedSize,
      qty: 1,
      image: product.images[0],
    });
    toast.success(`${product.name} (${selectedSize}) added to cart!`);
  };

  return (
    <div
      ref={revealRef}
      className="scroll-reveal bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-400 group"
      data-ocid={`products.item.${index + 1}`}
    >
      {/* Image */}
      <button
        type="button"
        className="product-img-wrap relative bg-muted cursor-pointer w-full block text-left border-0 p-0"
        style={{ height: "400px" }}
        onClick={() => onOpenDetail(product)}
        onKeyDown={(e) => e.key === "Enter" && onOpenDetail(product)}
        aria-label={`View ${product.name} details`}
      >
        <ImageFallback
          src={product.images[imgIndex]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {product.bestSeller && (
          <div className="best-seller-ribbon">★ Best Seller</div>
        )}
        {sale.enabled && (
          <div
            className="best-seller-ribbon"
            style={{
              background: "oklch(0.45 0.2 25)",
              top: product.bestSeller ? "48px" : "12px",
            }}
          >
            🔥 -{sale.discount}%
          </div>
        )}
        {product.images.length > 1 && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {["Front", "Back"].map((label, i) => (
              <button
                type="button"
                key={label}
                onClick={() => setImgIndex(i)}
                data-ocid="products.toggle"
                className={`px-3 py-1 text-xs font-display tracking-wider rounded-full border transition-all ${imgIndex === i ? "btn-gold border-transparent" : "btn-outline-gold bg-background/60"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors pointer-events-none" />
      </button>

      {/* Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            className="font-display text-xl font-bold text-card-foreground hover:text-brand-gold transition-colors text-left leading-tight"
            data-ocid={`products.link.${index + 1}`}
          >
            {product.name}
          </button>
          <div className="ml-4 flex-shrink-0 text-right">
            {sale.enabled && discountedPrice ? (
              <>
                <span className="font-display font-bold text-xl text-brand-gold block">
                  ₹{discountedPrice}
                </span>
                <span className="font-display text-xs line-through text-muted-foreground">
                  ₹{product.price}
                </span>
              </>
            ) : (
              <span className="font-display font-bold text-xl text-brand-gold">
                ₹{product.price}
              </span>
            )}
          </div>
        </div>

        {product.stock <= 5 && (
          <p
            className="text-xs font-bold tracking-wider mb-2"
            style={{ color: "oklch(0.78 0.15 60)" }}
          >
            ⚡ Only {product.stock} left
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-1">
          {product.description}
        </p>
        <p className="text-xs text-muted-foreground/60 italic mb-5">
          100% Premium Cotton
        </p>

        <div className="gold-divider mb-5" />

        {/* Sizes */}
        <div className="mb-5">
          <p
            className={`text-xs font-bold uppercase tracking-widest mb-2 ${sizeError ? "text-destructive" : "text-muted-foreground"}`}
            data-ocid="products.error_state"
          >
            {sizeError ? "Select a size" : "Size"}
          </p>
          <div className="flex gap-2 flex-wrap">
            {SIZES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => {
                  setSelectedSize(s);
                  setSizeError(false);
                }}
                data-ocid="products.toggle"
                className={`w-10 h-10 text-sm font-display font-bold rounded border transition-all ${selectedSize === s ? "btn-gold border-transparent" : "btn-outline-gold"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            data-ocid={`products.primary_button.${index + 1}`}
            className="w-full py-3 font-display font-bold text-sm uppercase tracking-widest btn-gold rounded-lg"
          >
            Add to Cart
          </button>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid={`products.secondary_button.${index + 1}`}
            className="w-full py-3 font-display font-bold text-sm uppercase tracking-widest btn-outline-gold rounded-lg text-center block"
          >
            Order via Instagram
          </a>
          <button
            type="button"
            data-ocid={`products.primary_button.${index + 1}`}
            onClick={() => {
              if (!selectedSize) {
                setSizeError(true);
                toast.error("Please select a size first");
                return;
              }
              onDirectBuy({
                id: `${product.id}-${selectedSize}`,
                name: product.name,
                price: discountedPrice ?? product.price,
                image: product.images[0],
                size: selectedSize,
                qty: 1,
              });
            }}
            className="w-full py-3 font-display font-bold text-sm uppercase tracking-widest rounded-lg"
            style={{
              background: "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)",
              color: "#0a0a0a",
            }}
          >
            ⚡ Direct Buy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CART DRAWER ─── */
function CartDrawer({
  cart,
  onClose,
  onRemove,
  onUpdateQty,
  promoCodes,
  paymentMethods,
}: {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  promoCodes: PromoCode[];
  paymentMethods: PaymentMethod[];
}) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const enabledPayments = paymentMethods.filter((pm) => pm.enabled);
  const [selectedPayment, setSelectedPayment] = useState<string>(
    () => enabledPayments[0]?.id || "",
  );

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const found = promoCodes.find((p) => p.code === code && p.enabled);
    if (found) {
      setAppliedPromo(found);
      setPromoError("");
    } else {
      setPromoError("Invalid or expired promo code");
      setAppliedPromo(null);
    }
  };

  const discountedTotal = appliedPromo
    ? Math.round(total * (1 - appliedPromo.discount / 100))
    : total;

  return (
    <div className="fixed inset-0 z-50" data-ocid="cart.modal">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in cursor-pointer"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close cart"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-popover shadow-2xl flex flex-col animate-slide-in-right border-l border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-bold text-base text-foreground">
            Your Cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-ocid="cart.close_button"
            className="p-1 hover:text-brand-gold transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {cart.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground"
            data-ocid="cart.empty_state"
          >
            <ShoppingCart size={40} className="opacity-20" />
            <p className="font-display text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.map((item, i) => (
                <div
                  key={item.id}
                  className="flex gap-3 items-center"
                  data-ocid={`cart.item.${i + 1}`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <ImageFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-xs text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Size: {item.size}
                    </p>
                    <p className="text-sm font-bold text-brand-gold">
                      ₹{item.price}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.qty - 1)}
                        className="w-6 h-6 rounded-full border border-border text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors text-sm font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-foreground w-4 text-center">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        className="w-6 h-6 rounded-full border border-border text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors text-sm font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    data-ocid={`cart.delete_button.${i + 1}`}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-border space-y-4">
              {/* Promo Code */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Promo Code
                </p>
                {appliedPromo ? (
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{
                      background: "oklch(0.85 0.12 85 / 0.1)",
                      border: "1px solid oklch(0.85 0.12 85 / 0.3)",
                    }}
                    data-ocid="cart.success_state"
                  >
                    <span
                      className="flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: "oklch(0.85 0.12 85)" }}
                    >
                      <Check size={13} /> {appliedPromo.code} —{" "}
                      {appliedPromo.discount}% OFF
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoInput("");
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) =>
                        setPromoInput(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      placeholder="Enter code"
                      data-ocid="cart.input"
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      data-ocid="cart.secondary_button"
                      className="px-4 py-2 btn-outline-gold font-display font-bold text-xs rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && (
                  <p
                    className="text-xs text-destructive mt-1 font-bold"
                    data-ocid="cart.error_state"
                  >
                    {promoError}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                  Total
                </span>
                <div className="text-right">
                  {appliedPromo && (
                    <p className="text-xs text-muted-foreground line-through">
                      ₹{total}
                    </p>
                  )}
                  <span className="font-display font-bold text-xl text-brand-gold">
                    ₹{discountedTotal}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              {enabledPayments.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Payment Method
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {enabledPayments.map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setSelectedPayment(pm.id)}
                        data-ocid="cart.toggle"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold font-display transition-all"
                        style={
                          selectedPayment === pm.id
                            ? {
                                background: "oklch(0.85 0.12 85)",
                                color: "oklch(0.09 0.008 60)",
                              }
                            : {
                                background: "transparent",
                                border: "1px solid oklch(0.3 0.02 60)",
                                color: "oklch(0.7 0.02 60)",
                              }
                        }
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                  {selectedPayment && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {
                        enabledPayments.find((pm) => pm.id === selectedPayment)
                          ?.details
                      }
                    </p>
                  )}
                </div>
              )}

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="cart.primary_button"
                className="w-full py-3 btn-gold font-display font-bold text-sm uppercase tracking-widest rounded-lg text-center block"
              >
                Order via Instagram
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── APP ─── */
export default function App() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [sale, setSale] = useState<SaleSettings>(() => loadSaleSettings());
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() =>
    loadPromoCodes(),
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() =>
    loadPaymentMethods(),
  );
  const [customBanner, setCustomBanner] = useState<string>(() =>
    loadCustomBanner(),
  );
  const [customBg, setCustomBg] = useState<string>(() => loadCustomBg());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  const handleDirectBuy = useCallback((item: CheckoutItem) => {
    setCheckoutItem(item);
  }, []);
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing)
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    scrollTo("home");
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    logoClickTimer.current = setTimeout(() => setLogoClickCount(0), 3000);
    if (newCount >= 5) {
      setLogoClickCount(0);
      setShowAdminLogin(true);
    }
  };

  useEffect(() => {
    document.body.style.overflow =
      cartOpen || showAdminLogin || showAdminPanel || !!selectedProduct
        ? "hidden"
        : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, showAdminLogin, showAdminPanel, selectedProduct]);

  const navLinks = [
    { label: "Home", id: "home" },
    { label: "Collection", id: "products" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={customBg ? { backgroundColor: customBg } : undefined}
    >
      <Toaster position="top-right" theme="dark" />

      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-40 border-b border-border"
        style={{
          backgroundColor: "oklch(0.09 0.008 60 / 0.96)",
          backdropFilter: "blur(16px)",
        }}
        data-ocid="nav.panel"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={handleLogoClick}
              data-ocid="nav.link"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity select-none"
              title="ROCHER"
            >
              <img
                src={LOGO}
                alt="ROCHER"
                className="h-10 w-10 rounded-full object-contain"
              />
              <span className="font-display font-bold text-lg tracking-[0.2em] uppercase text-foreground">
                ROCHER
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  data-ocid="nav.link"
                  className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                data-ocid="cart.open_modal_button"
                className="relative p-2 text-foreground hover:text-brand-gold transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold text-background text-xs font-bold rounded-full flex items-center justify-center"
                    style={{ color: "oklch(0.09 0.008 60)" }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-foreground hover:text-brand-gold transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-border mt-2 pt-4 animate-fade-in">
              {navLinks.map((link) => (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="block w-full text-left py-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SALE BANNER — shown below navbar when sale is active */}
        {sale.enabled && (
          <div
            className="w-full text-center py-2 px-4 text-xs font-display font-bold tracking-[0.25em] uppercase"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.14 0.02 60) 0%, oklch(0.18 0.03 70) 50%, oklch(0.14 0.02 60) 100%)",
              color: "oklch(0.85 0.12 85)",
              borderTop: "1px solid oklch(0.3 0.05 75 / 0.4)",
            }}
            data-ocid="nav.panel"
          >
            ☀ {sale.label} — UP TO {sale.discount}% OFF ☀
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="home"
        className="relative flex items-center justify-center min-h-screen overflow-hidden"
        style={{ paddingTop: sale.enabled ? "88px" : "64px" }}
      >
        <div className="absolute inset-0">
          <img
            src={customBanner || BANNER}
            alt="ROCHER Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(12,11,9,0.75) 0%, rgba(12,11,9,0.5) 50%, rgba(12,11,9,0.9) 100%)",
            }}
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <p className="font-display text-xs uppercase tracking-[0.5em] text-brand-gold mb-4 animate-fade-in-up opacity-0">
            Est. Premium Collection
          </p>
          <h1
            className="font-display font-bold uppercase leading-none text-foreground animate-fade-in-up opacity-0 delay-200"
            style={{
              fontSize: "clamp(4.5rem, 16vw, 11rem)",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 40px rgba(0,0,0,0.5)",
            }}
          >
            ROCHER
          </h1>
          <div className="gold-divider max-w-xs mx-auto my-5 animate-fade-in-up opacity-0 delay-300" />
          <p
            className="font-display font-medium tracking-[0.35em] text-foreground/75 animate-fade-in-up opacity-0 delay-400"
            style={{ fontSize: "clamp(0.8rem, 2vw, 1.2rem)" }}
          >
            Feel the Strength
          </p>
          <div className="mt-10 animate-fade-in-up opacity-0 delay-600">
            <button
              type="button"
              onClick={() => scrollTo("products")}
              data-ocid="hero.primary_button"
              className="inline-flex items-center gap-3 px-10 py-4 btn-gold font-display font-bold uppercase tracking-[0.2em] text-sm rounded-full shadow-gold-glow"
            >
              Shop Now <ChevronDown size={15} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={20} className="text-foreground/30" />
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="font-display text-xs uppercase tracking-[0.45em] text-brand-gold mb-3">
            Collection
          </p>
          <h2
            className="font-display font-bold text-foreground leading-tight"
            style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
          >
            New Arrivals
          </h2>
          <div className="gold-divider max-w-xs mt-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              sale={sale}
              onAddToCart={addToCart}
              onOpenDetail={setSelectedProduct}
              onDirectBuy={handleDirectBuy}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* STATEMENT BAND */}
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.09 0.008 60) 0%, oklch(0.14 0.015 75) 50%, oklch(0.09 0.008 60) 100%)",
          }}
        />
        <div className="relative z-10 px-8 md:px-16 max-w-7xl mx-auto">
          <h2
            className="font-display font-bold uppercase leading-none text-foreground/90"
            style={{
              fontSize: "clamp(2.5rem, 10vw, 7rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Built for
            <br />
            <span className="text-brand-gold">Champions</span>
          </h2>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-display text-xs uppercase tracking-[0.45em] text-brand-gold mb-3">
            Get in Touch
          </p>
          <h2
            className="font-display font-bold text-foreground mb-6"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Connect With Us
          </h2>
          <div className="gold-divider max-w-xs mx-auto mb-8" />
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Have questions about sizing, orders, or collabs?
            <br />
            Slide into our DMs — we reply fast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-foreground">
              <Instagram size={16} className="text-brand-gold" />
              @official_rocher
            </div>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="contact.primary_button"
              className="inline-flex items-center gap-2 px-6 py-3 btn-gold font-display font-bold text-sm uppercase tracking-widest rounded-full"
            >
              <Instagram size={14} /> DM on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t border-border py-10 px-4"
        style={{ backgroundColor: "oklch(0.07 0.006 60)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-display font-bold text-lg tracking-[0.25em] uppercase text-foreground">
                ROCHER
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Built for Strength
              </p>
            </div>
            <div className="flex items-center gap-5">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="footer.link"
                className="text-muted-foreground hover:text-brand-gold transition-colors"
              >
                <Instagram size={18} />
              </a>
            </div>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              &copy; {new Date().getFullYear()} ROCHER. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* OVERLAYS */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          promoCodes={promoCodes}
          paymentMethods={paymentMethods}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onUpdateQty={updateQty}
        />
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          sale={sale}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(item) => {
            addToCart(item);
          }}
          onDirectBuy={handleDirectBuy}
        />
      )}

      {checkoutItem && (
        <CheckoutModal
          item={checkoutItem}
          onClose={() => setCheckoutItem(null)}
          promoCodes={promoCodes}
          paymentMethods={paymentMethods}
        />
      )}

      {showAdminLogin && (
        <AdminLoginModal
          onSuccess={() => {
            setShowAdminLogin(false);
            setShowAdminPanel(true);
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          products={products}
          saleSettings={sale}
          promoCodes={promoCodes}
          paymentMethods={paymentMethods}
          customBanner={customBanner}
          customBg={customBg}
          onClose={(
            updated,
            newSale,
            newPromos,
            newPayments,
            newBanner,
            newBg,
          ) => {
            if (updated) setProducts(updated);
            if (newSale) setSale(newSale);
            if (newPromos !== undefined) setPromoCodes(newPromos);
            if (newPayments !== undefined) setPaymentMethods(newPayments);
            if (newBanner !== undefined) setCustomBanner(newBanner);
            if (newBg !== undefined) setCustomBg(newBg);
            setShowAdminPanel(false);
          }}
        />
      )}
    </div>
  );
}
