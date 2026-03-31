import { Toaster } from "@/components/ui/sonner";
import {
  Check,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Image,
  Instagram,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Package,
  PackageCheck,
  PackageX,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Ticket,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "./backend";
import { useActor } from "./hooks/useActor";

const LOGO =
  "/assets/uploads/rocher_2_logo-019d2487-1d4d-76d8-902f-54fb04dc6ff6-5.png";
const BANNER =
  "/assets/uploads/rocher-banner-019d2803-de4c-7516-938d-f7ddc535d35e-1.jpg";
const DEFAULT_INSTA_ID = "official_rocher";
const SIZES = ["S", "M", "L", "XL"];
const ADMIN_PASSWORD = "rocher2024";
const LS_KEY = "rocher_admin_data";
const LS_SALE_KEY = "rocher_sale_settings";
const LS_PROMO_KEY = "rocher_promo_codes";
const LS_PAYMENT_KEY = "rocher_payment_methods";
const LS_BANNER_KEY = "rocher_custom_banner";
const LS_BG_KEY = "rocher_custom_bg";
const LS_INSTA_KEY = "rocher_instagram_id";
const LS_SECTIONS_KEY = "rocher_custom_sections";
const LS_SEO_TITLE_KEY = "rocher_seo_title";
const LS_ORDERS_KEY = "rocher_orders";
const LS_ACTIVITY_KEY = "rocher_activity_log";
const LS_GOOGLE_USER_KEY = "rocher_google_user";
const LS_FOUNDER_KEY = "rocher_founder_data";
const ADMIN_GMAIL = "tchhillar493@gmail.com";

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

interface ProductSection {
  id: string;
  title: string;
  subtitle: string;
  productIds: string[];
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

interface Order {
  id: string;
  createdAt: string;
  status: "placed" | "cancelled";
  trackingStatus:
    | "placed"
    | "packed"
    | "shipped"
    | "out_for_delivery"
    | "delivered";
  product: string;
  size: string;
  qty: number;
  price: number;
  paymentMethod: string;
  promoCode: string;
  name: string;
  phone: string;
  address: string;
  locationCoords?: string;
  viaInstagram: boolean;
  userEmail?: string;
  upiTransactionId?: string;
  upiPaymentStatus?: "pending" | "submitted" | "verified";
}

interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

// Module-level actor ref for order syncing from event handlers
let _canisterActor: backendInterface | null = null;
function setCanisterActor(actor: backendInterface | null) {
  _canisterActor = actor;
}
function syncOrdersToCanister(orders: Order[]) {
  if (!_canisterActor) return;
  _canisterActor
    .setValue("orders", JSON.stringify(orders), ADMIN_PASSWORD)
    .catch(() => {});
}

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LS_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

function saveOrder(order: Order) {
  try {
    const existing = loadOrders();
    const updated = [order, ...existing];
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(updated));
    syncOrdersToCanister(updated);
    logActivity(
      "customer",
      "Order Placed",
      `${order.name} ordered ${order.product} (${order.size}) - ₹${order.price} via ${order.viaInstagram ? "Instagram" : "Direct"}`,
    );
  } catch {}
}

function cancelOrder(orderId: string) {
  try {
    const existing = loadOrders();
    const updated = existing.map((o) =>
      o.id === orderId ? { ...o, status: "cancelled" as const } : o,
    );
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(updated));
    syncOrdersToCanister(updated);
    logActivity(
      "admin",
      "Order Cancelled by Admin",
      `Order ${orderId.slice(-6)} cancelled`,
    );
  } catch {}
}

function logActivity(actor: string, action: string, details: string) {
  try {
    const raw = localStorage.getItem(LS_ACTIVITY_KEY);
    const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];
    const entry: ActivityLog = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
    };
    logs.unshift(entry);
    localStorage.setItem(LS_ACTIVITY_KEY, JSON.stringify(logs.slice(0, 500)));
  } catch {}
}

