"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ResourceCard } from "@/components/resource-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResources } from "@/lib/resources";
import { useLanguage } from "@/lib/i18n";
import { useSavedResources } from "@/lib/saved-store";
import type { SupportResource } from "@/lib/types";

export default function SavedPage() {
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const { ids } = useSavedResources();
  const { resources: available, loading, error } = useResources();
  const resources = ids
    .map((id) => available.find((r) => r.id === id))
    .filter(Boolean) as SupportResource[];

  return (
    <div>
      <PageHeader
        title={t("savedResources")}
        subtitle={bn ? "আপনার সংরক্ষিত রিসোর্স।" : "Resources you've saved."}
      />
      {loading && <p role="status">{bn ? "লোড হচ্ছে…" : "Loading…"}</p>}
      {error && <p role="alert">{error}</p>}
      {!loading &&
        !error &&
        (resources.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {bn
                ? "এখনো কিছু সংরক্ষণ করেননি।"
                : "You haven't saved anything yet."}
            </p>
            <Link
              href="/support/resources"
              className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3`}
            >
              {t("resourceDirectory")}
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ))}
    </div>
  );
}
