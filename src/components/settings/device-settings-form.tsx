"use client";

import { useDeviceSettings } from "@/hooks/use-device-settings";
import { printReceipt } from "@/lib/thermal-print";

const DEMO_RECEIPT = {
  data: {
    items: [{ name: "Test Item", quantity: 1, price: 1.0, total: 1.0 }],
    subtotal: 1.0,
    discountAmount: 0,
    taxAmount: 0,
    total: 1.0,
    paymentMethod: "CASH",
  },
  settings: {
    name: "Gadget POS Store",
    currency: "K",
    currencyDecimals: 2,
    taxName: "Tax",
    receiptFooter: "Thank you!",
  },
};

export function DeviceSettingsForm() {
  const [settings, update] = useDeviceSettings();

  async function handleTestPrint() {
    if (settings.printerType === "none") {
      alert("Printer is disabled. Select Serial or USB to test.");
      return;
    }
    const result = await printReceipt(DEMO_RECEIPT);
    if (!result.ok) {
      alert(`Print failed: ${result.error}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-base font-semibold">Device Preferences</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Stored locally in this browser — not synced across devices.
        </p>
      </div>

      {/* Default Payment Method */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Default Payment Method</label>
        <div className="flex gap-2">
          {(["CASH", "CARD", "OTHER"] as const).map((method) => (
            <button
              key={method}
              onClick={() => update({ defaultPaymentMethod: method })}
              className={
                settings.defaultPaymentMethod === method
                  ? "border-primary bg-primary/10 text-primary flex-1 rounded-md border-2 py-2 text-xs font-semibold"
                  : "text-muted-foreground hover:bg-accent flex-1 rounded-md border py-2 text-xs font-medium transition-colors"
              }
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Sound on sale */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Sound on Sale Complete</p>
          <p className="text-muted-foreground text-xs">
            Play a beep after each successful transaction
          </p>
        </div>
        <button
          role="switch"
          aria-checked={settings.soundOnSale}
          onClick={() => update({ soundOnSale: !settings.soundOnSale })}
          className={`focus-visible:ring-ring relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none ${
            settings.soundOnSale ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              settings.soundOnSale ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Scanner beep */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Scanner Error Beep</p>
          <p className="text-muted-foreground text-xs">
            Play a low beep when a barcode is not found
          </p>
        </div>
        <button
          role="switch"
          aria-checked={settings.scannerBeepEnabled}
          onClick={() => update({ scannerBeepEnabled: !settings.scannerBeepEnabled })}
          className={`focus-visible:ring-ring relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none ${
            settings.scannerBeepEnabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              settings.scannerBeepEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Printer type */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Thermal Printer Connection</p>
          <p className="text-muted-foreground text-xs">
            How this device connects to the receipt printer (Chrome / Edge only)
          </p>
        </div>
        <div className="flex gap-2">
          {(
            [
              { value: "serial", label: "USB Serial" },
              { value: "usb", label: "WebUSB" },
              { value: "none", label: "Disabled" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ printerType: value })}
              className={
                settings.printerType === value
                  ? "border-primary bg-primary/10 text-primary flex-1 rounded-md border-2 py-2 text-xs font-semibold"
                  : "text-muted-foreground hover:bg-accent flex-1 rounded-md border py-2 text-xs font-medium transition-colors"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={handleTestPrint}
          disabled={settings.printerType === "none"}
          className="text-muted-foreground hover:bg-accent w-full rounded-md border border-dashed py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          Test Print (sends a 1-item receipt)
        </button>
      </div>
    </div>
  );
}
