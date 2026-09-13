import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "web",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}