"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ResourceCard } from "@/components/resource-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDemoResource } from "@/lib/demo-data";
import { useLanguage } from "@/lib/i18n";
import { useSavedResources } from "@/lib/saved-store";
import type { SupportResource } from "@/lib/types";

export default function SavedPage() {
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const { ids } = useSavedResources();
  const resources = ids.map(getDemoResource).filter(Boolean) as SupportResource[];

  return (
    <div>
      <PageHeader
        title={t("savedResources")}
        subtitle={bn ? "আপনার সংরক্ষিত রিসোর্স।" : "Resources you've saved."}
      />
      {resources.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {bn ? "এখনো কিছু সংরক্ষণ করেননি।" : "You haven't saved anything yet."}
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
      )}
    </div>
  );
}
