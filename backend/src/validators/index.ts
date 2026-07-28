import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(1, 'Mobile is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  businessName: z.string().optional(),
  gst: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE'])
});

export const customerNotesSchema = z.object({
  notes: z.string().optional(),
  followUpDate: z.string().optional()
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative'),
  minStock: z.number().int().min(0, 'Minimum stock cannot be negative'),
  location: z.string().optional().or(z.literal(''))
});

export const stockMovementSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(1, 'Reason is required'),
  createdBy: z.string().email('Valid email is required for createdBy')
});

const challanItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  snapshotName: z.string().min(1),
  snapshotSku: z.string().min(1),
  snapshotPrice: z.number().positive()
});

export const challanSchema = z.object({
  challanNo: z.string().min(1),
  customerId: z.number().int().positive(),
  createdBy: z.string().email(),
  items: z.array(challanItemSchema).min(1, 'At least one item is required')
});
