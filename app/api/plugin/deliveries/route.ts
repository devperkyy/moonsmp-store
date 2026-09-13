import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The old bulk-poll protocol is intentionally disabled because it could
// deliver to offline players and allowed two servers to race.
export async function GET() {
  return NextResponse.json(
    { error: "bulk_delivery_disabled", use: "/api/plugin/deliveries/claim" },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "old_result_protocol_disabled", use: "/api/plugin/deliveries/result" },
    { status: 410 },
  );
}
