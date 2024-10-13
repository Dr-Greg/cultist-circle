// app/api/pve-items/route.ts

import { NextResponse } from "next/server";
import { SimplifiedItem } from "@/types/SimplifiedItem";
import { IGNORED_ITEMS } from "@/config/config";
import limiter from "@/app/lib/rateLimiter";
import { GraphQLResponse } from "@/types/GraphQLResponse";
import { getCachedData } from "@/config/cache";

const GRAPHQL_API_URL = "https://api.tarkov.dev/graphql";
const CACHE_KEY = "pve-items";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: simplifiedData, timestamp } = await getCachedData(
      CACHE_KEY,
      async () => {
        console.log(
          `[${new Date().toISOString()}] Fetching PVE items from GraphQL API`
        );

        const query = `
          {
            items(gameMode: pve) {
              id
              name
              basePrice
              lastLowPrice
              updated
              categories {
                normalizedName
              }
            }
          }
        `;

        console.log(
          `[${new Date().toISOString()}] Sending request to GraphQL API`
        );
        const response = await limiter.schedule(() =>
          fetch(GRAPHQL_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ query }),
          })
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            `[${new Date().toISOString()}] Error fetching PVE data:`,
            errorData.errors || "Failed to fetch PVE data"
          );
          throw new Error(
            errorData.errors?.[0]?.message || "Failed to fetch PVE data"
          );
        }

        const jsonData: GraphQLResponse = await response.json();
        console.log(
          `[${new Date().toISOString()}] Received data from API`,
          jsonData.data.items.slice(0, 2)
        );

        if (!jsonData.data?.items) {
          throw new Error("Invalid data structure from GraphQL API");
        }

        const simplifiedData: SimplifiedItem[] = jsonData.data.items
          .filter(
            (item) =>
              !IGNORED_ITEMS.includes(item.name) && item.lastLowPrice !== null
          )
          .map((item) => ({
            uid: item.id,
            name: item.name,
            basePrice: item.basePrice,
            price: item.lastLowPrice!,
            updated: item.updated,
            tags: item.categories.map((category) => category.normalizedName),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log(
          `[${new Date().toISOString()}] Simplified data`,
          simplifiedData.slice(0, 2)
        );

        return simplifiedData;
      },
      CACHE_DURATION
    );

    if (simplifiedData.length === 0) {
      console.log(`[${new Date().toISOString()}] No PVE items available`);
      return NextResponse.json(
        {
          data: [],
          message: "No PVE items available at the moment.",
          timestamp,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ data: simplifiedData, timestamp });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(
      `[${new Date().toISOString()}] Error handling PVE GET request:`,
      errorMessage
    );
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
