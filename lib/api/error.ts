import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function maybeError(rate = 0.05): void {
  if (Math.random() < rate) {
    throw new ApiError(503, "ICE_INTERFERENCE", "Network ICE detected. Retry.");
  }
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: { code: "UNKNOWN", message: "Unexpected error" } },
    { status: 500 },
  );
}
