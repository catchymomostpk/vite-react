import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart, Plus, Minus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { MenuItem, CartItem } from "@shared/schema";

const categories = ["All Items", "Tea", "Coffee", "Snacks", "Beverages"];

export default function SearchPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  // Filter items based on search query and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Items" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      let newCart;
      if (existing) {
        newCart = prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        newCart = [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
      }
      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      let newCart;
      if (existing && existing.quantity > 1) {
        newCart = prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else if (existing && existing.quantity === 1) {
        newCart = prev.filter(cartItem => cartItem.id !== item.id);
      } else {
        newCart = prev;
      }
      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const getItemQuantity = (itemId: string): number => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

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
    <div className="min-h-screen bg-background px-4 py-6 pb-28 sm:pb-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center justify-between gap-4">
            <Button 
              onClick={() => navigate("/menu")}
              variant="outline"
              size="sm"
              className="px-3 py-2 rounded-lg font-semibold"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Menu
            </Button>
            <div className="sm:hidden flex gap-2">
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="outline"
                size="sm"
                className="px-3 py-2"
              >
                Dashboard
              </Button>
              <Button 
                onClick={goToPayment}
                size="sm"
                className="relative bg-primary text-primary-foreground px-3 py-2"
                disabled={cartCount === 0}
              >
                <ShoppingCart className="mr-2" size={18} />
                Cart
                {cartCount > 0 && (
                  <Badge className="cart-badge absolute -top-2 -right-2 w-6 h-6 text-xs rounded-full flex items-center justify-center text-white">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Search Menu</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Find your favorite items</p>
          </div>
          <div className="hidden sm:flex gap-3">
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="px-6 py-3 rounded-lg font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              Dashboard
            </Button>
            <Button 
              onClick={goToPayment}
              className="relative bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
              disabled={cartCount === 0}
            >
              <ShoppingCart className="mr-2" size={20} />
              Cart
              {cartCount > 0 && (
                <Badge className="cart-badge absolute -top-2 -right-2 w-6 h-6 text-xs rounded-full flex items-center justify-center text-white">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search for items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-base sm:text-lg"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "secondary"}
                size="sm"
                className="whitespace-nowrap px-4 py-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="mb-4">
          <p className="text-sm sm:text-base text-muted-foreground">
            {searchQuery ? `Found ${filteredItems.length} items for "${searchQuery}"` : `Showing ${filteredItems.length} items`}
          </p>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
            >
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full aspect-square object-cover sm:h-48 sm:aspect-[4/3]"
              />
              <div className="p-4 sm:p-5">
                <h3 className="font-semibold text-secondary text-base sm:text-lg mb-1">
                  {item.name}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-[0.95rem] mb-3 line-clamp-3">
                  {item.description}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-lg sm:text-xl font-bold text-primary">
                    ₹{item.price}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {getItemQuantity(item.id) > 0 && (
                      <Button
                        onClick={() => removeFromCart(item)}
                        size="icon"
                        variant="outline"
                        className="w-8 h-8 rounded-full border-2"
                      >
                        <Minus size={14} />
                      </Button>
                    )}
                    {getItemQuantity(item.id) > 0 && (
                      <span className="min-w-[2rem] text-center font-semibold text-primary">
                        {getItemQuantity(item.id)}
                      </span>
                    )}
                    <Button
                      onClick={() => addToCart(item)}
                      size="icon"
                      className="bg-primary text-primary-foreground w-8 h-8 rounded-full hover:bg-accent transition-colors"
                      aria-label={`Add ${item.name} to cart`}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto mb-4 text-muted-foreground" size={48} />
            <p className="text-muted-foreground text-lg">
              {searchQuery ? `No items found for "${searchQuery}"` : "No items found in this category."}
            </p>
            {searchQuery && (
              <Button 
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        

        <footer className="mt-12 border-t border-border pt-4 text-center text-xs text-muted-foreground">
           
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



