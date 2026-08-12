export type MenuCategoryId = 'all' | 'seasonal' | 'coffee' | 'non-coffee' | 'cemilan-asin' | 'cemilan-manis' | 'main-course';

export interface ModifierOption {
  id: string;
  label: string; // e.g., "Hot", "Cold", "250ml (25K)", "1 Liter (75K)"
  priceDelta: number; // e.g., 0, 2000, 50000
}

export interface SelectedModifierOption {
  modifierId: string;
  modifierName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
}

export interface MenuItemModifier {
  id: string;
  name: string; // e.g., "Suhu / Temperature", "Varian Porsi / Kemasan"
  required: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategoryId;
  subcategory?: string;
  price: string; // Display price string, e.g. "22K" or "28K / 78K"
  numericBasePrice?: number; // Numeric base price in IDR, e.g. 22000
  priceLiter?: string;
  description?: string;
  isSeasonal?: boolean;
  isBestSeller?: boolean;
  isAvailable?: boolean; // Managed via Admin Stock Availability Toggle
  tags?: string[];
  temperature?: 'Hot / Cold' | 'Cold' | 'Hot';
  image?: string;
  modifiers?: MenuItemModifier[];
}

export interface CategoryInfo {
  id: MenuCategoryId;
  name: string;
  description: string;
}