function loadActivityLog(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(LS_ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadGoogleUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(LS_GOOGLE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function updateOrderTrackingStatus(
  orderId: string,
  trackingStatus: Order["trackingStatus"],
) {
  try {
    const existing = loadOrders();
    const updated = existing.map((o) =>
      o.id === orderId ? { ...o, trackingStatus } : o,
    );
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(updated));
    logActivity(
      "admin",
      "Order Status Updated",
      `Order ${orderId.slice(-6)} → ${trackingStatus.replace(/_/g, " ")}`,
    );
  } catch {}
}

function customerCancelOrder(orderId: string, phone: string) {
  try {
    const existing = loadOrders();
    const updated = existing.map((o) =>
      o.id === orderId ? { ...o, status: "cancelled" as const } : o,
    );
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(updated));
    logActivity(
      `customer:${phone}`,
      "Order Cancelled",
      `Customer cancelled order ${orderId.slice(-6)}`,
    );
  } catch {}
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

function loadSections(): ProductSection[] {
  try {
    const raw = localStorage.getItem(LS_SECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadInstagramId(): string {
  try {
    return localStorage.getItem(LS_INSTA_KEY) || "official_rocher";
  } catch {
    return "official_rocher";
  }
}

function loadSeoTitle(): string {
  try {
    return (
      localStorage.getItem(LS_SEO_TITLE_KEY) ||
      "ROCHER | Premium Clothing Brand"
    );
  } catch {
    return "ROCHER | Premium Clothing Brand";
  }
}

interface FounderData {
  photo: string;
  note: string;
  name: string;
  title: string;
}

const DEFAULT_FOUNDER: FounderData = {
  photo: "",
  note: "ROCHER was not created to follow trends.\n\nIt was built to represent strength, presence, and individuality.\n\nEvery piece is designed with intention — minimal, bold, and timeless.\nNot for everyone. Only for those who stand firm in who they are.\n\nThis is just the beginning.",
  name: "Tanish",
  title: "Founder, ROCHER",
};

function loadFounderData(): FounderData {
  try {
    const raw = localStorage.getItem(LS_FOUNDER_KEY);
    if (!raw) return DEFAULT_FOUNDER;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FOUNDER, ...parsed };
  } catch {
    return DEFAULT_FOUNDER;
  }
}

function saveFounderData(data: FounderData) {
  try {
    localStorage.setItem(LS_FOUNDER_KEY, JSON.stringify(data));
  } catch {}
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
  instagramId,
}: {
  product: Product;
  sale: SaleSettings;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onDirectBuy?: (item: CheckoutItem) => void;
  instagramId?: string;
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
                href={`https://www.instagram.com/${instagramId || DEFAULT_INSTA_ID}`}
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
  onOrderPlaced,
  instagramId,
  userEmail,
}: {
  item: CheckoutItem | null;
  onClose: () => void;
  promoCodes: PromoCode[];
  paymentMethods: PaymentMethod[];
  onOrderPlaced?: (order: Order) => void;
  instagramId?: string;
  userEmail?: string;
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
  const [locationCoords, setLocationCoords] = useState<string>("");
  const [locationLatLng, setLocationLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const enabledPayments = paymentMethods.filter((pm) => pm.enabled);
  const [selectedPayment, setSelectedPayment] = useState<string>(
    () => enabledPayments[0]?.id || "",
  );
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("");
  const [upiPendingOrder, setUpiPendingOrder] = useState<Order | null>(null);
  const [upiTxnInput, setUpiTxnInput] = useState<string>("");
  const [upiPaymentStep, setUpiPaymentStep] = useState<"select" | "confirm">(
    "select",
  );

  const UPI_APPS = [
    {
      id: "gpay",
      label: "Google Pay",
      upiScheme: "tez://upi/pay",
      packageAndroid: "com.google.android.apps.nbu.paisa.user",
      logo: "/assets/generated/gpay-logo-transparent.dim_120x120.png",
    },
    {
      id: "phonepe",
      label: "PhonePe",
      upiScheme: "phonepe://pay",
      packageAndroid: "com.phonepe.app",
      logo: "/assets/generated/phonepe-logo-transparent.dim_120x120.png",
    },
    {
      id: "paytm",
      label: "Paytm",
      upiScheme: "paytmmp://pay",
      packageAndroid: "net.one97.paytm",
      logo: "/assets/generated/paytm-logo-transparent.dim_120x120.png",
    },
    {
      id: "fampay",
      label: "FamPay",
      upiScheme: "fampay://upi/pay",
      packageAndroid: "com.fampay.in",
      logo: "/assets/generated/fampay-logo-transparent.dim_120x120.png",
    },
    {
      id: "bhim",
      label: "BHIM UPI",
      upiScheme: "upi://pay",
      packageAndroid: "in.org.npci.upiapp",
      logo: "/assets/generated/bhim-logo-transparent.dim_120x120.png",
    },
    {
      id: "amazonpay",
      label: "Amazon Pay",
      upiScheme: "amazonpay://upi/pay",
      packageAndroid: "in.amazon.mShop.android.shopping",
      logo: "/assets/generated/amazonpay-logo-transparent.dim_120x120.png",
    },
    {
      id: "other",
      label: "Other UPI App",
      upiScheme: "upi://pay",
      packageAndroid: "",
      logo: "",
    },
  ];

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

  const buildOrder = (viaInstagram: boolean): Order => {
    const paymentLabel =
      enabledPayments.find((p) => p.id === selectedPayment)?.label ||
      selectedPayment;
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      status: "placed",
      trackingStatus: "placed" as const,
      product: item!.name,
      size: item!.size,
      qty: item!.qty,
      price: finalPrice,
      paymentMethod: paymentLabel,
      promoCode: appliedPromo
        ? `${appliedPromo.code} (-${appliedPromo.discount}%)`
        : "",
      name: form.name,
      phone: form.phone,
      address: `${form.address1}${form.address2 ? `, ${form.address2}` : ""}, ${form.city}, ${form.state} - ${form.pincode}`,
      locationCoords: locationCoords || undefined,
      viaInstagram,
      userEmail: userEmail || undefined,
    };
  };

  const validateForm = () => {
    if (
      !form.name ||
      !form.phone ||
      !form.address1 ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      toast.error("Please fill in all required address fields");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;
    const order = buildOrder(true);
    saveOrder(order);
    onOrderPlaced?.(order);
    const paymentLabel =
      enabledPayments.find((p) => p.id === selectedPayment)?.label ||
      selectedPayment;
    const msg = encodeURIComponent(
      `🛍️ ORDER REQUEST\n\nProduct: ${item!.name}\nSize: ${item!.size}\nQty: ${item!.qty}\nPrice: ₹${finalPrice}${appliedPromo ? ` (Promo: ${appliedPromo.code} -${appliedPromo.discount}%)` : ""}\n\nDelivery Address:\n${form.name}\n${form.phone}\n${form.address1}${form.address2 ? `, ${form.address2}` : ""}\n${form.city}, ${form.state} - ${form.pincode}\n\nPayment: ${paymentLabel}`,
    );
    window.open(
      `https://www.instagram.com/${instagramId || DEFAULT_INSTA_ID}?text=${msg}`,
      "_blank",
    );
    toast.success("Order sent! Check Instagram DM to confirm.");
    onClose();
  };

  const handleDirectOrder = () => {
    if (!validateForm()) return;
    const selPm = enabledPayments.find((p) => p.id === selectedPayment);
    if (selPm?.type === "upi") {
      if (!selectedUpiApp) {
        toast.error("Please select a UPI app to proceed");
        return;
      }
      const upiId = selPm.details || "";
      const amount = finalPrice;
      const appInfo = UPI_APPS.find((a) => a.id === selectedUpiApp);
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=ROCHER+CLOTHING&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order: ${item!.name} x${item!.qty}`)}`;
      // Try app-specific deep link first, fallback to generic UPI
      let deepLink = upiUrl;
      if (appInfo && appInfo.id === "gpay")
        deepLink = `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=ROCHER+CLOTHING&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order: ${item!.name} x${item!.qty}`)}`;
      else if (appInfo && appInfo.id === "phonepe")
        deepLink = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=ROCHER+CLOTHING&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order: ${item!.name} x${item!.qty}`)}`;
      else if (appInfo && appInfo.id === "paytm")
        deepLink = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=ROCHER+CLOTHING&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order: ${item!.name} x${item!.qty}`)}`;
      const order = buildOrder(false);
      setUpiPendingOrder(order);
      window.location.href = deepLink;
      setTimeout(() => {
        setUpiPaymentStep("confirm");
        toast.success(
          `Opening ${appInfo?.label || "UPI app"} — complete payment of ₹${amount} and come back to confirm.`,
        );
      }, 800);
      return;
    }
    const order = buildOrder(false);
    saveOrder(order);
    onOrderPlaced?.(order);
    toast.success("Order placed successfully! We will contact you soon.");
    onClose();
  };

  const inputClass =
    "w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm font-display placeholder-muted-foreground focus:outline-none focus:border-brand-gold transition-colors";

  if (upiPaymentStep === "confirm" && upiPendingOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
        <div className="relative z-10 bg-card rounded-xl w-full max-w-md p-7 shadow-2xl border border-brand-gold/30 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💳</span>
            <div>
              <h2 className="font-display text-xl font-bold text-brand-gold">
                Confirm Payment
              </h2>
              <p className="text-xs text-muted-foreground font-display">
                Complete payment of{" "}
                <span className="text-brand-gold font-bold">
                  ₹{upiPendingOrder.price}
                </span>{" "}
                and enter your transaction ID
              </p>
            </div>
          </div>
          <div className="gold-divider mb-5" />
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-2">
            UPI Transaction ID / UTR Number
          </p>
          <input
            type="text"
            placeholder="Enter 12-digit UTR or transaction reference"
            value={upiTxnInput}
            onChange={(e) => setUpiTxnInput(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm font-display placeholder-muted-foreground focus:outline-none focus:border-brand-gold transition-colors mb-4"
          />
          <p className="text-xs text-muted-foreground font-display mb-5">
            You can find the transaction ID in your UPI app under payment
            history.
          </p>
          <button
            type="button"
            disabled={!upiTxnInput.trim()}
            onClick={() => {
              const finalOrder = {
                ...upiPendingOrder,
                upiTransactionId: upiTxnInput.trim(),
                upiPaymentStatus: "submitted" as const,
              };
              saveOrder(finalOrder);
              onOrderPlaced?.(finalOrder);
              toast.success(
                "Order placed! Payment submitted for verification.",
              );
              onClose();
            }}
            className="w-full py-3 font-display font-bold text-sm uppercase tracking-widest btn-gold rounded-lg mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & Place Order
          </button>
          <button
            type="button"
            onClick={() => {
              setUpiPaymentStep("select");
              setUpiPendingOrder(null);
            }}
            className="w-full py-2 text-xs text-muted-foreground font-display hover:text-brand-gold transition-colors"
          >
            ← Go Back / Retry Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
      <div className="relative z-10 bg-card w-full sm:max-w-lg h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl shadow-2xl animate-fade-in-up border border-brand-gold/30">
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
              Delivery Address
            </p>
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  toast.error("Geolocation not supported by your browser");
                  return;
                }
                setLocationStatus("loading");
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    setLocationCoords(coords);
                    setLocationLatLng({ lat: latitude, lng: longitude });
                    try {
                      const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { "Accept-Language": "en" } },
                      );
                      const data = await res.json();
                      const addr = data.address || {};
                      setForm((f) => ({
                        ...f,
                        address1:
                          [addr.road, addr.suburb, addr.neighbourhood]
                            .filter(Boolean)
                            .join(", ") || f.address1,
                        address2:
                          [addr.village, addr.county]
                            .filter(Boolean)
                            .join(", ") || f.address2,
                        city: addr.city || addr.town || addr.district || f.city,
                        state: addr.state || f.state,
                        pincode: addr.postcode || f.pincode,
                      }));
                      setLocationStatus("success");
                      toast.success("Location detected and address filled!");
                    } catch {
                      setLocationStatus("success");
                      toast.success(`Location saved: ${coords}`);
                    }
                  },
                  () => {
                    setLocationStatus("error");
                    toast.error(
                      "Unable to get location. Please allow location access.",
                    );
                  },
                  { timeout: 10000 },
                );
              }}
              data-ocid="checkout.use_location_button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-display uppercase tracking-wide transition-colors border ${locationStatus === "success" ? "border-green-500 text-green-400 bg-green-500/10" : locationStatus === "loading" ? "border-brand-gold/50 text-brand-gold/70 cursor-wait" : "border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10"}`}
              disabled={locationStatus === "loading"}
            >
              {locationStatus === "loading" ? (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-brand-gold/50 border-t-brand-gold rounded-full" />
              ) : locationStatus === "success" ? (
                <Navigation size={12} className="text-green-400" />
              ) : (
                <MapPin size={12} />
              )}
              {locationStatus === "loading"
                ? "Detecting…"
                : locationStatus === "success"
                  ? "Location Saved"
                  : "Use My Location"}
            </button>
          </div>
          {locationLatLng && (
            <div className="mb-3 rounded-lg overflow-hidden border border-green-500/30">
              <p className="text-xs text-green-400 px-2 py-1 flex items-center gap-1 bg-green-500/10">
                <MapPin size={10} /> GPS: {locationCoords}
              </p>
              <iframe
                title="Location Preview"
                width="100%"
                height="180"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${locationLatLng.lng - 0.005},${locationLatLng.lat - 0.005},${locationLatLng.lng + 0.005},${locationLatLng.lat + 0.005}&layer=mapnik&marker=${locationLatLng.lat},${locationLatLng.lng}`}
              />
            </div>
          )}
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

          {/* UPI App Selector */}
          {(() => {
            const selPm = enabledPayments.find((p) => p.id === selectedPayment);
            if (!selPm || selPm.type !== "upi") return null;
            return (
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
                  Choose UPI App
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs font-display transition-all text-center min-h-[80px] ${selectedUpiApp === app.id ? "border-brand-gold bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/40" : "border-border text-foreground hover:border-brand-gold/50"}`}
                    >
                      {app.logo ? (
                        <img
                          src={app.logo}
                          alt={app.label}
                          className="w-9 h-9 rounded-lg object-contain flex-shrink-0"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold text-lg font-bold">
                          ₹
                        </span>
                      )}
                      <span className="leading-tight">{app.label}</span>
                    </button>
                  ))}
                </div>
                {selPm.details && (
                  <p className="text-xs text-muted-foreground mt-2 font-display">
                    UPI ID:{" "}
                    <span className="text-brand-gold font-bold">
                      {selPm.details}
                    </span>
                  </p>
                )}
              </div>
            );
          })()}

          {/* Return Policy */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-1">
            <RotateCcw size={12} className="text-brand-gold flex-shrink-0" />
            <span>
              <span className="text-brand-gold font-bold">
                7-Day Return Policy
              </span>{" "}
              — Not satisfied? Return within 7 days of delivery for a full
              refund.
            </span>
          </div>

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

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePlaceOrder}
              data-ocid="checkout.submit_button"
              className="w-full py-4 font-display font-bold text-base uppercase tracking-widest btn-gold rounded-lg shadow-gold-glow flex items-center justify-center gap-2"
            >
              <Instagram size={18} /> Order via Instagram
            </button>
            <button
              type="button"
              onClick={handleDirectOrder}
              data-ocid="checkout.submit_button"
              className="w-full py-4 font-display font-bold text-base uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)",
                color: "#0a0a0a",
              }}
            >
              <PackageCheck size={18} /> Place Direct Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GOOGLE LOGIN MODAL ─── */
const LS_USERS_KEY = "rocher_users";

interface RegisteredUser {
  email: string;
  name: string;
  phone?: string;
  passwordHash?: string;
  registeredAt?: string;
  blocked?: boolean;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function loadUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(LS_USERS_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: RegisteredUser[]) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

function upsertUser(u: RegisteredUser) {
  const users = loadUsers();
  const idx = users.findIndex(
    (x) => x.email === u.email || (u.phone && x.phone === u.phone),
  );
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...u };
  } else {
    users.push({
      ...u,
      registeredAt: u.registeredAt || new Date().toISOString(),
    });
  }
  saveUsers(users);
}

