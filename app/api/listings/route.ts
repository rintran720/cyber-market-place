import { NextResponse } from "next/server";
import { getListings, pushListing, getWeaponBySlug } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";
import type { Rarity, SubCategory, Weapon } from "@/lib/client/types";

const VALID_SUB: SubCategory[] = ["melee", "ranged", "energy-divine", "cursed", "1of1"];
const VALID_RARITY: Rarity[] = ["common", "rare", "epic", "legendary", "unique"];

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `listing-${Date.now()}`
  );
}

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(getListings());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await delay(800, 1500);
    maybeError(0.04);
    const draft = (await req.json()) as Partial<Weapon>;
    const required: (keyof Weapon)[] = [
      "name",
      "subCategory",
      "rarity",
      "priceNeon",
      "seller",
      "origin",
      "imageUrl",
      "stats",
      "lore",
      "stock",
      "tags",
    ];
    for (const k of required) {
      if (draft[k] === undefined || draft[k] === null) {
        throw new ApiError(400, "MISSING_FIELD", `Missing field: ${String(k)}`);
      }
    }
    if (!VALID_SUB.includes(draft.subCategory as SubCategory)) {
      throw new ApiError(400, "BAD_SUBCATEGORY", `Invalid subCategory: ${draft.subCategory}`);
    }
    if (!VALID_RARITY.includes(draft.rarity as Rarity)) {
      throw new ApiError(400, "BAD_RARITY", `Invalid rarity: ${draft.rarity}`);
    }
    if (draft.subCategory === "1of1" && (draft.rarity !== "unique" || draft.stock !== 1)) {
      throw new ApiError(
        400,
        "INVARIANT",
        "Sub-category 1of1 requires rarity=unique and stock=1.",
      );
    }
    let slug = slugify(draft.name as string);
    while (getWeaponBySlug(slug)) slug = slug + "-" + Math.random().toString(36).slice(2, 6);
    const weapon: Weapon = {
      slug,
      name: draft.name as string,
      subCategory: draft.subCategory as SubCategory,
      rarity: draft.rarity as Rarity,
      priceNeon: Math.max(1, Math.floor(draft.priceNeon as number)),
      seller: draft.seller as string,
      origin: draft.origin as string,
      imageUrl: draft.imageUrl as string,
      stats: draft.stats as Weapon["stats"],
      lore: draft.lore as string,
      stock: Math.max(1, Math.floor(draft.stock as number)),
      tags: (draft.tags as string[]) ?? [],
      createdAt: new Date().toISOString(),
    };
    const listing = pushListing(weapon);
    return NextResponse.json(listing);
  } catch (err) {
    return toErrorResponse(err);
  }
}
