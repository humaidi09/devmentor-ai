"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { ResourceCard } from "@/components/resource-card";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { localize } from "@/lib/content-bn";
import { useResources } from "@/lib/resources";
import { useLanguage } from "@/lib/i18n";

export default function ResourcesPage() {
  const { resources, categories, loading, error } = useResources();
  const { t, lang } = useLanguage();
  const bn = lang === "bn";
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return resources.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (status !== "all" && r.verification !== status) return false;
      if (
        query &&
        !`${r.name} ${r.description} ${localize(r.name, "bn")} ${localize(r.description, "bn")}`
          .toLowerCase()
          .includes(query)
      )
        return false;
      return true;
    });
  }, [q, cat, status, resources]);

  return (
    <div>
      <PageHeader
        title={t("resourceDirectory")}
        subtitle={
          bn
            ? "আপনার ক্যাম্পাসের যাচাইকৃত সহায়তা।"
            : "Verified support at your campus."
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <label
            htmlFor="resource-search"
            className="mb-1 block text-sm font-medium"
          >
            {t("search")}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="resource-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="resource-category"
            className="mb-1 block text-sm font-medium"
          >
            {bn ? "বিভাগ" : "Category"}
          </label>
          <Select
            id="resource-category"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label={bn ? "বিভাগ" : "Category"}
          >
            <option value="all">{bn ? "সব বিভাগ" : "All categories"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {bn ? c.labelBn : c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="resource-status"
            className="mb-1 block text-sm font-medium"
          >
            {bn ? "অবস্থা" : "Status"}
          </label>
          <Select
            id="resource-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label={bn ? "অবস্থা" : "Status"}
          >
            <option value="all">{bn ? "সব অবস্থা" : "All statuses"}</option>
            <option value="verified">{t("verified")}</option>
            <option value="needs_review">{t("needsReview")}</option>
            <option value="expired">{t("expired")}</option>
            <option value="unverified">{t("unverified")}</option>
            <option value="archived">{t("archived")}</option>
          </Select>
        </div>
      </div>

      {loading && (
        <p role="status">{bn ? "রিসোর্স লোড হচ্ছে…" : "Loading resources…"}</p>
      )}
      {error && <p role="alert">{bn ? "রিসোর্স লোড করা যায়নি।" : error}</p>}
      {!loading &&
        !error &&
        (filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            {bn
              ? "কোনো মিল পাওয়া যায়নি। আমরা কিছু বানিয়ে বলি না — একজন মানুষের সাথে কথা বলতে পারেন।"
              : "No matches found. We don't invent resources — you can talk to a human instead."}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ))}
    </div>
  );
}
