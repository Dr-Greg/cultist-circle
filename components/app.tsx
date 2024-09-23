// app.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, FlameKindling} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import BetaBadge from "./ui/beta-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { SimplifiedItem } from "@/types/SimplifiedItem";
import { FeedbackForm } from "./feedback-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorTab } from "@/components/CalculatorTab";
import { RecipesTab } from "@/components/RecipesTab";

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const PVE_CACHE_KEY = "pveItemsCache";
const PVP_CACHE_KEY = "pvpItemsCache";

export function App() {
  const [isPVE, setIsPVE] = useState<boolean>(false); // Toggle between PVE and PVP
  const [threshold, setThreshold] = useState<number>(350001);
  const [isFeedbackFormVisible, setIsFeedbackFormVisible] = useState<boolean>(false);

  const [itemsDataPVP, setItemsDataPVP] = useState<SimplifiedItem[]>([]);
  const [itemsDataPVE, setItemsDataPVE] = useState<SimplifiedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dataFetchedRef = useRef(false);

  // Sample tarkovItems for RecipesTab
  const tarkovItems: { [key: string]: string[] } = {
    "LEDX Skin Transilluminator": ["Medical Tools", "Electronic Components", "Wires"],
    "Ophthalmoscope": ["Medical Tools", "Glass", "Electronic Components"],
    "Defibrillator": ["Car Battery", "Wires", "Capacitors"],
    "Intelligence Folder": ["Paper", "Secure Flash Drive", "SSD Drive"],
    "Military COFDM Wireless Signal Transmitter": ["Electronic Components", "Wires", "Military PCB"],
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    try {
      setLoading(true);
      const [pveData, pvpData] = await Promise.all([
        fetchCachedData("/api/pve-items", PVE_CACHE_KEY),
        fetchCachedData("/api/pvp-items", PVP_CACHE_KEY),
      ]);

      setItemsDataPVE(pveData);
      setItemsDataPVP(pvpData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Fetch Error: ${err.message}` : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchCachedData = async (url: string, cacheKey: string): Promise<SimplifiedItem[]> => {
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log(`Using cached data for ${cacheKey}`);
          return data;
        }
      }

      console.log(`Fetching fresh data for ${cacheKey}`);
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch data for ${cacheKey}`);
      }
      const data: SimplifiedItem[] = await response.json();
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
      return data;
    } catch (error) {
      console.error(`Error in fetchCachedData for ${cacheKey}:`, error);
      throw error;
    }
  };

  // Choose Data Based on Mode
  const itemsData: SimplifiedItem[] = isPVE ? itemsDataPVE : itemsDataPVP;

  // Handle Mode Toggle Reset
  const handleModeToggle = (checked: boolean): void => {
    setIsPVE(checked);
    // Optionally, reset other states if needed
  };

  // Render Loading and Error States
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-my_bg_image text-gray-100">
        <div className="text-center">
          <Progress className="mb-4" value={50} />
          <p>Loading data...</p>
        </div>
        <div className="flex justify-center mt-4">
          <a href="https://www.buymeacoffee.com/wilsman77" target="_blank" rel="noopener noreferrer">
            <Image
              src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png"
              alt="Buy Me A Coffee"
              width={120}
              height={30}
              priority={true}
            />
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-my_bg_image text-gray-100 p-4 overflow-auto ">
      <Card className="bg-gray-800 border-gray-700 shadow-lg max-h-fit overflow-auto py-8 px-6 relative w-full max-w-2xl mx-auto bg-opacity-50 ">
        {/* Dialog for Instructions */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="absolute top-4 left-2 animate-float hover:text-green-300 text-yellow-500">
              <HelpCircle className="h-10 w-10" />
            </div>
          </DialogTrigger>
          <DialogContent className="flex bg-gray-800 sm:max-w-[600px] sm:max-h-[90vh] max-h-[90vh] w-full mx-auto">
            <DialogHeader>
              <DialogTitle>How to Use</DialogTitle>
              <DialogDescription className="text-left">
                <ul>
                  <li>🔵 Toggle between PVE and PVP modes to use correct flea prices.</li>
                  <li>🔵 Select items from the dropdown to calculate the total sacrifice value.</li>
                  <li>🔵 Ensure the total value meets the cultist threshold of 350,001 (base value).</li>
                  <li>🔵 Use the Auto Pick button to find the cheapest costing combination that meets the threshold.</li>
                  <li>🔵 If the threshold is met, sacrifice the items to receive a 14-hour countdown.</li>
                  <li>🔵 Ability to edit the threshold value through the interface.</li>
                  <li>🔴 BUG: 14-hour result has known bug which can result in an empty reward.</li>
                  <li>🟢 Note: 14 HR Highest Value Outcome ≥ 350,001</li>
                  <li>🟢 Note: 6 HR | Quest / Hideout item = 400,000 (Not Fully Confirmed)</li>
                  <li>🟢 Note: Flea prices are live prices provided by tarko-market.</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <CardContent className="p-6">
          {/* Header with Title and Beta Badge */}
          <h1 className="sm:text-4xl text-2xl font-bold mb-2 text-center text-red-500 text-nowrap flex items-center justify-center w-full">
            <FlameKindling className="mr-2 text-red-450 animate-pulse" />
            Cultist Calculator
            <FlameKindling className="ml-2 text-red-450 animate-pulse" />
            <div className="ml-2">
              <BetaBadge />
            </div>
          </h1>

          {/* Mode Toggle (PVE/PVP) */}
          <div className="flex items-center justify-center mb-6 w-full">
            <Switch
              checked={isPVE}
              onCheckedChange={handleModeToggle}
              className="mr-2"
            />
            <span className="text-gray-300">
              {isPVE ? "PVE Mode" : "PVP Mode"}
            </span>
          </div>


          {/* Tabs for Calculator and Recipes */}
          <Tabs defaultValue="calculator">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="recipes">Recipes</TabsTrigger>
            </TabsList>
            <TabsContent value="calculator">
              <CalculatorTab
                isPVE={isPVE}
                itemsData={itemsData}
                threshold={threshold}
                setThreshold={setThreshold}
              />
            </TabsContent>
            <TabsContent value="recipes">
              <RecipesTab tarkovItems={tarkovItems} />
            </TabsContent>
          </Tabs>
        </CardContent>

        <Separator className="my-1" />

        {/* Footer with Credits and Links */}
        <footer className="mt-4 text-center text-gray-400 text-sm w-full">
          <a
            href="https://tarkov-market.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            Data provided by Tarkov Market
          </a>
          <div className="text-center mt-1">
            Credit to{" "}
            <a
              href="https://bio.link/verybadscav"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              VeryBadSCAV
            </a>{" "}
            for helping with this tool.
          </div>
          <div className="flex justify-center mt-4 space-x-4">
            <a href="https://www.buymeacoffee.com/wilsman77" target="_blank" rel="noopener noreferrer">
              <Image
                src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png"
                alt="Buy Me A Coffee"
                width={120}
                height={30}
                priority={true}
              />
            </a>
            <Button
              onClick={() => setIsFeedbackFormVisible(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
            >
              Feedback
            </Button>
          </div>
        </footer>
      </Card>
      <div className="background-credit">Background by Zombiee</div>
      <div className="background-creator">Created by Wilsman77</div>
      {isFeedbackFormVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <FeedbackForm onClose={() => setIsFeedbackFormVisible(false)} />
        </div>
      )}
    </div>
  );
}
