"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface ProductUnitSummary {
  id: string;
  serialNumber: string | null;
  imei: string | null;
  status: "AVAILABLE" | "SOLD";
  createdAt: string | Date;
}

export function SerializedUnitsPanel({
  productId,
  units,
}: {
  productId: string;
  units: ProductUnitSummary[];
}) {
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState("");
  const [imei, setImei] = useState("");
  const [saving, setSaving] = useState(false);

  async function registerUnit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/products/${productId}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serialNumber, imei }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      toast.error(data.error ?? "Could not register unit");
      return;
    }
    setSerialNumber("");
    setImei("");
    toast.success("Product unit registered");
    router.refresh();
  }

  async function removeUnit(unitId: string) {
    const response = await fetch(`/api/products/${productId}/units`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Could not remove unit");
      return;
    }
    toast.success("Available unit removed");
    router.refresh();
  }

  const available = units.filter((unit) => unit.status === "AVAILABLE");

  return (
    <section className="bg-card overflow-hidden rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Barcode className="h-4 w-4" /> Serialized Units
        </h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Register every physical phone, laptop, or tablet before it can be sold.
        </p>
      </div>

      <form
        onSubmit={registerUnit}
        className="bg-muted/20 grid gap-3 border-b p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={serialNumber}
          onChange={(event) => setSerialNumber(event.target.value)}
          placeholder="Serial number"
          className="bg-background h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={imei}
          onChange={(event) => setImei(event.target.value)}
          placeholder="IMEI (optional)"
          inputMode="numeric"
          className="bg-background h-10 rounded-md border px-3 text-sm"
        />
        <button
          type="submit"
          disabled={saving || (!serialNumber.trim() && !imei.trim())}
          className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {saving ? "Registering…" : "Register unit"}
        </button>
      </form>

      {available.length === 0 ? (
        <p className="text-muted-foreground p-8 text-center text-sm">
          No available units registered.
        </p>
      ) : (
        <div className="divide-y">
          {available.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-mono font-medium">{unit.serialNumber ?? unit.imei}</p>
                {unit.serialNumber && unit.imei && (
                  <p className="text-muted-foreground text-xs">IMEI: {unit.imei}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Available
                </span>
                <button
                  type="button"
                  onClick={() => removeUnit(unit.id)}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-1.5"
                  aria-label={`Remove unit ${unit.serialNumber ?? unit.imei}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
