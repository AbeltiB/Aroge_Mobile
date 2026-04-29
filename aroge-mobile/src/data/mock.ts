export interface Product {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: 'New' | 'Like New' | 'Good';
  category: string;
  description: string;
}

export const products: Product[] = [
  { id: 'p1', title: 'iPhone 13 Pro 256GB', price: 42000, location: 'Bole', condition: 'Like New', category: 'Electronics', description: 'Battery health 90%, clean condition, with charger.' },
  { id: 'p2', title: 'Modern Sofa Set', price: 9800, location: 'Kazanchis', condition: 'Good', category: 'Furniture', description: '3+2 set, no tears, slightly used.' },
  { id: 'p3', title: 'MacBook Air M1', price: 55000, location: 'Sarbet', condition: 'Like New', category: 'Electronics', description: '8/256, barely used, includes box.' },
];

export const storyCards = [
  { id: 's1', title: 'Hot Deals', subtitle: 'Today only', emoji: '🔥' },
  { id: 's2', title: 'Trusted Sellers', subtitle: 'Verified profile', emoji: '🛡️' },
  { id: 's3', title: 'Nearby', subtitle: 'Around Addis', emoji: '📍' },
];
