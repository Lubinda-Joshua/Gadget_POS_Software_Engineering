"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "@/lib/translations";
import { Search, Plus, AlertTriangle, Barcode, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { getDeviceSettings, playErrorBeep } from "@/hooks/use-device-settings";

interface ProductResult {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string | null;
  sku?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  trackingMode: "QUANTITY" | "SERIALIZED";
  warrantyMonths: number;
}

interface AvailableUnit {
  id: string;
  serialNumber: string | null;
  imei: string | null;
}

export function ProductSearch() {
  const t = useTranslations("pos");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [allProducts, setAllProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(true);
  const [unitProduct, setUnitProduct] = useState<ProductResult | null>(null);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeypressRef = useRef<number>(0);

  const loadGrid = useCallback(async () => {
    setGridLoading(true);
    try {
      const res = await fetch("/api/products/search?q=&limit=60");
      if (res.ok) setAllProducts(await res.json());
    } catch {
      // The quick-add grid is optional; search remains available.
    } finally {
      setGridLoading(false);
    }
  }, []);

  // Refresh on mount and after this POS completes a sale.
  useEffect(() => {
    void loadGrid();
    const refresh = () => void loadGrid();
    window.addEventListener("gadget-pos-sale-complete", refresh);
    return () => window.removeEventListener("gadget-pos-sale-complete", refresh);
  }, [loadGrid]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Show toast when barcode scan returns no result
  const prevResultsRef = useRef<ProductResult[]>([]);
  useEffect(() => {
    const isBarcodeLike =
      /^[A-Za-z0-9]{6,20}$/.test(query.trim()) &&
      results.length === 0 &&
      prevResultsRef.current !== results &&
      !loading &&
      query.trim().length > 0;
    if (isBarcodeLike) {
      toast.error(`Product not found: "${query.trim()}"`, {
        id: "barcode-not-found",
        duration: 3000,
      });
      const deviceSettings = getDeviceSettings();
      if (deviceSettings.scannerBeepEnabled) playErrorBeep();
    }
    prevResultsRef.current = results;
  }, [results, query, loading]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Barcode scanners type very fast (< 30ms between keystrokes).
    // Use a short debounce so the search fires immediately after the scanner finishes.
    const now = Date.now();
    const timeSinceLast = now - lastKeypressRef.current;
    lastKeypressRef.current = now;
    const delay = timeSinceLast < 30 ? 50 : 250;
    debounceRef.current = setTimeout(() => search(val), delay);
  }

  async function handleSelect(product: ProductResult) {
    if (product.trackingMode === "SERIALIZED") {
      setUnitProduct(product);
      setUnitsLoading(true);
      try {
        const response = await fetch(`/api/products/${product.id}/units`);
        const units: AvailableUnit[] = response.ok ? await response.json() : [];
        const selected = new Set(cartItems.map((item) => item.unitId).filter(Boolean));
        setAvailableUnits(units.filter((unit) => !selected.has(unit.id)));
      } finally {
        setUnitsLoading(false);
      }
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    });
    setQuery("");
    setResults([]);
  }

  function selectUnit(unit: AvailableUnit) {
    if (!unitProduct) return;
    addItem({
      productId: unitProduct.id,
      unitId: unit.id,
      name: unitProduct.name,
      price: unitProduct.price,
      stock: 1,
      serialNumber: unit.serialNumber ?? undefined,
      imei: unit.imei ?? undefined,
      warrantyMonths: unitProduct.warrantyMonths,
    });
    setUnitProduct(null);
    setAvailableUnits([]);
    setQuery("");
    setResults([]);
  }

  const showSearchResults = Boolean(query.trim());

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Search bar */}
      <div className="relative shrink-0">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          id="pos-search-input"
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0) {
              e.preventDefault();
              handleSelect(results[0]);
            } else if (e.key === "Escape") {
              setQuery("");
              setResults([]);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={t("search_placeholder")}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-11 w-full rounded-md border py-2 pr-4 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          autoFocus
        />
      </div>

      {/* Search results */}
      {showSearchResults && (
        <div className="shrink-0">
          {loading && <p className="text-muted-foreground px-1 py-2 text-xs">Searchingâ€¦</p>}
          {!loading && results.length === 0 && (
            <p className="text-muted-foreground px-1 py-2 text-xs">No products found</p>
          )}
          {results.length > 0 && (
            <div className="bg-card divide-y overflow-hidden rounded-md border">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="hover:bg-accent flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    {p.sku && <p className="text-muted-foreground text-xs">SKU: {p.sku}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(p.price)}</p>
                    <p className="text-muted-foreground text-xs">Stock: {p.stock}</p>
                    {p.trackingMode === "SERIALIZED" && (
                      <p className="text-[10px] font-medium text-blue-600">Select serial / IMEI</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick-add product grid (when no active search) */}
      {!showSearchResults && (
        <div className="flex-1 overflow-y-auto">
          {gridLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted h-20 animate-pulse rounded-lg border" />
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
              No products yet — add products in the catalog
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {allProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  disabled={p.stock === 0}
                  className={cn(
                    "relative flex min-h-[4.5rem] flex-col justify-between rounded-lg border p-3 text-left transition-all",
                    p.stock === 0
                      ? "bg-muted cursor-not-allowed opacity-50"
                      : "hover:bg-accent hover:border-primary/30 bg-card cursor-pointer active:scale-[0.98]"
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-1">
                    <p className="line-clamp-2 flex-1 text-xs leading-tight font-semibold">
                      {p.name}
                    </p>
                    {p.trackingMode === "SERIALIZED" && (
                      <Barcode className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    {p.trackingMode === "QUANTITY" && (
                      <Plus className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                  </div>
                  {p.imageUrl ? (
                    <div className="flex w-full justify-center">
                      <img src={p.imageUrl} alt={p.name} className="rounded-md object-cover" />
                    </div>
                  ) : null}
                  <div className="mt-1.5 flex w-full items-end justify-between">
                    <span className="text-primary text-sm font-bold">
                      {formatCurrency(p.price)}
                    </span>
                    {p.stock > 0 && p.stock <= 5 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {p.stock}
                      </span>
                    )}
                    {p.stock === 0 && (
                      <span className="text-destructive text-[10px] font-medium">Out</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {unitProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background w-full max-w-md overflow-hidden rounded-xl border shadow-2xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Select product unit</h2>
                <p className="text-muted-foreground text-sm">{unitProduct.name}</p>
              </div>
              <button
                onClick={() => setUnitProduct(null)}
                aria-label="Close unit selector"
                className="hover:bg-accent rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 divide-y overflow-y-auto p-2">
              {unitsLoading && (
                <p className="text-muted-foreground p-8 text-center text-sm">
                  Loading available units…
                </p>
              )}
              {!unitsLoading && availableUnits.length === 0 && (
                <p className="text-muted-foreground p-8 text-center text-sm">
                  No unselected units are available.
                </p>
              )}
              {availableUnits.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => selectUnit(unit)}
                  className="hover:bg-accent flex w-full items-center justify-between rounded-lg px-3 py-3 text-left"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {unit.serialNumber ?? unit.imei}
                    </p>
                    {unit.serialNumber && unit.imei && (
                      <p className="text-muted-foreground text-xs">IMEI: {unit.imei}</p>
                    )}
                  </div>
                  <span className="text-primary text-xs font-medium">Add to cart</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
