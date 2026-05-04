import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Client-side Zustand cart is active." });
}

