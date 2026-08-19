import { NextResponse } from "next/server";
import { getSources } from "@/lib/providers/watchmodeAdapter";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region") || "";
    const types = searchParams.get("types") || "";

    const sources = await getSources(region, types);
    return NextResponse.json(sources || []);
  } catch (error) {
    console.error("Watchmode sources API route error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
