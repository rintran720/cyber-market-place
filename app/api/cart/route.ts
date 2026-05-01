import { NextResponse } from "next/server";
import {
  addCartLine,
  clearCart,
  getCartItems,
  getCartLines,
  getCartTotals,
  getWeaponBySlug,
} from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";

function payload() {
  return {
    lines: getCartLines(),
    items: getCartItems(),
    ...getCartTotals(),
  };
}

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const body = (await req.json()) as { slug?: string; qty?: number };
    const slug = body.slug;
    const qty = Math.max(1, Math.floor(body.qty ?? 1));
    if (!slug || !getWeaponBySlug(slug)) {
      throw new ApiError(400, "BAD_SLUG", `Unknown weapon slug: ${slug}`);
    }
    addCartLine(slug, qty);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    clearCart();
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}
