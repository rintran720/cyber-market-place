"use client";

import { useState } from "react";
import { useListings } from "@/lib/client/hooks/useListings";
import { StepperShell } from "@/components/seller/StepperShell";
import { Step1Category } from "@/components/seller/Step1Category";
import { Step2Media } from "@/components/seller/Step2Media";
import { Step3PriceStats } from "@/components/seller/Step3PriceStats";
import { Step4Preview } from "@/components/seller/Step4Preview";
import type { Rarity, SubCategory, Weapon } from "@/lib/client/types";

const STEPS = ["Category", "Media", "Price & Stats", "Publish"];

const empty: Omit<Weapon, "slug" | "createdAt"> = {
  name: "",
  subCategory: "melee",
  rarity: "common",
  priceNeon: 100,
  seller: "john-tran",
  origin: "",
  imageUrl: "/items/starter-blade.svg",
  stats: { damage: 30, speed: 50, range: 10, soulCost: 5 },
  lore: "",
  stock: 1,
  tags: [],
};

export default function NewListingPage() {
  const { createListing } = useListings();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(empty);
  const [isPublishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onPublish = async () => {
    setPublishing(true);
    try {
      const created = await createListing(draft);
      setPublishedSlug(created.slug);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <StepperShell steps={STEPS} current={publishedSlug ? STEPS.length - 1 : step}>
        {step === 0 && (
          <Step1Category
            value={draft.subCategory}
            onChange={(v: SubCategory) =>
              setDraft({
                ...draft,
                subCategory: v,
                rarity: v === "1of1" ? "unique" : draft.rarity,
                stock: v === "1of1" ? 1 : draft.stock,
              })
            }
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <Step2Media
            value={{ name: draft.name, imageUrl: draft.imageUrl, tags: draft.tags }}
            onChange={(v) => setDraft({ ...draft, ...v })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 2 && (
          <Step3PriceStats
            is1of1={draft.subCategory === "1of1"}
            value={{
              rarity: draft.rarity as Rarity,
              priceNeon: draft.priceNeon,
              origin: draft.origin,
              stock: draft.stock,
              stats: draft.stats,
              lore: draft.lore,
            }}
            onChange={(v) => setDraft({ ...draft, ...v })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <Step4Preview
            draft={draft}
            isPublishing={isPublishing}
            publishedSlug={publishedSlug}
            onBack={goBack}
            onPublish={onPublish}
          />
        )}
      </StepperShell>
    </div>
  );
}
