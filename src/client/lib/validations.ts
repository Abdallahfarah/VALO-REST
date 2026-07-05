import { z } from 'zod';

// ─── Restaurant Settings ───
export const restaurantSettingsSchema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
  phone: z.string().min(7, 'Enter a valid phone number').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  currency: z.string().min(1, 'Currency is required'),
});

export type RestaurantSettingsForm = z.infer<typeof restaurantSettingsSchema>;

// ─── Menu Item ───
export const menuItemSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional().or(z.literal('')),
});

export type MenuItemForm = z.infer<typeof menuItemSchema>;

// ─── Category ───
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
});

export type CategoryForm = z.infer<typeof categorySchema>;

// ─── Table ───
export const tableSchema = z.object({
  number: z.coerce.number().min(1, 'Table number must be at least 1'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').max(50, 'Capacity seems too large'),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']).optional(),
});

export type TableForm = z.infer<typeof tableSchema>;

// ─── Staff Invite ───
export const staffInviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  role: z.enum(['WAITER', 'KITCHEN_STAFF', 'CASHIER', 'ADMIN'], {
    required_error: 'Select a role',
  }),
});

export type StaffInviteForm = z.infer<typeof staffInviteSchema>;
