export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  serialNumber?: string;
  imei?: string;
  warrantyMonths?: number;
}

export interface ReceiptData {
  saleId?: string;
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tipAmount?: number;
  total: number;
  paymentMethod: string;
  paymentLines?: { method: string; amount: number }[];
  amountTendered?: number;
  changeDue?: number;
  createdAt?: Date;
}

export interface ReceiptSettings {
  name: string;
  logoUrl: string | null;
  currency: string;
  currencyDecimals: number;
  taxName: string;
  receiptFooter: string;
}

interface ReceiptProps {
  data: ReceiptData;
  settings: ReceiptSettings;
}

function fmt(amount: number, currency = "K", decimals = 2) {
  return `${currency}${amount.toFixed(decimals)}`;
}

export function Receipt({ data, settings }: ReceiptProps) {
  const c = settings.currency;
  const d = settings.currencyDecimals;
  const now = data.createdAt ?? new Date();

  return (
    <div
      id="receipt-print"
      className="mx-auto w-72 bg-white p-4 font-mono text-xs text-black print:w-full print:p-0 print:text-[10pt]"
      style={{ fontFamily: "monospace" }}
    >
      {/* Header */}
      <div className="mb-3 text-center">
        {settings.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="logo" className="mx-auto mb-2 h-12 object-contain" />
        )}
        <p className="text-sm font-bold">{settings.name}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      {/* Date & Sale ID */}
      <div className="mb-2 flex justify-between text-[10px]">
        <span>{now.toLocaleDateString()}</span>
        <span>{now.toLocaleTimeString()}</span>
      </div>
      {data.saleId && (
        <p className="mb-2 text-center text-[10px]">Sale #{data.saleId.slice(-8).toUpperCase()}</p>
      )}
      {data.customerName && (
        <p className="mb-2 text-center text-[10px]">For: {data.customerName}</p>
      )}

      <div className="my-2 border-t border-dashed border-black" />

      {/* Items */}
      <div className="mb-2 space-y-1">
        {data.items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between">
              <span className="flex-1 truncate pr-2">{item.name}</span>
              <span>{fmt(item.total, c, d)}</span>
            </div>
            {item.quantity > 1 && (
              <div className="pl-2 text-[10px] text-gray-500">
                {item.quantity} × {fmt(item.price, c, d)}
              </div>
            )}
            {item.notes && (
              <div className="pl-2 text-[10px] text-gray-500 italic">{item.notes}</div>
            )}
            {(item.serialNumber || item.imei) && (
              <div className="pl-2 text-[10px] text-gray-600">
                {item.serialNumber && `S/N: ${item.serialNumber}`}
                {item.serialNumber && item.imei && " · "}
                {item.imei && `IMEI: ${item.imei}`}
              </div>
            )}
            {item.warrantyMonths != null && item.warrantyMonths > 0 && (
              <div className="pl-2 text-[10px] text-gray-600">
                Warranty: {item.warrantyMonths} months from purchase
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      {/* Totals */}
      <div className="mb-2 space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{fmt(data.subtotal, c, d)}</span>
        </div>
        {data.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{fmt(data.discountAmount, c, d)}</span>
          </div>
        )}
        {data.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>{settings.taxName}</span>
            <span>{fmt(data.taxAmount, c, d)}</span>
          </div>
        )}
        {data.tipAmount != null && data.tipAmount > 0 && (
          <div className="flex justify-between">
            <span>Tip</span>
            <span>{fmt(data.tipAmount, c, d)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-black pt-1 text-sm font-bold">
          <span>TOTAL</span>
          <span>{fmt(data.total, c, d)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="mb-2 space-y-0.5 text-[10px]">
        {data.paymentLines && data.paymentLines.length > 0 ? (
          data.paymentLines.map((line, i) => (
            <div key={i} className="flex justify-between">
              <span>{line.method}</span>
              <span>{fmt(line.amount, c, d)}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between">
            <span>Payment</span>
            <span>{data.paymentMethod}</span>
          </div>
        )}
        {data.amountTendered != null && data.amountTendered > 0 && !data.paymentLines?.length && (
          <div className="flex justify-between">
            <span>Tendered</span>
            <span>{fmt(data.amountTendered, c, d)}</span>
          </div>
        )}
        {data.changeDue != null && data.changeDue > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{fmt(data.changeDue, c, d)}</span>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      {/* Footer */}
      {settings.receiptFooter && (
        <p className="mt-2 text-center text-[10px]">{settings.receiptFooter}</p>
      )}
    </div>
  );
}
