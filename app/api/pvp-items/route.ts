// app/api/pvp-items/route.ts

import { NextResponse } from "next/server";
import { SimplifiedItem } from "@/types/SimplifiedItem"; // Import SimplifiedItem
import { FILTER_TAGS, IGNORED_ITEMS } from "@/config/config"; // Import shared config

const PVP_API_URL = "https://api.tarkov-market.app/api/v1/items/all";

export async function GET() {
  try {
    const response = await fetch(PVP_API_URL, {
      headers: {
        "x-api-key": process.env.API_KEY || "",
      },
      cache: "no-store", // Disable caching
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch PVP data" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filter and transform data to SimplifiedItem[]
    const simplifiedData: SimplifiedItem[] = data
      .filter(
        (item: SimplifiedItem) =>
          FILTER_TAGS.some((tag) => item.tags?.includes(tag)) &&
          !IGNORED_ITEMS.includes(item.name)
      )
      .map((item: SimplifiedItem) => ({
        uid: item.uid,
        name: item.name,
        basePrice: item.basePrice,
        price: item.price,
      }))
      .sort((a: SimplifiedItem, b: SimplifiedItem) =>
        a.name.localeCompare(b.name)
      );

    return NextResponse.json(simplifiedData);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
