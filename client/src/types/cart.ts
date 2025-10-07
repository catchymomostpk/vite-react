export interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
}
