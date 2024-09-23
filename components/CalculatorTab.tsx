// components/CalculatorTab.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SimplifiedItem } from "@/types/SimplifiedItem";
import Fuse from "fuse.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

interface CalculatorTabProps {
  isPVE: boolean;
  itemsData: SimplifiedItem[];
  threshold: number;
  setThreshold: (value: number) => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  isPVE,
  itemsData,
  threshold,
  setThreshold,
}) => {
  const [selectedItems, setSelectedItems] = useState<
    Array<SimplifiedItem | null>
  >(Array(5).fill(null));
  const [total, setTotal] = useState<number>(0);
  const [fleaCosts, setFleaCosts] = useState<Array<number>>(Array(5).fill(0));
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [searchQueries, setSearchQueries] = useState<string[]>(
    Array(5).fill("")
  );
  const fuse = new Fuse(itemsData, { keys: ["name"], threshold: 0.3 });
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] =
    useState<boolean>(false);
  const [tempThreshold, setTempThreshold] = useState<string>(
    threshold.toLocaleString()
  );

  useEffect(() => {
    setTotal(
      selectedItems.reduce((sum, item) => sum + (item?.basePrice || 0), 0)
    );
    setFleaCosts(selectedItems.map((item) => (item ? item.price : 0)));
  }, [selectedItems]);

  useEffect(() => {
    // Reset selected items when isPVE changes
    setSelectedItems(Array(5).fill(null));
  }, [isPVE]); // Add isPVE as a dependency

  const updateSelectedItem = (itemId: string, index: number): void => {
    const selectedItem = itemsData.find((item) => item.uid === itemId) || null;
    const newSelectedItems = [...selectedItems];
    newSelectedItems[index] = selectedItem;
    setSelectedItems(newSelectedItems);
  };

  const handleResetItem = (index: number): void => {
    const newSelectedItems = [...selectedItems];
    newSelectedItems[index] = null;
    setSelectedItems(newSelectedItems);
  };

  const handleAutoSelect = async (): Promise<void> => {
    setIsCalculating(true);
    setProgressValue(0);

    const validItems: SimplifiedItem[] = itemsData.filter(
      (item) => item.price > 0
    );
    const interval = setInterval(() => {
      setProgressValue((prev) => (prev >= 100 ? 100 : prev + 10));
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const bestCombination = findBestCombination(validItems, threshold, 5);

    if (bestCombination.selected.length === 0) {
      alert("No combination of items meets the threshold.");
      setIsCalculating(false);
      clearInterval(interval);
      return;
    }

    const newSelectedItems: Array<SimplifiedItem | null> = Array(5).fill(null);
    bestCombination.selected.forEach((item, idx) => {
      if (idx < 5) {
        newSelectedItems[idx] = item;
      }
    });
    setSelectedItems(newSelectedItems);
    setSearchQueries(Array(5).fill(""));
    setIsCalculating(false);
    clearInterval(interval);
  };

  const findBestCombination = (
    validItems: SimplifiedItem[],
    threshold: number,
    maxItems: number
  ): { selected: SimplifiedItem[]; totalFleaCost: number } => {
    // Implement your combination logic here
    // For brevity, returning dummy data
    return {
      selected: validItems.slice(0, maxItems),
      totalFleaCost: validItems
        .slice(0, maxItems)
        .reduce((sum, item) => sum + item.price, 0),
    };
  };

  const handleThresholdSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const parsed = parseInt(tempThreshold.replace(/,/g, ""), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setThreshold(parsed);
      setIsThresholdDialogOpen(false);
    } else {
      alert("Please enter a valid positive number.");
    }
  };

  return (
    <div>
      {/* Threshold Display and Edit Button */}
      <div className="flex items-center justify-center mb-4 w-full">
        <span className="text-gray-500 mr-2">Threshold:</span>
        <span className="text-xl font-semibold text-gray-300">
          ₽{threshold.toLocaleString()}
        </span>
        <Dialog
          open={isThresholdDialogOpen}
          onOpenChange={setIsThresholdDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-1 p-0 bg-transparent hover:bg-transparent"
            >
              <Edit className="h-5 w-5 text-gray-400 hover:text-gray-200" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-gray-800 w-full mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Threshold</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleThresholdSubmit} className="space-y-4">
              <Input
                type="text"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(e.target.value)}
                placeholder="Enter a new threshold"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsThresholdDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 w-full">
        {isCalculating ? (
          <Progress
            className="mx-auto mt-4 mb-4 w-full"
            value={progressValue}
          />
        ) : (
          <Button
            variant="default"
            onClick={handleAutoSelect}
            className="flex mt-4 mx-auto text-gray-200 bg-gray-500 hover:bg-gray-900"
          >
            Auto Pick
          </Button>
        )}

        {/* Item Selection Dropdowns */}
        {selectedItems.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center space-y-1 flex-grow w-full"
          >
            <div className="flex items-center space-x-2 w-full justify-center">
              <Select
                onValueChange={(value: string) =>
                  updateSelectedItem(value, index)
                }
                value={item?.uid.toString() || ""}
              >
                <SelectTrigger className="w-full max-w-[400px] bg-gray-700 border-gray-600 text-gray-100 text-xs transition-all duration-300">
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-auto w-full">
                  {/* Search Input */}
                  <div className="px-2 py-1">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQueries[index]}
                      onChange={(e) => {
                        const newQueries = [...searchQueries];
                        newQueries[index] = e.target.value;
                        setSearchQueries(newQueries);
                      }}
                      className="w-full px-2 py-1 bg-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {/* Filtered Items */}
                  {itemsData
                    .filter((item) => item.price > 0)
                    .sort(
                      (a, b) => a.price / a.basePrice - b.price / b.basePrice
                    )
                    .map((item) => (
                      <SelectItem
                        key={item.uid}
                        value={item.uid.toString()}
                        className="text-gray-100 px-2 py-1"
                      >
                        {item.name} (₽{item.basePrice.toLocaleString()})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleResetItem(index)}
                className="bg-gray-700 hover:bg-gray-600 flex-shrink-0"
              >
                ×
              </Button>
            </div>
            {/* Display basePrice | flea cost */}
            {selectedItems[index] && fleaCosts[index] > 0 && (
              <div className="text-gray-500 text-xs">
                Value: ₽{selectedItems[index].basePrice.toLocaleString()} | Flea
                ≈ ₽{fleaCosts[index].toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sacrifice Value Display */}
      <div className="mt-6 text-center w-full">
        <h2 className="text-3xl font-bold mb-2 text-gray-300">
          Sacrifice Value
        </h2>
        <div
          className={`text-6xl font-extrabold ${
            total >= threshold
              ? "text-green-500 animate-pulse"
              : "text-red-500 animate-pulse"
          }`}
        >
          ₽{total.toLocaleString()}
        </div>
        {total < threshold && (
          <div className="text-red-500 mt-2">
            Remaining Value Needed: ₽{(threshold - total).toLocaleString()}
          </div>
        )}
        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-400">
            Flea Cost ≈ ₽
            {fleaCosts.reduce((sum, cost) => sum + cost, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
