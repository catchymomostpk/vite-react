import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, BarChart3, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { MenuItem, CartItem } from "@shared/schema";

export default function MenuPage() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category).filter(cat => cat != null)));
    return ["All Items", ...uniqueCategories.sort()];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    // Show all menu items (including unavailable or out-of-stock) as requested
    let items = menuItems;

    // Filter by search query
    if (searchQuery.trim()) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "All Items") {
      items = items.filter(item => item.category === selectedCategory);
    }

    return items;
  }, [menuItems, searchQuery, selectedCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        // Increase quantity for existing item
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      // Add new item to cart
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing && existing.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else if (existing && existing.quantity === 1) {
        return prev.filter(cartItem => cartItem.id !== item.id);
      }
      return prev;
    });
  };

  const getItemQuantity = (itemId: string): number => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // ...existing code...

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsed: CartItem[] = JSON.parse(savedCart);
        setCart(parsed);
      } catch {
        localStorage.removeItem("cart");
      }
    }
  }, []);

  const goToPayment = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/payment");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-28 sm:pb-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary" data-testid="menu-title">Menu</h1>
            <p className="text-sm sm:text-base text-muted-foreground" data-testid="menu-subtitle">Select items to add to your order</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 sm:justify-end">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[140px] sm:flex-none sm:min-w-[0] px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors"
              data-testid="button-dashboard"
            >
              <BarChart3 className="mr-2" size={18} />
              Dashboard
            </Button>
            <Button 
              onClick={goToPayment}
              size="sm"
              className="relative flex-1 min-w-[140px] sm:flex-none sm:min-w-[0] bg-primary text-primary-foreground px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
              disabled={cartCount === 0}
              data-testid="button-cart"
            >
              <ShoppingCart className="mr-2" size={18} />
              Cart
              {cartCount > 0 && (
                <Badge className="cart-badge absolute -top-2 -right-2 w-6 h-6 text-xs rounded-full flex items-center justify-center text-white" data-testid="cart-count">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto sm:mx-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" size={20} />
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-3 text-base"
              data-testid="input-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Menu Categories */}
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "secondary"}
                size="sm"
                className="whitespace-nowrap px-4 py-2"
                data-testid={`button-category-${category.toLowerCase().replace(' ', '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="sm:max-h-none sm:overflow-visible max-h-[calc(100vh-260px)] overflow-y-auto pr-1 sm:pr-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
                  data-testid={`card-menu-item-${item.id}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-28 object-cover sm:h-48 sm:aspect-[4/3]"
                    data-testid={`img-menu-item-${item.id}`}
                    loading="lazy"
                  />
                  <div className="p-3 sm:p-5">
                    <h3 className="font-semibold text-secondary text-sm sm:text-lg mb-1" data-testid={`text-item-name-${item.id}`}>
                      {item.name}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-[0.95rem] mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3" data-testid={`text-item-description-${item.id}`}>
                      {item.description}
                    </p>
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base sm:text-xl font-bold text-primary" data-testid={`text-item-price-${item.id}`}>
                          ₹{item.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Stock: {item.stockQuantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {getItemQuantity(item.id) > 0 && (
                          <Button
                            onClick={() => removeFromCart(item)}
                            size="icon"
                            variant="outline"
                            className="w-8 h-8 rounded-full border-2"
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus size={14} />
                          </Button>
                        )}
                        {getItemQuantity(item.id) > 0 && (
                          <span
                            className="min-w-[2rem] text-center font-semibold text-primary"
                            data-testid={`text-quantity-${item.id}`}
                          >
                            {getItemQuantity(item.id)}
                          </span>
                        )}
                        <Button
                          onClick={() => addToCart(item)}
                          size="icon"
                          className="bg-primary text-primary-foreground w-8 h-8 rounded-full hover:bg-accent transition-colors"
                          data-testid={`button-add-to-cart-${item.id}`}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      {/* Stock limit enforcement removed - items can be added regardless of stock */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg" data-testid="text-no-items">
              No items found in this category.
            </p>
          </div>
        )}

        {/* Powered by Innowara */}
      

        <footer className="mt-12 border-t border-border pt-4 text-center text-xs text-muted-foreground">
           <p>©️ 2025 - 2026 Inwora.in</p>
        </footer>
      </div>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:hidden">
          <Button
            onClick={goToPayment}
            className="w-full bg-primary text-primary-foreground py-3 text-base font-semibold hover:bg-accent transition-colors"
            data-testid="button-cart-mobile"
          >
            Proceed to checkout · {cartCount} item{cartCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
