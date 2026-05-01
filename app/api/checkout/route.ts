import { NextResponse } from "next/server";
import {
  clearCart,
  getCartLines,
  getCartTotals,
  getWallet,
  pushOrder,
  setWalletBalance,
} from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, toErrorResponse } from "@/lib/api/error";
import type { Order } from "@/lib/client/types";

function genTxHash(): string {
  const hex = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 32; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

function genOrderId(): string {
  return "ord_" + Math.random().toString(36).slice(2, 10);
}

export async function POST(): Promise<Response> {
  try {
    await delay(1200, 1800);

    // 8% chance of simulated congestion
    if (Math.random() < 0.08) {
      throw new ApiError(503, "BLOCKCHAIN_CONGESTION", "Chain mempool full. Retry in a moment.");
    }

    const lines = getCartLines();
    if (lines.length === 0) {
      throw new ApiError(400, "EMPTY_CART", "Nothing to check out.");
    }

    const { total } = getCartTotals();
    const wallet = getWallet();
    if (wallet.balanceNeon < total) {
      throw new ApiError(
        402,
        "INSUFFICIENT_NEON",
        `Need ⟁ ${total.toLocaleString()}, have ⟁ ${wallet.balanceNeon.toLocaleString()}.`,
      );
    }

    setWalletBalance(wallet.balanceNeon - total);

    const order: Order = {
      id: genOrderId(),
      txHash: genTxHash(),
      lines,
      total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    pushOrder(order);
    clearCart();

    return NextResponse.json({ order, wallet: getWallet() });
  } catch (err) {
    return toErrorResponse(err);
  }
}
