import { NextResponse } from "next/server";
import {
  getCartItems,
  getCartLines,
  getCartTotals,
  getWeaponBySlug,
  removeCartLine,
  setCartQty,
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const { slug } = await ctx.params;
    if (!getWeaponBySlug(slug)) {
      throw new ApiError(400, "BAD_SLUG", `Unknown weapon slug: ${slug}`);
    }
    const body = (await req.json()) as { qty?: number };
    const qty = Math.max(0, Math.floor(body.qty ?? 0));
    setCartQty(slug, qty);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const { slug } = await ctx.params;
    removeCartLine(slug);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}
