import { NextResponse } from "next/server";
import { getWeaponBySlug } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    const { slug } = await ctx.params;
    const weapon = getWeaponBySlug(slug);
    if (!weapon) throw new ApiError(404, "NOT_FOUND", `No weapon with slug "${slug}"`);
    return NextResponse.json(weapon);
  } catch (err) {
    return toErrorResponse(err);
  }
}