function GoogleLoginModal({
  onSuccess,
  onClose,
}: { onSuccess: (user: GoogleUser) => void; onClose: () => void }) {
  type TabType = "google" | "phone" | "password";
  const [tab, setTab] = useState<TabType>("google");
  const [rememberMe, setRememberMe] = useState(true);

  /* Google tab */
  const [gEmail, setGEmail] = useState("");
  const [gName, setGName] = useState("");
  const [gStep, setGStep] = useState<"email" | "name">("email");
  const [gErr, setGErr] = useState("");

  /* Phone tab */
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [otpName, setOtpName] = useState("");
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp" | "name">("phone");
  const [phoneErr, setPhoneErr] = useState("");

  /* Password tab */
  const [pwEmail, setPwEmail] = useState("");
  const [pwName, setPwName] = useState("");
  const [pwPass, setPwPass] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMode, setPwMode] = useState<"login" | "register">("login");
  const [pwErr, setPwErr] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const finishLogin = (user: GoogleUser) => {
    const allUsers = loadUsers();
    const matched = allUsers.find(
      (u) =>
        u.email === user.email ||
        (u.phone &&
          user.email.startsWith("ph_") &&
          user.email.includes(u.phone)),
    );
    if (matched?.blocked) {
      toast.error("Your account has been blocked. Contact support.");
      return;
    }
    if (rememberMe)
      localStorage.setItem(LS_GOOGLE_USER_KEY, JSON.stringify(user));
    onSuccess(user);
  };

  /* Google submit */
  const handleGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    if (gStep === "email") {
      if (!gEmail.includes("@")) {
        setGErr("Enter a valid email address");
        return;
      }
      setGErr("");
      setGStep("name");
    } else {
      if (!gName.trim()) {
        setGErr("Enter your name");
        return;
      }
      const user: GoogleUser = {
        email: gEmail.trim().toLowerCase(),
        name: gName.trim(),
      };
      upsertUser({ email: user.email, name: user.name });
      logActivity(user.email, "Login", "Logged in via Google");
      finishLogin(user);
    }
  };

  /* Phone submit */
  const handlePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneStep === "phone") {
      if (phone.replace(/\D/g, "").length < 10) {
        setPhoneErr("Enter a valid 10-digit number");
        return;
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(code);
      setPhoneErr("");
      setPhoneStep("otp");
      toast.info(`Your OTP: ${code}`, {
        duration: 30000,
        description: "Use this code to verify your phone.",
      });
    } else if (phoneStep === "otp") {
      if (otp !== sentOtp) {
        setPhoneErr("Incorrect OTP. Try again.");
        return;
      }
      const existing = loadUsers().find(
        (u) => u.phone === phone.replace(/\s/g, ""),
      );
      if (existing) {
        const user: GoogleUser = { email: existing.email, name: existing.name };
        logActivity(user.email, "Login", "Logged in via Phone OTP");
        finishLogin(user);
      } else {
        setPhoneErr("");
        setPhoneStep("name");
      }
    } else {
      if (!otpName.trim()) {
        setPhoneErr("Enter your name");
        return;
      }
      const fakeEmail = `ph_${phone.replace(/\D/g, "")}@phone.local`;
      const user: GoogleUser = { email: fakeEmail, name: otpName.trim() };
      upsertUser({
        email: fakeEmail,
        name: otpName.trim(),
        phone: phone.replace(/\s/g, ""),
      });
      logActivity(user.email, "Login", "Logged in via Phone OTP (new user)");
      finishLogin(user);
    }
  };

  /* Password submit */
  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwEmail.includes("@")) {
      setPwErr("Enter a valid email");
      return;
    }
    if (pwPass.length < 6) {
      setPwErr("Password must be at least 6 characters");
      return;
    }
    const users = loadUsers();
    if (pwMode === "register") {
      if (!pwName.trim()) {
        setPwErr("Enter your name");
        return;
      }
      if (pwPass !== pwConfirm) {
        setPwErr("Passwords do not match");
        return;
      }
      if (users.find((u) => u.email === pwEmail.trim().toLowerCase())) {
        setPwErr("Account already exists. Sign in instead.");
        return;
      }
      const newUser: RegisteredUser = {
        email: pwEmail.trim().toLowerCase(),
        name: pwName.trim(),
        passwordHash: simpleHash(pwPass),
      };
      upsertUser(newUser);
      const gu: GoogleUser = { email: newUser.email, name: newUser.name };
      logActivity(
        gu.email,
        "Register",
        "New account created with email/password",
      );
      finishLogin(gu);
    } else {
      const found = users.find((u) => u.email === pwEmail.trim().toLowerCase());
      if (!found) {
        setPwErr("No account found. Please sign up first.");
        setPwMode("register");
        return;
      }
      if (found.passwordHash !== simpleHash(pwPass)) {
        setPwErr("Incorrect password");
        return;
      }
      const gu: GoogleUser = { email: found.email, name: found.name };
      logActivity(gu.email, "Login", "Logged in via Email/Password");
      finishLogin(gu);
    }
  };

  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-amber-500 transition-colors bg-white placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onKeyDown={(ev) => ev.key === "Enter" && onClose()}
      />
      <div className="relative z-10 bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={LOGO} alt="ROCHER" className="w-7 h-7 object-contain" />
              <span className="font-display font-bold text-gray-900 tracking-widest text-sm">
                ROCHER
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <h2 className="text-gray-800 text-lg font-bold mt-4">
            Sign in to your account
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Track orders, save preferences, and more.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {(["google", "phone", "password"] as TabType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 ${tab === t ? "border-amber-600 text-amber-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {t === "google"
                ? "Google"
                : t === "phone"
                  ? "Phone OTP"
                  : "Password"}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-5 min-h-[240px]">
          {/* Google Tab */}
          {tab === "google" && (
            <form onSubmit={handleGoogle} className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg,#4285F4 0%,#34A853 50%,#EA4335 100%)",
                  }}
                >
                  G
                </div>
                <div>
                  <p className="text-gray-700 text-xs font-semibold">
                    Continue with Google
                  </p>
                  <p className="text-gray-400 text-xs">
                    {gStep === "email"
                      ? "Enter your Gmail address"
                      : "Enter your display name"}
                  </p>
                </div>
              </div>
              {gStep === "email" ? (
                <input
                  type="email"
                  value={gEmail}
                  onChange={(e) => {
                    setGEmail(e.target.value);
                    setGErr("");
                  }}
                  className={inputCls}
                  placeholder="yourname@gmail.com"
                />
              ) : (
                <input
                  type="text"
                  value={gName}
                  onChange={(e) => {
                    setGName(e.target.value);
                    setGErr("");
                  }}
                  className={inputCls}
                  placeholder="Your full name"
                />
              )}
              {gErr && <p className="text-xs text-red-500">{gErr}</p>}
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-amber-600 w-3.5 h-3.5"
                />
                Stay signed in on this browser
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "#4285F4" }}
              >
                {gStep === "email" ? "Next" : "Sign In"}
              </button>
            </form>
          )}

          {/* Phone OTP Tab */}
          {tab === "phone" && (
            <form onSubmit={handlePhone} className="flex flex-col gap-3">
              {phoneStep === "phone" && (
                <>
                  <p className="text-xs text-gray-500">
                    Enter your mobile number. An OTP will appear as a
                    notification.
                  </p>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <span className="px-3 py-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneErr("");
                      }}
                      className="flex-1 px-4 py-3 text-gray-800 text-sm focus:outline-none bg-white placeholder:text-gray-400"
                      placeholder="10-digit mobile number"
                      maxLength={15}
                    />
                  </div>
                </>
              )}
              {phoneStep === "otp" && (
                <>
                  <p className="text-xs text-gray-500">
                    OTP sent to{" "}
                    <span className="font-semibold text-gray-700">{phone}</span>
                    . Check the notification at the top.
                  </p>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));
                      setPhoneErr("");
                    }}
                    className={inputCls}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const c = Math.floor(
                        100000 + Math.random() * 900000,
                      ).toString();
                      setSentOtp(c);
                      toast.info(`New OTP: ${c}`, { duration: 30000 });
                    }}
                    className="text-xs text-amber-700 hover:underline text-left w-fit"
                  >
                    Resend OTP
                  </button>
                </>
              )}
              {phoneStep === "name" && (
                <>
                  <p className="text-xs text-gray-500">
                    Phone verified! Complete your profile.
                  </p>
                  <input
                    type="text"
                    value={otpName}
                    onChange={(e) => {
                      setOtpName(e.target.value);
                      setPhoneErr("");
                    }}
                    className={inputCls}
                    placeholder="Your full name"
                  />
                </>
              )}
              {phoneErr && <p className="text-xs text-red-500">{phoneErr}</p>}
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-amber-600 w-3.5 h-3.5"
                />
                Stay signed in on this browser
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "oklch(0.55 0.15 50)" }}
              >
                {phoneStep === "phone"
                  ? "Send OTP"
                  : phoneStep === "otp"
                    ? "Verify OTP"
                    : "Complete Sign In"}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {tab === "password" && (
            <form onSubmit={handlePassword} className="flex flex-col gap-3">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setPwMode("login");
                    setPwErr("");
                  }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${pwMode === "login" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPwMode("register");
                    setPwErr("");
                  }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${pwMode === "register" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Create Account
                </button>
              </div>
              <input
                type="email"
                value={pwEmail}
                onChange={(e) => {
                  setPwEmail(e.target.value);
                  setPwErr("");
                }}
                className={inputCls}
                placeholder="Email address"
              />
              {pwMode === "register" && (
                <input
                  type="text"
                  value={pwName}
                  onChange={(e) => {
                    setPwName(e.target.value);
                    setPwErr("");
                  }}
                  className={inputCls}
                  placeholder="Your full name"
                />
              )}
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pwPass}
                  onChange={(e) => {
                    setPwPass(e.target.value);
                    setPwErr("");
                  }}
                  className={`${inputCls} pr-16`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {pwMode === "register" && (
                <input
                  type={showPw ? "text" : "password"}
                  value={pwConfirm}
                  onChange={(e) => {
                    setPwConfirm(e.target.value);
                    setPwErr("");
                  }}
                  className={inputCls}
                  placeholder="Confirm password"
                />
              )}
              {pwErr && <p className="text-xs text-red-500">{pwErr}</p>}
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-amber-600 w-3.5 h-3.5"
                />
                Stay signed in on this browser
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "oklch(0.18 0.01 60)" }}
              >
                {pwMode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── TRACK ORDER MODAL ─── */
function TrackOrderModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [foundOrders, setFoundOrders] = useState<Order[]>([]);

  const TRACKING_STEPS: { key: Order["trackingStatus"]; label: string }[] = [
    { key: "placed", label: "Order Placed" },
    { key: "packed", label: "Packed" },
    { key: "shipped", label: "Shipped" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];

  const stepIndex = (ts: Order["trackingStatus"]) =>
    TRACKING_STEPS.findIndex((s) => s.key === ts);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const all = loadOrders();
    const results = all.filter(
      (o) => o.phone.replace(/\s/g, "") === phone.replace(/\s/g, ""),
    );
    setFoundOrders(results);
    setSearched(true);
  };

  const handleCancel = (orderId: string) => {
    customerCancelOrder(orderId, phone);
    setFoundOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "cancelled" as const } : o,
      ),
    );
    toast.success("Order cancellation request submitted.");
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close"
        onKeyDown={(e) => e.key === "Enter" && onClose()}
      />
      <div className="relative z-10 bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-brand-gold" />
            <h2 className="font-display text-lg font-bold text-foreground">
              Track Your Order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-brand-gold transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-brand-gold transition-colors"
              placeholder="Enter your phone number"
            />
            <button
              type="submit"
              className="px-5 py-2.5 btn-gold font-display font-bold text-xs uppercase tracking-widest rounded-lg"
            >
              Search
            </button>
          </form>

          {searched && foundOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-display text-sm">
              No orders found for this phone number.
            </div>
          )}

          {foundOrders.map((order) => {
            const currentStep =
              order.status === "cancelled"
                ? -1
                : stepIndex(order.trackingStatus || "placed");
            return (
              <div
                key={order.id}
                className="bg-background/60 border border-border rounded-xl p-5 mb-4"
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="font-display font-bold text-foreground">
                      {order.product}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Size: {order.size} · ₹{order.price} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Order #{order.id.slice(-8)}
                    </p>
                  </div>
                  {order.status === "cancelled" ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-900/30 text-red-400">
                      Cancelled
                    </span>
                  ) : order.trackingStatus === "delivered" ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-900/30 text-green-400">
                      Delivered
                    </span>
                  ) : (
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        background: "oklch(0.85 0.12 85 / 0.1)",
                        color: "oklch(0.85 0.12 85)",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>

                {order.status !== "cancelled" && (
                  <div className="mt-4 mb-3">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 right-0 top-4 h-0.5 bg-border z-0" />
                      <div
                        className="absolute left-0 top-4 h-0.5 z-0 transition-all duration-500"
                        style={{
                          background: "oklch(0.85 0.12 85)",
                          width:
                            currentStep <= 0
                              ? "0%"
                              : `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%`,
                        }}
                      />
                      {TRACKING_STEPS.map((step, i) => {
                        const done = i <= currentStep;
                        return (
                          <div
                            key={step.key}
                            className="flex flex-col items-center z-10 flex-1"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                              style={
                                done
                                  ? {
                                      background: "oklch(0.85 0.12 85)",
                                      borderColor: "oklch(0.85 0.12 85)",
                                      color: "oklch(0.09 0.008 60)",
                                    }
                                  : {
                                      background: "oklch(0.12 0.01 60)",
                                      borderColor: "oklch(0.3 0.02 60)",
                                      color: "oklch(0.5 0.02 60)",
                                    }
                              }
                            >
                              {done ? <Check size={14} /> : i + 1}
                            </div>
                            <p
                              className="text-center mt-1.5 leading-tight"
                              style={{
                                fontSize: "9px",
                                color: done
                                  ? "oklch(0.85 0.12 85)"
                                  : "oklch(0.5 0.02 60)",
                                maxWidth: "52px",
                              }}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {order.status === "placed" &&
                  (order.trackingStatus === "placed" ||
                    order.trackingStatus === "packed") && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order.id)}
                      className="mt-3 w-full py-2 font-display font-bold text-xs uppercase tracking-widest rounded-lg border border-red-500/40 text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}

                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <RotateCcw size={10} className="text-brand-gold" />
                    7-Day Return Policy applies — Contact us on Instagram to
                    return.
                  </p>
                </div>
              </div>
            );
          })}
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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

/* ─── IMAGE COMPRESS HELPER ─── */
function compressImage(
  file: File,
  maxPx = 600,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxPx || h > maxPx) {
          if (w > h) {
            h = Math.round((h * maxPx) / w);
            w = maxPx;
          } else {
            w = Math.round((w * maxPx) / h);
            h = maxPx;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file)
      .then((dataUrl) => {
        onChange(dataUrl);
        setValid(true);
      })
      .catch(() => {
        // fallback to raw FileReader if canvas fails
        const reader = new FileReader();
        reader.onload = (ev) => {
          onChange(ev.target?.result as string);
          setValid(true);
        };
        reader.readAsDataURL(file);
      });
    e.target.value = "";
  };

  const isDataUrl = value.startsWith("data:");
  const showPreview = (valid || isDataUrl) && !!value;

  return (
    <div className="flex items-center gap-2">
      {showPreview ? (
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
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="Upload image from device"
        className="flex-shrink-0 px-2 py-2 rounded-lg border border-border text-muted-foreground hover:border-brand-gold hover:text-brand-gold transition-colors text-xs"
      >
        📁
      </button>
      <input
        type="url"
        value={isDataUrl ? "(uploaded from device)" : value}
        onChange={(e) => {
          if (e.target.value !== "(uploaded from device)") {
            onChange(e.target.value);
            setValid(false);
          }
        }}
        onFocus={(_e) => {
          if (isDataUrl) {
            onChange("");
            setValid(false);
          }
        }}
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
  instagramId: initialInstaId,
  customSections: initialSections,
  founderData: initialFounder,
  seoTitle: initialSeoTitle,
  actor,
  onClose,
}: {
  products: Product[];
  saleSettings: SaleSettings;
  promoCodes: PromoCode[];
  paymentMethods: PaymentMethod[];
  customBanner: string;
  customBg: string;
  instagramId: string;
  customSections: ProductSection[];
  founderData: FounderData;
  seoTitle: string;
  actor: backendInterface | null;
  onClose: (
    updated?: Product[],
    newSale?: SaleSettings,
    newPromos?: PromoCode[],
    newPayments?: PaymentMethod[],
    newBanner?: string,
    newBg?: string,
    newInstaId?: string,
    newSections?: ProductSection[],
    newFounder?: FounderData,
    newSeoTitle?: string,
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
  const [instaId, setInstaId] = useState<string>(initialInstaId);
  const [sections, setSections] = useState<ProductSection[]>(
    initialSections || [],
  );
  const [sectionAddOpen, setSectionAddOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionSubtitle, setNewSectionSubtitle] = useState("");
  const [bgColor, setBgColor] = useState<string>(initialBg || "#0c0b09");
  const [founderNote, setFounderNote] = useState<string>(initialFounder.note);
  const [founderName, setFounderName] = useState<string>(initialFounder.name);
  const [founderTitle, setFounderTitle] = useState<string>(
    initialFounder.title,
  );
  const [founderPhoto, setFounderPhoto] = useState<string>(
    initialFounder.photo,
  );
  const [seoTitle, setSeoTitle] = useState<string>(initialSeoTitle);
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
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [activeTab, setActiveTab] = useState<
    | "products"
    | "sections"
    | "sale"
    | "payments"
    | "promos"
    | "appearance"
    | "orders"
    | "activity"
    | "users"
  >("products");

  const refreshOrders = () => setOrders(loadOrders());

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId);
    refreshOrders();
    toast.success("Order marked as cancelled");
  };

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
    const trimmedInsta = instaId.trim().replace(/^@/, "") || "official_rocher";
    localStorage.setItem(LS_INSTA_KEY, trimmedInsta);
    localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(sections));
    const trimmedSeoTitle =
      seoTitle.trim() || "ROCHER | Premium Clothing Brand";
    localStorage.setItem(LS_SEO_TITLE_KEY, trimmedSeoTitle);
    document.title = trimmedSeoTitle;
    const metaTitleEl = document.querySelector('meta[property="og:title"]');
    if (metaTitleEl) metaTitleEl.setAttribute("content", trimmedSeoTitle);
    const twitterTitleEl = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleEl) twitterTitleEl.setAttribute("content", trimmedSeoTitle);

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

    // Publish to canister so all visitors see changes
    if (actor) {
      const canisterData = {
        products: allProducts,
        saleSettings: sale,
        promoCodes: promos,
        paymentMethods: payments,
        bannerImage: bannerPreview,
        bgColor: bgColor !== "#0c0b09" ? bgColor : "",
        instagramId: instaId.trim().replace(/^@/, "") || "official_rocher",
        customSections: sections,
        founderData: {
          photo: founderPhoto,
          note: founderNote,
          name: founderName,
          title: founderTitle,
        },
        seoTitle: seoTitle.trim() || "ROCHER | Premium Clothing Brand",
      };
      actor
        .setValue("siteData", JSON.stringify(canisterData), ADMIN_PASSWORD)
        .then((ok) => {
          if (ok) {
            toast.success("Changes published to all visitors ✓");
          } else {
            toast.error("Saved locally, but publish failed. Check password.");
          }
        })
        .catch(() => {
          toast.error(
            "Saved locally. Network error — changes may not be visible to others.",
          );
        });
    } else {
      toast.success("Changes saved successfully");
    }

    const newFounder: FounderData = {
      photo: founderPhoto,
      note: founderNote,
      name: founderName,
      title: founderTitle,
    };
    saveFounderData(newFounder);

    onClose(
      allProducts,
      sale,
      promos,
      payments,
      bannerPreview,
      bgColor !== "#0c0b09" ? bgColor : "",
      instaId.trim().replace(/^@/, "") || "official_rocher",
      sections,
      newFounder,
      seoTitle.trim() || "ROCHER | Premium Clothing Brand",
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
    compressImage(file, 1200, 0.8)
      .then((dataUrl) => {
        setBannerPreview(dataUrl);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setBannerPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
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

      {/* Tab Navigation */}
      <div
        className="border-b border-border sticky top-[73px] z-10 px-6"
        style={{
          backgroundColor: "oklch(0.09 0.008 60 / 0.97)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
          {(
            [
              { key: "products", label: "Products", icon: "📦" },
              { key: "sections", label: "Sections", icon: "📂" },
              { key: "orders", label: "Orders", icon: "🧾" },
              { key: "activity", label: "Activity Log", icon: "📋" },
              { key: "users", label: "Registered Users", icon: "👥" },
              { key: "sale", label: "Sale", icon: "🔥" },
              { key: "payments", label: "Payments", icon: "💳" },
              { key: "promos", label: "Promos", icon: "🎟️" },
              { key: "appearance", label: "Appearance", icon: "🎨" },
            ] as { key: typeof activeTab; label: string; icon: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "orders") refreshOrders();
              }}
              className={`px-4 py-3 font-display font-bold text-xs uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-brand-gold text-brand-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* ── SALE SETTINGS ── */}
        {activeTab === "sale" && (
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
        )}

        {/* ── SITE APPEARANCE ── */}
        {activeTab === "appearance" && (
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
            {/* SEO Title */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4 mt-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Google Search Title
              </p>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="ROCHER | Premium Clothing Brand"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
              />
              <p className="text-xs text-muted-foreground">
                This is the title shown when someone finds your site on Google
                or shares the link. Keep it under 60 characters for best
                results.
              </p>
            </div>

            {/* Instagram ID */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Instagram Username
              </p>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-display text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={instaId}
                  onChange={(e) => setInstaId(e.target.value.replace(/^@/, ""))}
                  placeholder="official_rocher"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This updates all Instagram links and Order via Instagram buttons
                sitewide.
              </p>
            </div>

            {/* Founder's Note */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-5 mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Founder&#39;s Note
              </p>

              {/* Founder Photo */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Founder Photo (optional)
                </p>
                <div className="flex items-start gap-4">
                  {founderPhoto ? (
                    <img
                      src={founderPhoto}
                      alt="Founder"
                      className="w-20 h-20 rounded-full object-cover border-2 flex-shrink-0"
                      style={{ borderColor: "oklch(0.85 0.12 85 / 0.4)" }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-dashed"
                      style={{
                        borderColor: "oklch(0.85 0.12 85 / 0.3)",
                        color: "oklch(0.5 0.02 60)",
                      }}
                    >
                      <span className="text-xs text-center leading-tight px-1">
                        No photo
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 btn-outline-gold font-display font-bold text-xs rounded-lg cursor-pointer w-fit">
                      <Image size={14} /> Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const canvas = document.createElement("canvas");
                          const img = new window.Image();
                          img.onload = () => {
                            const MAX = 400;
                            let w = img.width;
                            let h = img.height;
                            if (w > MAX || h > MAX) {
                              if (w > h) {
                                h = Math.round((h * MAX) / w);
                                w = MAX;
                              } else {
                                w = Math.round((w * MAX) / h);
                                h = MAX;
                              }
                            }
                            canvas.width = w;
                            canvas.height = h;
                            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
                            setFounderPhoto(
                              canvas.toDataURL("image/jpeg", 0.7),
                            );
                          };
                          img.src = URL.createObjectURL(file);
                        }}
                      />
                    </label>
                    {founderPhoto && (
                      <button
                        type="button"
                        onClick={() => setFounderPhoto("")}
                        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors w-fit"
                      >
                        <X size={12} /> Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Note Text */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Note Text (use blank lines to separate paragraphs)
                </p>
                <textarea
                  rows={6}
                  value={founderNote}
                  onChange={(e) => setFounderNote(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors resize-none"
                  placeholder="Write the founder's note here..."
                />
              </div>

              {/* Founder Name & Title */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Founder Name
                  </p>
                  <input
                    type="text"
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    placeholder="Tanish"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Title / Role
                  </p>
                  <input
                    type="text"
                    value={founderTitle}
                    onChange={(e) => setFounderTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    placeholder="Founder, ROCHER"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── PAYMENT METHODS ── */}
        {activeTab === "payments" && (
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
                        setPayments((prev) =>
                          prev.filter((p) => p.id !== pm.id),
                        )
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
        )}

        {/* ── PROMO CODES ── */}
        {activeTab === "promos" && (
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
        )}

        {/* ── ADD NEW PRODUCT ── */}
        {activeTab === "products" && (
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
                        setDraft((d) => ({
                          ...d,
                          bestSeller: e.target.checked,
                        }))
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
        )}

        {/* ── PRODUCTS LIST ── */}
        {activeTab === "products" && (
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
        )}
        {activeTab === "products" && (
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
        )}

        {/* ── SECTIONS ── */}
        {activeTab === "sections" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-brand-gold text-base">📂</span>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Product Sections
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSectionAddOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-xs rounded-lg"
              >
                {sectionAddOpen ? (
                  <>
                    <X size={12} /> Collapse
                  </>
                ) : (
                  <>
                    <Plus size={12} /> New Section
                  </>
                )}
              </button>
            </div>

            {/* Add new section form */}
            {sectionAddOpen && (
              <div className="bg-card border border-border rounded-xl p-5 shadow-card mb-6 space-y-4">
                <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-widest">
                  New Section
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="new-sec-title"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Section Title *
                    </label>
                    <input
                      id="new-sec-title"
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="e.g. Best Sellers"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-sec-subtitle"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5"
                    >
                      Subtitle (optional)
                    </label>
                    <input
                      id="new-sec-subtitle"
                      type="text"
                      value={newSectionSubtitle}
                      onChange={(e) => setNewSectionSubtitle(e.target.value)}
                      placeholder="e.g. Our top picks"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newSectionTitle.trim()) {
                      toast.error("Section title is required.");
                      return;
                    }
                    setSections((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        title: newSectionTitle.trim(),
                        subtitle: newSectionSubtitle.trim(),
                        productIds: [],
                      },
                    ]);
                    setNewSectionTitle("");
                    setNewSectionSubtitle("");
                    setSectionAddOpen(false);
                    toast.success("Section created! Remember to Save Changes.");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 btn-gold font-display font-bold text-xs rounded-lg"
                >
                  <Plus size={13} /> Add Section
                </button>
              </div>
            )}

            {sections.length === 0 && (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground font-display text-sm">
                No custom sections yet. Create one above to group products your
                way.
              </div>
            )}

            <div className="flex flex-col gap-6">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="bg-card border border-border rounded-xl p-6 shadow-card"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) =>
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === sec.id
                                ? { ...s, title: e.target.value }
                                : s,
                            ),
                          )
                        }
                        className="w-full font-display font-bold text-lg bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                        placeholder="Section title"
                      />
                      <input
                        type="text"
                        value={sec.subtitle}
                        onChange={(e) =>
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === sec.id
                                ? { ...s, subtitle: e.target.value }
                                : s,
                            ),
                          )
                        }
                        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-muted-foreground focus:outline-none focus:border-brand-gold transition-colors"
                        placeholder="Subtitle (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete section "${sec.title}"?`))
                          setSections((prev) =>
                            prev.filter((s) => s.id !== sec.id),
                          );
                      }}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors"
                      style={{
                        color: "oklch(0.65 0.2 25)",
                        borderColor: "oklch(0.65 0.2 25 / 0.4)",
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Products in this section ({sec.productIds.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {editData.map((p) => {
                      const selected = sec.productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === sec.id
                                  ? {
                                      ...s,
                                      productIds: selected
                                        ? s.productIds.filter(
                                            (id) => id !== p.id,
                                          )
                                        : [...s.productIds, p.id],
                                    }
                                  : s,
                              ),
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-display font-bold rounded-full border transition-all ${selected ? "btn-gold border-transparent" : "btn-outline-gold bg-background/60"}`}
                        >
                          {selected ? "✓ " : "+ "}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 btn-gold font-display font-bold text-sm rounded-lg"
              >
                <Save size={15} /> Save All Changes
              </button>
            </div>
          </section>
        )}

        {/* ── ORDERS ── */}
        {activeTab === "orders" && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <PackageCheck size={16} className="text-brand-gold" />
              <h2 className="font-display text-xl font-bold text-foreground">
                Customer Orders
              </h2>
            </div>
            {orders.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground font-display">
                No orders yet. Orders placed by customers will appear here.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card border border-border rounded-xl p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-foreground text-base">
                            {order.product}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-widest ${order.status === "placed" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}
                          >
                            {order.status === "placed"
                              ? "✅ Placed"
                              : "❌ Cancelled"}
                          </span>
                          {order.status === "placed" &&
                            order.trackingStatus &&
                            order.trackingStatus !== "placed" && (
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-widest"
                                style={{
                                  background: "oklch(0.85 0.12 85 / 0.1)",
                                  color: "oklch(0.85 0.12 85)",
                                }}
                              >
                                {order.trackingStatus.replace(/_/g, " ")}
                              </span>
                            )}
                          {order.viaInstagram && (
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-900/40 text-purple-300">
                              📸 Instagram
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Size: <b className="text-foreground">{order.size}</b>{" "}
                          · Qty: <b className="text-foreground">{order.qty}</b>{" "}
                          · <b className="text-brand-gold">₹{order.price}</b>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Payment: {order.paymentMethod}
                          {order.promoCode
                            ? ` · Promo: ${order.promoCode}`
                            : ""}
                        </p>
                        {order.upiTransactionId && (
                          <div
                            className="mt-2 p-3 rounded-lg border"
                            style={{
                              borderColor:
                                order.upiPaymentStatus === "verified"
                                  ? "oklch(0.7 0.15 145 / 0.5)"
                                  : "oklch(0.85 0.12 85 / 0.4)",
                              background:
                                order.upiPaymentStatus === "verified"
                                  ? "oklch(0.7 0.15 145 / 0.08)"
                                  : "oklch(0.85 0.12 85 / 0.06)",
                            }}
                          >
                            <p
                              className="text-xs font-bold uppercase tracking-widest mb-1"
                              style={{
                                color:
                                  order.upiPaymentStatus === "verified"
                                    ? "oklch(0.7 0.15 145)"
                                    : "oklch(0.85 0.12 85)",
                              }}
                            >
                              {order.upiPaymentStatus === "verified"
                                ? "✅ UPI Payment Verified"
                                : "⏳ UPI Payment Submitted"}
                            </p>
                            <p className="text-xs text-muted-foreground font-display">
                              Transaction ID:{" "}
                              <span className="text-foreground font-bold select-all">
                                {order.upiTransactionId}
                              </span>
                            </p>
                            {order.upiPaymentStatus !== "verified" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const orders = loadOrders().map((o) =>
                                    o.id === order.id
                                      ? {
                                          ...o,
                                          upiPaymentStatus: "verified" as const,
                                        }
                                      : o,
                                  );
                                  localStorage.setItem(
                                    "rocher_orders",
                                    JSON.stringify(orders),
                                  );
                                  logActivity(
                                    "Admin",
                                    "UPI Payment Verified",
                                    `Order ${order.id.slice(-6)} — Txn: ${order.upiTransactionId}`,
                                  );
                                  toast.success(
                                    "UPI payment marked as verified",
                                  );
                                  window.dispatchEvent(new Event("storage"));
                                }}
                                className="mt-2 px-3 py-1 text-xs font-bold font-display rounded-lg border border-green-500/50 text-green-400 hover:bg-green-500/10 transition-colors"
                              >
                                Mark as Verified
                              </button>
                            )}
                          </div>
                        )}
                        <div className="mt-2 p-3 bg-background/60 rounded-lg border border-border">
                          <p className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-1">
                            Customer Details
                          </p>
                          <p className="text-sm text-foreground font-bold">
                            {order.name} · {order.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.address}
                          </p>
                          {order.locationCoords && (
                            <a
                              href={`https://www.google.com/maps?q=${order.locationCoords}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-xs text-brand-gold hover:underline"
                            >
                              <MapPin size={10} /> GPS: {order.locationCoords} —
                              View on Map
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {order.status === "placed" && (
                        <div className="flex flex-col gap-2 items-end">
                          <select
                            value={order.trackingStatus || "placed"}
                            onChange={(e) => {
                              updateOrderTrackingStatus(
                                order.id,
                                e.target.value as Order["trackingStatus"],
                              );
                              refreshOrders();
                            }}
                            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-display focus:outline-none focus:border-brand-gold"
                          >
                            <option value="placed">Order Placed</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">
                              Out for Delivery
                            </option>
                            <option value="delivered">Delivered</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-widest border border-red-500/40 text-red-400 hover:bg-red-900/20 transition-colors whitespace-nowrap"
                          >
                            <PackageX size={14} /> Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "activity" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-brand-gold" />
                <h2 className="font-display text-xl font-bold text-foreground">
                  Activity Log
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(LS_ACTIVITY_KEY);
                  toast.success("Activity log cleared");
                }}
                className="flex items-center gap-2 px-4 py-2 btn-outline-gold font-display font-bold text-xs rounded-lg"
              >
                <Trash2 size={12} /> Clear Log
              </button>
            </div>
            <ActivityLogPanel />
          </section>
        )}
        {activeTab === "users" && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ fontSize: 18 }}>👥</span>
              <h2 className="font-display text-xl font-bold text-foreground">
                Registered Users
              </h2>
            </div>
            <RegisteredUsersPanel />
          </section>
        )}
      </div>
    </div>
  );
}

function RegisteredUsersPanel() {
  const [users, setUsers] = useState<RegisteredUser[]>(() => loadUsers());
  useEffect(() => {
    const interval = setInterval(() => setUsers(loadUsers()), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (email: string) => {
    if (!confirm("Delete this user permanently? This cannot be undone."))
      return;
    const updated = loadUsers().filter((u) => u.email !== email);
    saveUsers(updated);
    setUsers(updated);
    logActivity("admin", "User Deleted", `Deleted account: ${email}`);
    toast.success("User deleted");
  };

  const handleToggleBlock = (email: string) => {
    const all = loadUsers();
    const u = all.find((x) => x.email === email);
    if (!u) return;
    const nowBlocked = !u.blocked;
    const updated = all.map((x) =>
      x.email === email ? { ...x, blocked: nowBlocked } : x,
    );
    saveUsers(updated);
    setUsers(updated);
    logActivity(
      "admin",
      nowBlocked ? "User Blocked" : "User Unblocked",
      `${email} ${nowBlocked ? "blocked" : "unblocked"} by admin`,
    );
    toast.success(nowBlocked ? "User blocked" : "User unblocked");
  };

  if (users.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground font-display text-sm">
        No users have signed up yet. They will appear here after registration.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
      <p className="text-xs text-muted-foreground font-display uppercase tracking-widest mb-2">
        {users.length} registered user{users.length !== 1 ? "s" : ""}
      </p>
      {users.map((u, i) => (
        <div
          key={u.email}
          className={`bg-card border rounded-lg p-3 flex items-start gap-3 ${u.blocked ? "border-red-500/40 opacity-60" : "border-border"}`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-sm"
            style={{
              background: u.blocked
                ? "oklch(0.3 0.08 25 / 0.3)"
                : "oklch(0.85 0.12 85 / 0.15)",
              color: u.blocked ? "oklch(0.7 0.15 25)" : "oklch(0.85 0.12 85)",
            }}
          >
            {u.name ? u.name[0].toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-sm text-foreground">
                {u.name || "Unknown"}
              </span>
              {u.blocked && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-400 font-bold">
                  Blocked
                </span>
              )}
              {u.email.endsWith("@phone.local") && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "oklch(0.15 0.01 60)",
                    color: "oklch(0.75 0.12 300)",
                  }}
                >
                  Phone
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {u.email.endsWith("@phone.local")
                ? `📱 ${u.phone || "Phone user"}`
                : u.email}
            </p>
            {u.registeredAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Joined: {new Date(u.registeredAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs text-muted-foreground font-mono">
              #{i + 1}
            </span>
            <button
              type="button"
              onClick={() => handleToggleBlock(u.email)}
              className={`text-[10px] font-display font-bold px-2 py-0.5 rounded border transition-colors ${u.blocked ? "border-green-500/40 text-green-400 hover:bg-green-900/20" : "border-yellow-500/40 text-yellow-400 hover:bg-yellow-900/20"}`}
            >
              {u.blocked ? "Unblock" : "Block"}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(u.email)}
              className="text-[10px] font-display font-bold px-2 py-0.5 rounded border border-red-500/40 text-red-400 hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityLogPanel() {
  const [logs, setLogs] = useState<ActivityLog[]>(() => loadActivityLog());
  useEffect(() => {
    const interval = setInterval(() => setLogs(loadActivityLog()), 3000);
    return () => clearInterval(interval);
  }, []);
  if (logs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground font-display text-sm">
        No activity recorded yet. Actions taken by admin and customers will
        appear here.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
      {logs.map((log) => {
        const isAdmin = log.actor === "admin";
        const isLogin =
          log.action.toLowerCase().includes("login") ||
          log.action.toLowerCase().includes("logout");
        const dotColor = isLogin
          ? "oklch(0.75 0.12 300)"
          : isAdmin
            ? "oklch(0.85 0.12 85)"
            : "oklch(0.7 0.15 160)";
        return (
          <div
            key={log.id}
            className="bg-card border border-border rounded-lg p-3 flex items-start gap-3"
          >
            <div
              className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
              style={{ background: dotColor }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-xs text-foreground">
                  {log.action}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ background: "oklch(0.15 0.01 60)", color: dotColor }}
                >
                  {log.actor}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {log.details}
              </p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
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
  instagramId,
}: {
  product: Product;
  sale: SaleSettings;
  onAddToCart: (item: CartItem) => void;
  onOpenDetail: (p: Product) => void;
  onDirectBuy: (item: CheckoutItem) => void;
  index: number;
  instagramId?: string;
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
        <p className="text-xs text-muted-foreground/60 italic mb-3">
          100% Premium Cotton
        </p>
        <div
          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-4"
          style={{
            background: "oklch(0.85 0.12 85 / 0.1)",
            color: "oklch(0.85 0.12 85)",
            border: "1px solid oklch(0.85 0.12 85 / 0.3)",
          }}
        >
          <RotateCcw size={10} /> 7-Day Returns
        </div>

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
            href={`https://www.instagram.com/${instagramId}`}
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
  instagramId,
}: {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  promoCodes: PromoCode[];
  paymentMethods: PaymentMethod[];
  instagramId?: string;
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
                href={`https://www.instagram.com/${instagramId}`}
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
  const { actor } = useActor();
  const [canisterLoaded, setCanisterLoaded] = useState(false);
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
  const [instagramId, setInstagramId] = useState<string>(() =>
    loadInstagramId(),
  );
  const [customSections, setCustomSections] = useState<ProductSection[]>(() =>
    loadSections(),
  );
  const [founderData, setFounderData] = useState<FounderData>(() =>
    loadFounderData(),
  );
  const [seoTitle, setSeoTitle] = useState<string>(() => loadSeoTitle());
  const [activeSection, setActiveSection] = useState<string>("__all__");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() =>
    loadGoogleUser(),
  );
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const [showTrackOrder, setShowTrackOrder] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

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

  // Keep module-level actor ref in sync for order functions
  useEffect(() => {
    setCanisterActor(actor);
  }, [actor]);

  // Load site data from canister on first load
  useEffect(() => {
    if (!actor || canisterLoaded) return;
    let cancelled = false;
    async function loadFromCanister() {
      try {
        const [siteDataStr, ordersStr] = await Promise.all([
          actor!.getValue("siteData"),
          actor!.getValue("orders"),
        ]);
        if (cancelled) return;
        if (siteDataStr) {
          try {
            const data = JSON.parse(siteDataStr) as {
              products?: Product[];
              saleSettings?: SaleSettings;
              promoCodes?: PromoCode[];
              paymentMethods?: PaymentMethod[];
              bannerImage?: string;
              bgColor?: string;
            };
            if (Array.isArray(data.products) && data.products.length > 0)
              setProducts(data.products);
            if (data.saleSettings) setSale(data.saleSettings);
            if (Array.isArray(data.promoCodes)) setPromoCodes(data.promoCodes);
            if (Array.isArray(data.paymentMethods))
              setPaymentMethods(data.paymentMethods);
            if (data.bannerImage !== undefined)
              setCustomBanner(data.bannerImage);
            if (data.bgColor !== undefined) setCustomBg(data.bgColor);
            if ((data as any).instagramId)
              setInstagramId((data as any).instagramId);
            if (Array.isArray((data as any).customSections))
              setCustomSections((data as any).customSections);
            if ((data as any).founderData) {
              const fd = { ...DEFAULT_FOUNDER, ...(data as any).founderData };
              setFounderData(fd);
              saveFounderData(fd);
            }
          } catch {}
        }
        if (ordersStr) {
          try {
            const orders = JSON.parse(ordersStr) as Order[];
            if (Array.isArray(orders)) {
              localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
            }
          } catch {}
        }
      } catch {}
      if (!cancelled) setCanisterLoaded(true);
    }
    loadFromCanister();
    return () => {
      cancelled = true;
    };
  }, [actor, canisterLoaded]);

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
      if (googleUser && googleUser.email === ADMIN_GMAIL) {
        logActivity(
          googleUser.email,
          "Admin Panel Opened",
          "Admin accessed panel via Google login",
        );
        setShowAdminPanel(true);
      } else {
        setShowAdminLogin(true);
      }
    }
  };

  useEffect(() => {
    document.body.style.overflow =
      cartOpen ||
      showAdminLogin ||
      showAdminPanel ||
      !!selectedProduct ||
      showGoogleLogin ||
      showTrackOrder ||
      showSearch
        ? "hidden"
        : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    cartOpen,
    showAdminLogin,
    showAdminPanel,
    selectedProduct,
    showGoogleLogin,
    showTrackOrder,
    showSearch,
  ]);

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

            <nav className="hidden md:flex items-center gap-8">
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
              <button
                type="button"
                onClick={() => setShowTrackOrder(true)}
                className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors flex items-center gap-1.5"
              >
                <Truck size={12} /> Track Order
              </button>
            </nav>

            <div className="flex items-center gap-4">
              {googleUser ? (
                <div className="hidden md:flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                    style={{
                      background: "oklch(0.85 0.12 85)",
                      color: "oklch(0.09 0.008 60)",
                    }}
                    title={googleUser.email}
                  >
                    {googleUser.name.charAt(0)}
                  </div>
                  {googleUser.email === ADMIN_GMAIL && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: "oklch(0.85 0.12 85 / 0.15)",
                        color: "oklch(0.85 0.12 85)",
                      }}
                    >
                      Admin
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMyOrders(true)}
                    className="p-1 text-muted-foreground hover:text-brand-gold transition-colors text-xs font-display uppercase tracking-widest"
                    title="My Orders"
                  >
                    My Orders
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logActivity(googleUser.email, "Logout", "Logged out");
                      localStorage.removeItem(LS_GOOGLE_USER_KEY);
                      setGoogleUser(null);
                      toast.success("Logged out");
                    }}
                    className="p-1 text-muted-foreground hover:text-brand-gold transition-colors"
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGoogleLogin(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 font-display font-bold text-xs uppercase tracking-widest rounded-lg border border-border text-muted-foreground hover:border-brand-gold hover:text-brand-gold transition-colors"
                >
                  <LogIn size={12} /> Login
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowSearch(true);
                  setSearchQuery("");
                  setPriceMin("");
                  setPriceMax("");
                }}
                className="p-2 text-foreground hover:text-brand-gold transition-colors"
                title="Search products"
              >
                <Search size={20} />
              </button>
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
                  onClick={() => {
                    scrollTo(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowTrackOrder(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 w-full text-left py-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors"
              >
                <Truck size={12} /> Track Order
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSearch(true);
                  setSearchQuery("");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 w-full text-left py-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors"
              >
                <Search size={12} /> Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleLogin(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 w-full text-left py-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors"
              >
                <LogIn size={12} /> Login
              </button>
              {googleUser && (
                <div className="py-2 text-xs text-brand-gold font-display tracking-widest">
                  {googleUser.name}{" "}
                  {googleUser.email === ADMIN_GMAIL ? "· Admin" : ""}
                </div>
              )}
              {googleUser && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMyOrders(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 w-full text-left py-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-gold transition-colors"
                >
                  <Package size={12} /> My Orders
                </button>
              )}
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
        {/* Section tabs */}
        {customSections.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            <button
              type="button"
              onClick={() => setActiveSection("__all__")}
              className={`px-5 py-2 font-display font-bold text-xs uppercase tracking-widest rounded-full border transition-all ${activeSection === "__all__" ? "btn-gold border-transparent" : "btn-outline-gold bg-background/60"}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("__new__")}
              className={`px-5 py-2 font-display font-bold text-xs uppercase tracking-widest rounded-full border transition-all ${activeSection === "__new__" ? "btn-gold border-transparent" : "btn-outline-gold bg-background/60"}`}
            >
              New Arrivals
            </button>
            {customSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`px-5 py-2 font-display font-bold text-xs uppercase tracking-widest rounded-full border transition-all ${activeSection === sec.id ? "btn-gold border-transparent" : "btn-outline-gold bg-background/60"}`}
              >
                {sec.title}
              </button>
            ))}
          </div>
        )}

        {/* Section heading */}
        {(() => {
          const sec = customSections.find((s) => s.id === activeSection);
          const isAll =
            activeSection === "__all__" || activeSection === "__new__";
          const title =
            activeSection === "__all__"
              ? "All Products"
              : activeSection === "__new__"
                ? "New Arrivals"
                : sec?.title || "Collection";
          const subtitle = isAll ? "Collection" : sec?.subtitle || "Collection";
          return (
            <div className="mb-14">
              <p className="font-display text-xs uppercase tracking-[0.45em] text-brand-gold mb-3">
                {subtitle}
              </p>
              <h2
                className="font-display font-bold text-foreground leading-tight"
                style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
              >
                {title}
              </h2>
              <div className="gold-divider max-w-xs mt-4" />
            </div>
          );
        })()}

        {/* Filtered product grid */}
        {(() => {
          const sec = customSections.find((s) => s.id === activeSection);
          const filtered =
            activeSection === "__all__" || activeSection === "__new__"
              ? products
              : sec
                ? products.filter((p) => sec.productIds.includes(p.id))
                : products;
          if (filtered.length === 0) {
            return (
              <div className="text-center text-muted-foreground font-display py-16 text-sm uppercase tracking-widest">
                No products in this section yet.
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  sale={sale}
                  onAddToCart={addToCart}
                  onOpenDetail={setSelectedProduct}
                  onDirectBuy={handleDirectBuy}
                  index={i}
                  instagramId={instagramId}
                />
              ))}
            </div>
          );
        })()}
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
              <Instagram size={16} className="text-brand-gold" />@{instagramId}
            </div>
            <a
              href={`https://www.instagram.com/${instagramId}`}
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
      {/* FOUNDER'S NOTE */}
      <section
        className="py-20 px-4"
        style={{ backgroundColor: "oklch(0.05 0.004 60)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-brand-gold mb-8">
            Founder&#39;s Note
          </p>
          {founderData.photo && (
            <div className="flex justify-center mb-8">
              <img
                src={founderData.photo}
                alt={founderData.name}
                className="w-24 h-24 rounded-full object-cover border-2"
                style={{ borderColor: "oklch(0.85 0.12 85 / 0.4)" }}
              />
            </div>
          )}
          <div
            className="space-y-4 text-sm leading-relaxed"
            style={{
              color: "oklch(0.75 0.02 60)",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            <p style={{ whiteSpace: "pre-line" }}>{founderData.note}</p>
          </div>
          <div className="mt-10 border-t border-brand-gold/20 pt-8">
            <p className="font-display text-sm tracking-[0.15em] text-foreground">
              — {founderData.name}
            </p>
            <p
              className="text-xs tracking-[0.2em] uppercase mt-1"
              style={{ color: "oklch(0.6 0.02 60)" }}
            >
              {founderData.title}
            </p>
          </div>
        </div>
      </section>

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
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <RotateCcw size={10} className="text-brand-gold" />
                <span>7-Day Return Policy on all orders</span>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <a
                href={`https://www.instagram.com/${instagramId}`}
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
          instagramId={instagramId}
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
          instagramId={instagramId}
        />
      )}

      {/* My Orders Modal */}
      {showMyOrders && googleUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setShowMyOrders(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close"
            onKeyDown={(e) => e.key === "Enter" && setShowMyOrders(false)}
          />
          <div className="relative z-10 bg-card rounded-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl border border-brand-gold/30 animate-fade-in-up">
            <button
              type="button"
              onClick={() => setShowMyOrders(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:text-brand-gold transition-colors"
            >
              <X size={18} />
            </button>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <Package size={20} style={{ color: "oklch(0.85 0.12 85)" }} />
                <h2 className="font-display text-2xl font-bold text-brand-gold tracking-wide">
                  My Orders
                </h2>
              </div>
              <p className="text-xs text-muted-foreground font-display mb-4">
                {googleUser.name} · {googleUser.email}
              </p>
              <div className="gold-divider mb-5" />
              {(() => {
                const myOrders = loadOrders().filter(
                  (o) => o.userEmail === googleUser.email,
                );
                if (myOrders.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted-foreground font-display">
                      <Package size={32} className="mx-auto mb-3 opacity-30" />
                      <p>No orders yet.</p>
                      <p className="text-xs mt-1">
                        Your orders will appear here after you place one.
                      </p>
                    </div>
                  );
                }
                const steps: Order["trackingStatus"][] = [
                  "placed",
                  "packed",
                  "shipped",
                  "out_for_delivery",
                  "delivered",
                ];
                const stepLabel: Record<string, string> = {
                  placed: "Placed",
                  packed: "Packed",
                  shipped: "Shipped",
                  out_for_delivery: "Out for Delivery",
                  delivered: "Delivered",
                };
                return (
                  <div className="flex flex-col gap-6">
                    {myOrders.map((order) => {
                      const currentStep = steps.indexOf(
                        order.trackingStatus || "placed",
                      );
                      const canCancel =
                        order.status !== "cancelled" &&
                        (order.trackingStatus === "placed" ||
                          order.trackingStatus === "packed" ||
                          !order.trackingStatus);
                      return (
                        <div
                          key={order.id}
                          className={`rounded-xl border p-5 ${order.status === "cancelled" ? "border-red-500/20 bg-red-950/10" : "border-border bg-background/60"}`}
                        >
                          {/* Header row */}
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <div>
                              <span className="font-display font-bold text-foreground text-base">
                                {order.product}
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs text-muted-foreground bg-border/30 px-2 py-0.5 rounded">
                                  Size: {order.size}
                                </span>
                                <span className="text-xs text-muted-foreground bg-border/30 px-2 py-0.5 rounded">
                                  Qty: {order.qty}
                                </span>
                                <span
                                  className="text-xs bg-border/30 px-2 py-0.5 rounded"
                                  style={{ color: "oklch(0.85 0.12 85)" }}
                                >
                                  ₹{order.price}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${order.status === "placed" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}
                            >
                              {order.status === "placed"
                                ? "Active"
                                : "Cancelled"}
                            </span>
                          </div>

                          <div className="gold-divider mb-3" />

                          {/* Full details grid */}
                          <div className="grid grid-cols-1 gap-2 text-xs font-display mb-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Order ID
                              </span>
                              <span className="text-foreground font-mono font-bold">
                                #{order.id.slice(-8).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Order Date
                              </span>
                              <span className="text-foreground">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                                {" · "}
                                {new Date(order.createdAt).toLocaleTimeString(
                                  "en-IN",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Order Type
                              </span>
                              <span className="text-foreground">
                                {order.viaInstagram
                                  ? "Via Instagram DM"
                                  : "Direct Order"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Payment
                              </span>
                              <span className="text-foreground">
                                {order.paymentMethod}
                              </span>
                            </div>
                            {order.upiTransactionId && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  UTR / Transaction ID
                                </span>
                                <span className="font-mono text-foreground">
                                  {order.upiTransactionId}
                                </span>
                              </div>
                            )}
                            {order.upiTransactionId && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  UPI Payment Status
                                </span>
                                <span
                                  style={{
                                    color:
                                      order.upiPaymentStatus === "verified"
                                        ? "oklch(0.7 0.15 145)"
                                        : "oklch(0.85 0.12 85)",
                                  }}
                                  className="font-bold"
                                >
                                  {order.upiPaymentStatus === "verified"
                                    ? "✅ Verified"
                                    : "⏳ Under Verification"}
                                </span>
                              </div>
                            )}
                            {order.promoCode && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Promo Code
                                </span>
                                <span className="text-green-400 font-bold">
                                  {order.promoCode}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Delivery info */}
                          <div className="rounded-lg bg-background/40 border border-border/50 p-3 mb-3 text-xs font-display">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1">
                              Delivery Address
                            </p>
                            <p className="text-foreground font-semibold">
                              {order.name} · {order.phone}
                            </p>
                            <p className="text-muted-foreground mt-0.5">
                              {order.address}
                            </p>
                          </div>

                          {/* Tracking stepper */}
                          {order.status === "placed" && (
                            <div className="mt-2 mb-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-display mb-2">
                                Order Status
                              </p>
                              <div className="flex items-center gap-0">
                                {steps.map((step, i) => (
                                  <div
                                    key={step}
                                    className="flex items-center flex-1"
                                  >
                                    <div className="flex flex-col items-center flex-1">
                                      <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all ${i <= currentStep ? "border-brand-gold" : "border-border"}`}
                                        style={
                                          i <= currentStep
                                            ? {
                                                background:
                                                  "oklch(0.85 0.12 85)",
                                                color: "oklch(0.09 0.008 60)",
                                              }
                                            : {
                                                background: "transparent",
                                                color: "oklch(0.5 0.02 60)",
                                              }
                                        }
                                      >
                                        {i <= currentStep ? "✓" : i + 1}
                                      </div>
                                      <span
                                        className={`text-[9px] mt-1 font-display text-center leading-tight ${i <= currentStep ? "text-brand-gold" : "text-muted-foreground"}`}
                                      >
                                        {stepLabel[step]}
                                      </span>
                                    </div>
                                    {i < steps.length - 1 && (
                                      <div
                                        className={`h-0.5 flex-1 -mt-4 mx-0.5 transition-all ${i < currentStep ? "bg-brand-gold" : "bg-border"}`}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cancel Order Button */}
                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to cancel this order? This cannot be undone.",
                                  )
                                ) {
                                  customerCancelOrder(order.id, order.phone);
                                  toast.success(
                                    "Order cancelled successfully.",
                                  );
                                }
                              }}
                              className="mt-2 w-full py-2.5 rounded-lg border border-red-500/50 text-red-400 text-xs font-display font-bold uppercase tracking-widest hover:bg-red-500/15 active:bg-red-500/25 transition-colors"
                            >
                              ✕ Cancel Order
                            </button>
                          ) : (
                            order.status !== "cancelled" && (
                              <p className="mt-2 text-center text-[10px] text-muted-foreground font-display py-2 rounded-lg border border-border/30">
                                Order cannot be cancelled at this stage —
                                contact us on Instagram
                              </p>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {checkoutItem && (
        <CheckoutModal
          item={checkoutItem}
          onClose={() => setCheckoutItem(null)}
          promoCodes={promoCodes}
          paymentMethods={paymentMethods}
          instagramId={instagramId}
          userEmail={googleUser?.email}
        />
      )}

      {showSearch && (
        <div
          className="fixed inset-0 z-[200] flex flex-col"
          style={{
            background: "oklch(0.06 0.008 60 / 0.97)",
            backdropFilter: "blur(16px)",
          }}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSearch(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowSearch(false);
          }}
        >
          <div className="w-full max-w-2xl mx-auto px-4 pt-16 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <Search size={22} style={{ color: "oklch(0.85 0.12 85)" }} />
              <input
                type="text"
                placeholder="Search products, styles, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent font-display text-xl text-foreground outline-none placeholder:text-muted-foreground"
                style={{ caretColor: "oklch(0.85 0.12 85)" }}
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-1 text-muted-foreground hover:text-brand-gold transition-colors"
              >
                <X size={22} />
              </button>
            </div>
            <div
              style={{ height: "1px", background: "oklch(0.85 0.12 85 / 0.3)" }}
              className="mb-4"
            />
            {/* Price range filter */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs uppercase tracking-widest font-display text-muted-foreground flex-shrink-0">
                Price ₹
              </span>
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-24 rounded-lg px-3 py-1.5 text-sm outline-none text-foreground"
                style={{
                  background: "oklch(0.12 0.01 60)",
                  border: "1px solid oklch(0.25 0.03 70)",
                }}
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-24 rounded-lg px-3 py-1.5 text-sm outline-none text-foreground"
                style={{
                  background: "oklch(0.12 0.01 60)",
                  border: "1px solid oklch(0.25 0.03 70)",
                }}
              />
              {(priceMin || priceMax) && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin("");
                    setPriceMax("");
                  }}
                  className="text-xs text-muted-foreground hover:text-brand-gold transition-colors ml-1"
                >
                  Clear
                </button>
              )}
            </div>
            {searchQuery.trim().length === 0 && !priceMin && !priceMax ? (
              <div className="text-center text-muted-foreground font-display text-xs uppercase tracking-widest mt-12">
                Start typing to search the collection
              </div>
            ) : (
              (() => {
                const q = searchQuery.toLowerCase().trim();
                // Smart AI-style matching: synonyms + keyword recognition
                const synonyms: Record<string, string[]> = {
                  shirt: ["t-shirt", "tee", "top", "tshirt"],
                  pants: ["trousers", "bottoms", "lower", "jogger", "baggy"],
                  jacket: ["hoodie", "coat", "outerwear", "sweatshirt"],
                  black: ["dark", "midnight", "noir"],
                  white: ["cream", "ivory", "off-white", "light"],
                  premium: ["luxury", "quality", "exclusive"],
                  oversized: ["baggy", "loose", "relaxed", "wide"],
                  slim: ["skinny", "fitted", "tapered"],
                };
                const expandedTerms = [q];
                for (const [key, vals] of Object.entries(synonyms)) {
                  if (q.includes(key))
                    for (const v of vals) expandedTerms.push(v);
                  if (vals.some((v) => q.includes(v))) expandedTerms.push(key);
                }
                const scored = products
                  .map((p) => {
                    const text = `${p.name} ${p.description}`.toLowerCase();
                    let score = 0;
                    for (const term of expandedTerms) {
                      if (p.name.toLowerCase().includes(term)) score += 10;
                      if (p.description.toLowerCase().includes(term))
                        score += 5;
                      if (text.includes(term)) score += 2;
                    }
                    return { p, score };
                  })
                  .filter((x) => x.score > 0)
                  .sort((a, b) => b.score - a.score);
                if (scored.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground font-display text-sm uppercase tracking-widest mb-2">
                        No results found
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Try different keywords like "shirt", "pants", or
                        "oversized"
                      </p>
                    </div>
                  );
                }
                return (
                  <div>
                    <p
                      className="text-xs uppercase tracking-widest font-display mb-4"
                      style={{ color: "oklch(0.85 0.12 85)" }}
                    >
                      {scored.length} result{scored.length !== 1 ? "s" : ""}{" "}
                      found
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {scored.map(({ p }) => {
                        const discountedPrice = sale.enabled
                          ? Math.round(p.price * (1 - sale.discount / 100))
                          : p.price;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowSearch(false);
                            }}
                            className="flex gap-4 items-center text-left rounded-xl p-3 transition-all hover:scale-[1.02]"
                            style={{
                              background: "oklch(0.12 0.01 60)",
                              border: "1px solid oklch(0.25 0.03 70)",
                            }}
                          >
                            {p.images[0] && (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                style={{ background: "oklch(0.15 0.01 60)" }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-bold text-sm text-foreground truncate">
                                {p.name}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {p.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span
                                  className="font-bold text-sm"
                                  style={{ color: "oklch(0.85 0.12 85)" }}
                                >
                                  ₹{discountedPrice}
                                </span>
                                {sale.enabled && (
                                  <span className="text-xs line-through text-muted-foreground">
                                    ₹{p.price}
                                  </span>
                                )}
                                {p.bestSeller && (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                      background: "oklch(0.85 0.12 85 / 0.15)",
                                      color: "oklch(0.85 0.12 85)",
                                    }}
                                  >
                                    Best Seller
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {showAdminLogin && (
        <AdminLoginModal
          onSuccess={() => {
            logActivity(
              "admin",
              "Admin Login",
              "Admin accessed panel via password",
            );
            setShowAdminLogin(false);
            setShowAdminPanel(true);
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {showGoogleLogin && (
        <GoogleLoginModal
          onSuccess={(user) => {
            setGoogleUser(user);
            setShowGoogleLogin(false);
            toast.success(`Welcome, ${user.name}!`);
          }}
          onClose={() => setShowGoogleLogin(false)}
        />
      )}

      {showTrackOrder && (
        <TrackOrderModal onClose={() => setShowTrackOrder(false)} />
      )}

      {showAdminPanel && (
        <AdminPanel
          products={products}
          saleSettings={sale}
          promoCodes={promoCodes}
          paymentMethods={paymentMethods}
          customBanner={customBanner}
          customBg={customBg}
          instagramId={instagramId}
          customSections={customSections}
          founderData={founderData}
          seoTitle={seoTitle}
          actor={actor}
          onClose={(
            updated,
            newSale,
            newPromos,
            newPayments,
            newBanner,
            newBg,
            newInstaId,
            newSections,
            newFounder,
            newSeoTitle,
          ) => {
            if (updated) setProducts(updated);
            if (newSale) setSale(newSale);
            if (newPromos !== undefined) setPromoCodes(newPromos);
            if (newPayments !== undefined) setPaymentMethods(newPayments);
            if (newBanner !== undefined) setCustomBanner(newBanner);
            if (newBg !== undefined) setCustomBg(newBg);
            if (newInstaId !== undefined) setInstagramId(newInstaId);
            if (newSections !== undefined) setCustomSections(newSections);
            if (newFounder !== undefined) {
              setFounderData(newFounder);
              saveFounderData(newFounder);
            }
            if (newSeoTitle !== undefined) setSeoTitle(newSeoTitle);
            setShowAdminPanel(false);
          }}
        />
      )}
    </div>
  );
}
