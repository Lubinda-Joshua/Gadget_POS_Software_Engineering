"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "@/lib/translations";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  _count?: { products: number };
}

interface SupplierForm {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY_FORM: SupplierForm = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  notes: "",
};

export default function SuppliersPage() {
  const t = useTranslations("suppliers");
  const tc = useTranslations("common");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/suppliers?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSuppliers(data.suppliers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuppliers(search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contactName: s.contactName ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      notes: s.notes ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        contactName: form.contactName.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      };
      const res = editing
        ? await fetch(`/api/suppliers/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Save failed");
      }
      setModalOpen(false);
      fetchSuppliers(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Supplier) {
    if ((s._count?.products ?? 0) > 0) {
      alert(`Cannot delete "${s.name}" — it has ${s._count?.products} product(s) assigned.`);
      return;
    }
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    await fetch(`/api/suppliers/${s.id}`, { method: "DELETE" });
    fetchSuppliers(search);
  }

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contactName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> {t("add")}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchSuppliers(e.target.value);
          }}
          placeholder={t("search_placeholder")}
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">{t("loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
          {t("no_suppliers")}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t("name")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("contact_person")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("email")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("phone")}</th>
                <th className="px-4 py-3 text-center font-medium">{t("products")}</th>
                <th className="px-4 py-3 text-center font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.contactName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      {s._count?.products ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded p-1.5 hover:bg-accent transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="rounded p-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">{editing ? t("edit_supplier") : t("add_supplier")}</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("name")} *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Supplier name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("contact_person")}</label>
                <input
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("email")}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("phone")}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+1 555 0100"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("notes")}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Optional notes…"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {saving ? tc("loading") : editing ? t("save_changes") : t("add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
