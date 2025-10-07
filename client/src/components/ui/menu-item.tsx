import { Plus } from "lucide-react";
import { Button } from "./button";
import type { MenuItem } from "@shared/schema";

interface MenuItemProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToCart }: MenuItemProps) {
  return (
    <div 
      className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
      data-testid={`card-menu-item-${item.id}`}
    >
      <img 
        src={item.image} 
        alt={item.name} 
        className="w-full h-48 object-cover"
        data-testid={`img-menu-item-${item.id}`}
      />
      <div className="p-4">
        <h3 className="font-semibold text-secondary mb-1" data-testid={`text-item-name-${item.id}`}>
          {item.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3" data-testid={`text-item-description-${item.id}`}>
          {item.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary" data-testid={`text-item-price-${item.id}`}>
            ₹{item.price}
          </span>
          <Button
            onClick={() => onAddToCart(item)}
            size="sm"
            className="bg-primary text-primary-foreground w-8 h-8 rounded-full hover:bg-accent transition-colors p-0"
            data-testid={`button-add-to-cart-${item.id}`}
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
