import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    const { id } = await ctx.params;
    const order = getOrderById(id);
    if (!order) {
      throw new ApiError(404, "NOT_FOUND", `No order with id "${id}"`);
    }
    return NextResponse.json(order);
  } catch (err) {
    return toErrorResponse(err);
  }
}
