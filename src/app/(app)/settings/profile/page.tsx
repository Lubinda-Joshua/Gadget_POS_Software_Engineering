"use client";

import { useState } from "react";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { EditProfileForm } from "@/components/settings/edit-profile-form";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/translations";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { data: session, refetch } = useSession();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!session?.user) {
    return <div className="p-4">Loading...</div>;
  }

  const displayUser = session.user;

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("account_info")}</h2>
            <p className="text-sm text-muted-foreground">{t("account_info_desc")}</p>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            {t("edit")}
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("name")}</label>
            <p className="text-base font-medium">{displayUser.name || "(Not set)"}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("email")}</label>
            <p className="text-base font-medium">{displayUser.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("role")}</label>
            <div className="mt-1">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  displayUser.role === "ADMIN"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                {displayUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{t("security")}</h2>
          <p className="text-sm text-muted-foreground">{t("security_desc")}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{t("password")}</h3>
            <p className="text-sm text-muted-foreground">{t("password_desc")}</p>
          </div>
          <button
            onClick={() => setPasswordOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            {t("change_password")}
          </button>
        </div>
      </div>

      <ChangePasswordForm
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />

      <EditProfileForm
        open={editOpen}
        onOpenChange={setEditOpen}
        user={displayUser}
        onSuccess={async () => {
          await refetch();
        }}
      />
    </div>
  );
}
