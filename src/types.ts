export interface AppUser {
  uid: string;
  email: string;
  username?: string;
  role: 'admin' | 'staff';
  displayName?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  hasOptions?: boolean; // defaults to true, can be turned off for items without options
  hasSizes?: boolean; // whether item has size M & L
  priceL?: number; // optional custom price for size L (defaults to price + 5000)
}

export interface ItemOptions {
  size?: 'M' | 'L' | string;
  sweetener?: string;
  milkTemp?: string;
  sweetness?: string;
  itemNote?: string;
}

export const isMatchaOrCoffee = (category?: string, name?: string): boolean => {
  const str = `${category || ''} ${name || ''}`.toLowerCase();
  return str.includes('matcha') || str.includes('cà phê') || str.includes('cafe') || str.includes('coffee');
};

export const itemSupportsSizes = (item?: { category?: string; name?: string; hasSizes?: boolean } | null): boolean => {
  if (!item) return false;
  if (item.hasSizes === true) return true;
  return isMatchaOrCoffee(item.category, item.name);
};

export interface PaymentSettings {
  bankId?: string; // VietQR Bank code like VCB, MB, TCB, etc.
  bankName?: string; // Full bank name
  accountNo?: string;
  accountName?: string;
  qrImageUrl?: string; // Custom uploaded image URL or Data URL
  qrType?: 'vietqr' | 'custom_image';
  notePrefix?: string;
}

export interface OptionChoice {
  label: string;
  desc?: string;
  type?: 'cold' | 'hot' | 'warm' | 'none';
}

export interface PreparationOptionsSettings {
  sweeteners: OptionChoice[];
  milkTemps: OptionChoice[];
  sweetnessLevels: OptionChoice[];
  quickNotes: string[];
}

export interface CartItem extends MenuItem {
  cartItemId?: string; // unique ID in cart so items with different options don't collide
  quantity: number;
  options?: ItemOptions;
  itemNote?: string;
}

export type OrderStatus = 'in_kitchen' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber?: number;
  table?: string;
  customerName?: string;
  note?: string;
  timestamp: number;
  readyAt?: number;
  completedAt?: number;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  paymentMethod?: 'cash' | 'transfer';
  createdBy?: string;
  createdByName?: string;
}
