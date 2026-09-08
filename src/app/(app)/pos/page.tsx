import type { Metadata } from "next";
import { POSScreen } from "@/components/pos/pos-screen";

export const metadata: Metadata = { title: "POS" };

export default function POSPage() {
  return <POSScreen />;
}
