import { NextResponse } from "next/server";
import { getSellerStats } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(getSellerStats());
  } catch (err) {
    return toErrorResponse(err);
  }
}
