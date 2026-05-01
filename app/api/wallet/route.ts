import { NextResponse } from "next/server";
import { getWallet, setWalletBalance } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(getWallet());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const body = (await req.json()) as { amount?: number };
    const amount = Math.max(0, Math.floor(body.amount ?? 0));
    const next = getWallet().balanceNeon + amount;
    setWalletBalance(next);
    return NextResponse.json(getWallet());
  } catch (err) {
    return toErrorResponse(err);
  }
}
