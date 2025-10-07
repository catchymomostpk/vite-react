import { ShoppingCart } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import type { CartItem } from "@shared/schema";

interface CartButtonProps {
  cart: CartItem[];
  onClick: () => void;
}

export function CartButton({ cart, onClick }: CartButtonProps) {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Button 
      onClick={onClick}
      className="relative bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
      disabled={cartCount === 0}
      data-testid="button-cart"
    >
      <ShoppingCart className="mr-2" size={20} />
      Cart
      {cartCount > 0 && (
        <Badge className="cart-badge absolute -top-2 -right-2 w-6 h-6 text-xs rounded-full flex items-center justify-center text-white" data-testid="cart-count">
          {cartCount}
        </Badge>
      )}
    </Button>
  );
}
