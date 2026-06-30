// stores.brands
export type Brand = {
  title: string;
}

// stores.products
export type Product = {
  id: number;
  brand: string; // Value of Brand.title
  category: string;
  code: string; // Unique for brand-code.
}

// stores.items
export type Item = {
  sku: string;
  product: string; // Value of Product.code
  // none-indexed attributes
  color: string;
  price: number;
  stockCount: number;
}