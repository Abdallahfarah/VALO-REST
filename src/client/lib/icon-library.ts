export interface IconItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

export const ICON_LIBRARY: IconItem[] = [
  { id: 'burger', name: 'Burger', emoji: '🍔', category: 'Fast Food' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', category: 'Fast Food' },
  { id: 'fries', name: 'Fries', emoji: '🍟', category: 'Fast Food' },
  { id: 'hotdog', name: 'Hot Dog', emoji: '🌭', category: 'Fast Food' },
  { id: 'sandwich', name: 'Sandwich', emoji: '🥪', category: 'Fast Food' },
  { id: 'taco', name: 'Taco/Wrap', emoji: '🌮', category: 'Fast Food' },
  { id: 'chicken', name: 'Chicken', emoji: '🍗', category: 'Poultry' },
  { id: 'steak', name: 'Steak/Meat', emoji: '🍖', category: 'Meat' },
  { id: 'rice', name: 'Rice', emoji: '🍚', category: 'Grains' },
  { id: 'curry', name: 'Curry/Stew', emoji: '🍛', category: 'Grains' },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', category: 'Pasta' },
  { id: 'coffee', name: 'Coffee', emoji: '☕', category: 'Drinks' },
  { id: 'tea', name: 'Tea', emoji: '🍵', category: 'Drinks' },
  { id: 'juice', name: 'Juice', emoji: '🍹', category: 'Drinks' },
  { id: 'softdrink', name: 'Soft Drink', emoji: '🥤', category: 'Drinks' },
  { id: 'beer', name: 'Beer', emoji: '🍺', category: 'Drinks' },
  { id: 'wine', name: 'Wine', emoji: '🍷', category: 'Drinks' },
  { id: 'milk', name: 'Milk', emoji: '🥛', category: 'Drinks' },
  { id: 'cake', name: 'Cake', emoji: '🍰', category: 'Desserts' },
  { id: 'cupcake', name: 'Cupcake/Donut', emoji: '🍩', category: 'Desserts' },
  { id: 'icecream', name: 'Ice Cream', emoji: '🍦', category: 'Desserts' },
  { id: 'dessert', name: 'Sundae', emoji: '🍨', category: 'Desserts' },
  { id: 'eggs', name: 'Breakfast/Eggs', emoji: '🍳', category: 'Breakfast' },
  { id: 'pancakes', name: 'Pancakes', emoji: '🥞', category: 'Breakfast' },
  { id: 'seafood', name: 'Fish/Seafood', emoji: '🍤', category: 'Seafood' },
  { id: 'sushi', name: 'Sushi', emoji: '🍣', category: 'Seafood' },
  { id: 'salad', name: 'Salad', emoji: '🥗', category: 'Sides' },
  { id: 'soup', name: 'Soup', emoji: '🍲', category: 'Sides' },
  { id: 'bakery', name: 'Croissant/Bread', emoji: '🥐', category: 'Bakery' },
  { id: 'apple', name: 'Apple/Fruit', emoji: '🍎', category: 'Fruits' },
  { id: 'banana', name: 'Banana', emoji: '🍌', category: 'Fruits' },
  { id: 'lemon', name: 'Lemon', emoji: '🍋', category: 'Fruits' },
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', category: 'Fruits' },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'Vegetables' },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'Vegetables' },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', category: 'Vegetables' },
  { id: 'popcorn', name: 'Popcorn/Snacks', emoji: '🍿', category: 'Snacks' },
  { id: 'cookie', name: 'Cookie', emoji: '🍪', category: 'Snacks' },
  { id: 'chocolate', name: 'Chocolate', emoji: '🍫', category: 'Snacks' }
];

export const getEmojiForIconId = (id: string): string => {
  const matched = ICON_LIBRARY.find(item => item.id === id);
  if (matched) return matched.emoji;
  
  // If the id itself is already an emoji (e.g. legacy data), return it
  if (id && id.length > 0 && id.charCodeAt(0) > 127) {
    return id;
  }
  return '🍔';
};

export const getIconIdForEmoji = (emoji: string): string => {
  const matched = ICON_LIBRARY.find(item => item.emoji === emoji);
  return matched ? matched.id : 'burger';
};
