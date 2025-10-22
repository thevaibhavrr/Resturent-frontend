import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Flame, Minus } from "lucide-react";

interface FoodCardProps {
  id: number;
  name: string;
  image: string;
  price: number;
  spiceLevel: number; // 0-100
  category: string;
  currentQuantity?: number; // Current quantity in cart
  onAddToCart: (item: { id: number; name: string; price: number; quantity: number }) => void;
  onUpdateQuantity?: (id: number, change: number) => void;
}

export function FoodCard({ id, name, image, price, spiceLevel, category, currentQuantity = 0, onAddToCart, onUpdateQuantity }: FoodCardProps) {
  const getSpiceColor = () => {
    if (spiceLevel === 0) return "text-gray-400";
    if (spiceLevel <= 30) return "text-yellow-500";
    if (spiceLevel <= 60) return "text-orange-500";
    return "text-red-600";
  };

  const getSpiceIcons = () => {
    const iconCount = Math.ceil(spiceLevel / 33.33);
    return Array.from({ length: 3 }, (_, i) => (
      <Flame
        key={i}
        className={`w-4 h-4 ${i < iconCount ? getSpiceColor() : "text-gray-300"}`}
        fill={i < iconCount ? "currentColor" : "none"}
      />
    ));
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg flex-1">{name}</h3>
          <div className="flex items-center gap-0.5 ml-2">
            {getSpiceIcons()}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xl text-primary">₹{price}</span>
          {currentQuantity > 0 ? (
            <div className="flex items-center gap-1 bg-primary text-primary-foreground rounded-md">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onUpdateQuantity?.(id, -1)}
                className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-2 min-w-[2rem] text-center">{currentQuantity}</span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onUpdateQuantity?.(id, 1)}
                className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              onClick={() => onAddToCart({ id, name, price, quantity: 1 })}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
