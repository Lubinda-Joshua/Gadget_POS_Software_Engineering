/**
 * Thermal receipt printing via Web Serial API (ESC/POS).
 * Falls back gracefully if Web Serial is unavailable.
 */

// ESC/POS command constants
const ESC = 0x1b;
const GS = 0x1d;

function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function text(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

const INIT = cmd(ESC, 0x40);                    // Initialize printer
const LINE_FEED = cmd(0x0a);                    // Line feed
const CUT = cmd(GS, 0x56, 0x00);               // Full cut
const BOLD_ON = cmd(ESC, 0x45, 0x01);          // Bold on
const BOLD_OFF = cmd(ESC, 0x45, 0x00);         // Bold off
const ALIGN_CENTER = cmd(ESC, 0x61, 0x01);     // Center align
const ALIGN_LEFT = cmd(ESC, 0x61, 0x00);       // Left align
const ALIGN_RIGHT = cmd(ESC, 0x61, 0x02);      // Right align
const DOUBLE_HEIGHT = cmd(ESC, 0x21, 0x10);    // Double height
const NORMAL_SIZE = cmd(ESC, 0x21, 0x00);      // Normal size

function padEnd(str: string, length: number): string {
  return str.padEnd(length).slice(0, length);
}

function padStart(str: string, length: number): string {
  return str.padStart(length).slice(-length);
}

function twoColumns(left: string, right: string, width = 32): Uint8Array {
  const gap = width - left.length - right.length;
  const line = left + " ".repeat(Math.max(1, gap)) + right + "\n";
  return text(line.slice(0, width + 1));
}

function divider(width = 32): Uint8Array {
  return text("-".repeat(width) + "\n");
}

interface ThermalReceiptSettings {
  name: string;
  currency: string;
  currencyDecimals: number;
  taxName: string;
  receiptFooter: string;
}

interface ThermalReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ThermalReceiptData {
  saleId?: string;
  items: ThermalReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  amountTendered?: number;
  changeDue?: number;
}

function buildReceiptBytes(
  data: ThermalReceiptData,
  settings: ThermalReceiptSettings
): Uint8Array {
  const chunks: Uint8Array[] = [];
  const c = settings.currency;
  const d = settings.currencyDecimals;

  function fmt(n: number) {
    return `${c}${n.toFixed(d)}`;
  }

  chunks.push(INIT);
  chunks.push(ALIGN_CENTER, DOUBLE_HEIGHT, BOLD_ON);
  chunks.push(text(settings.name + "\n"));
  chunks.push(NORMAL_SIZE, BOLD_OFF, ALIGN_LEFT);

  const now = new Date();
  chunks.push(text(`${now.toLocaleDateString()}  ${now.toLocaleTimeString()}\n`));
  if (data.saleId) {
    chunks.push(text(`#${data.saleId.slice(-8).toUpperCase()}\n`));
  }
  chunks.push(divider());

  // Items
  for (const item of data.items) {
    chunks.push(text(`${item.name.slice(0, 20)}\n`));
    chunks.push(twoColumns(`  ${item.quantity} x ${fmt(item.price)}`, fmt(item.total)));
  }
  chunks.push(divider());

  // Totals
  chunks.push(twoColumns("Subtotal", fmt(data.subtotal)));
  if (data.discountAmount > 0) {
    chunks.push(twoColumns("Discount", `-${fmt(data.discountAmount)}`));
  }
  if (data.taxAmount > 0) {
    chunks.push(twoColumns(settings.taxName, fmt(data.taxAmount)));
  }
  chunks.push(divider());
  chunks.push(BOLD_ON);
  chunks.push(twoColumns("TOTAL", fmt(data.total)));
  chunks.push(BOLD_OFF);
  chunks.push(divider());

  // Payment
  chunks.push(twoColumns("Payment", data.paymentMethod));
  if (data.amountTendered && data.amountTendered > 0) {
    chunks.push(twoColumns("Tendered", fmt(data.amountTendered)));
  }
  if (data.changeDue && data.changeDue > 0) {
    chunks.push(twoColumns("Change Due", fmt(data.changeDue)));
  }

  if (settings.receiptFooter) {
    chunks.push(LINE_FEED);
    chunks.push(ALIGN_CENTER);
    chunks.push(text(settings.receiptFooter + "\n"));
    chunks.push(ALIGN_LEFT);
  }

  // Feed and cut
  chunks.push(LINE_FEED, LINE_FEED, LINE_FEED);
  chunks.push(CUT);

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export async function printReceipt({
  data,
  settings,
}: {
  data: ThermalReceiptData;
  settings: ThermalReceiptSettings;
}): Promise<{ ok: boolean; error?: string }> {
  if (!("serial" in navigator)) {
    // Fallback: try WebUSB (printer class code 7)
    if ("usb" in navigator) {
      return printReceiptWebUSB({ data, settings });
    }
    return {
      ok: false,
      error:
        "Neither Web Serial nor WebUSB is available. Use Chrome or Edge and connect the printer via USB.",
    };
  }

  try {
    // Request a serial port (USB thermal printer)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serial = (navigator as any).serial as {
      requestPort(): Promise<{
        open(opts: { baudRate: number }): Promise<void>;
        close(): Promise<void>;
        writable: WritableStream<Uint8Array> | null;
      }>;
    };
    const port = await serial.requestPort();
    await port.open({ baudRate: 9600 });

    const writer = port.writable?.getWriter();
    if (!writer) {
      return { ok: false, error: "Cannot write to port" };
    }

    const bytes = buildReceiptBytes(data, settings);
    await writer.write(bytes);
    writer.releaseLock();
    await port.close();

    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === "NotFoundError") {
      return { ok: false, error: "No printer selected" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Print failed" };
  }
}

/**
 * WebUSB fallback for printers that don't expose a serial port.
 * Targets USB printer class (bDeviceClass = 7).
 */
async function printReceiptWebUSB({
  data,
  settings,
}: {
  data: ThermalReceiptData;
  settings: ThermalReceiptSettings;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usb = (navigator as any).usb as {
      requestDevice(opts: { filters: { classCode: number }[] }): Promise<{
        open(): Promise<void>;
        close(): Promise<void>;
        claimInterface(n: number): Promise<void>;
        transferOut(endpoint: number, data: BufferSource): Promise<unknown>;
        configuration: {
          interfaces: {
            interfaceNumber: number;
            alternate: {
              endpoints: { direction: string; endpointNumber: number }[];
            };
          }[];
        } | null;
      }>;
    };

    const device = await usb.requestDevice({ filters: [{ classCode: 7 }] });
    await device.open();

    const iface = device.configuration?.interfaces[0];
    if (!iface) return { ok: false, error: "USB printer interface not found" };
    await device.claimInterface(iface.interfaceNumber);

    const outEndpoint = iface.alternate.endpoints.find(
      (ep) => ep.direction === "out"
    );
    if (!outEndpoint) return { ok: false, error: "USB printer OUT endpoint not found" };

    const bytes = buildReceiptBytes(data, settings);
    await device.transferOut(outEndpoint.endpointNumber, bytes.buffer as ArrayBuffer);
    await device.close();

    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === "NotFoundError") {
      return { ok: false, error: "No USB printer selected" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "USB print failed" };
  }
}

export { buildReceiptBytes };
