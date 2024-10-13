// types/GraphQLResponse.ts

export interface Category {
  name: string;
}

export interface GraphQLItem {
  id: string;
  name: string;
  basePrice: number;
  lastLowPrice: number | null; // Allow null
  updated: string;
  categories: { normalizedName: string }[];
}

export interface GraphQLResponse {
  data: {
    items: GraphQLItem[];
  };
  errors?: unknown[];
}
