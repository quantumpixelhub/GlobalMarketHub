import { z } from 'zod';

// Bangladesh phone number regex: +8801XXXXXXXXX or 01XXXXXXXXX
const PHONE_REGEX = /^\+?880\d{9,10}$/;

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid Bangladesh phone number (e.g., +8801712345678)'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&]/, 'Must contain special character (@, $, !, %, *, ?, &)'),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const createProductSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be at most 255 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  price: z.number()
    .positive('Price must be positive'),
  categoryId: z.string()
    .min(1, 'Category is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid phone number'),
});

// Type exports for use in API routes
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Order schemas
export const guestInfoSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid Bangladesh phone number'),
  firstName: z.string()
    .min(2, 'First name required')
    .max(50, 'Name too long'),
  lastName: z.string()
    .min(2, 'Last name required')
    .max(50, 'Name too long'),
  division: z.string()
    .min(1, 'Division required'),
  district: z.string()
    .min(1, 'District required'),
  upazila: z.string()
    .min(1, 'Upazila required'),
  address: z.string()
    .min(5, 'Address too short')
    .max(500, 'Address too long'),
  postCode: z.string().optional(),
  label: z.string().optional(),
});

export const guestCartItemSchema = z.object({
  productId: z.string()
    .min(1, 'Product ID required'),
  title: z.string()
    .min(1, 'Title required'),
  quantity: z.number()
    .int('Quantity must be integer')
    .positive('Quantity must be positive')
    .max(100, 'Max quantity is 100'),
  price: z.number()
    .positive('Price must be positive'),
  mainImage: z.string().optional(),
  sourceType: z.enum(['LOCAL', 'IMPORTED']).optional(),
  certifications: z.array(z.string()).optional(),
  specifications: z.record(z.string()).optional(),
});

export const createOrderSchema = z.object({
  cartId: z.string().optional(),
  shippingAddressId: z.string().optional(),
  directItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    variantId: z.string().optional(),
  })).optional(),
  isGuestCheckout: z.boolean().default(false),
  guestInfo: guestInfoSchema.optional(),
  guestCartItems: z.array(guestCartItemSchema).optional(),
  createAccount: z.boolean().default(false),
  deliveryArea: z.enum(['inside-dhaka', 'outside-dhaka']).default('inside-dhaka'),
  deliverySpeed: z.enum(['standard', 'express']).default('standard'),
  rankingExperimentKey: z.string().optional(),
  rankingVariant: z.enum(['A', 'B']).optional(),
});

export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type GuestCartItemInput = z.infer<typeof guestCartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// User address schema
export const createAddressSchema = z.object({
  label: z.string()
    .min(2, 'Label too short')
    .max(50, 'Label too long'),
  firstName: z.string()
    .min(2, 'First name required')
    .max(50, 'Name too long'),
  lastName: z.string()
    .min(2, 'Last name required')
    .max(50, 'Name too long'),
  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid phone number'),
  email: z.string()
    .email('Invalid email'),
  division: z.string()
    .min(1, 'Division required'),
  district: z.string()
    .min(1, 'District required'),
  upazila: z.string()
    .min(1, 'Upazila required'),
  address: z.string()
    .min(5, 'Address too short')
    .max(500, 'Address too long'),
  postCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

// Product schema - enhanced
export const productVariantSchema = z.object({
  attributeName: z.string()
    .min(1, 'Attribute name required')
    .max(100, 'Attribute too long'),
  attributeValue: z.string()
    .min(1, 'Attribute value required')
    .max(100, 'Value too long'),
  price: z.number()
    .positive('Price must be positive'),
  stock: z.number()
    .int('Stock must be integer')
    .nonnegative('Stock cannot be negative'),
  sku: z.string()
    .min(1, 'SKU required')
    .max(100, 'SKU too long'),
});

export const updateProductSchema = z.object({
  title: z.string()
    .min(3, 'Title too short')
    .max(255, 'Title too long')
    .optional(),
  description: z.string()
    .min(10, 'Description too short')
    .max(5000, 'Description too long')
    .optional(),
  price: z.number()
    .positive('Price must be positive')
    .optional(),
  stock: z.number()
    .int('Stock must be integer')
    .nonnegative('Stock cannot be negative')
    .optional(),
  categoryId: z.string()
    .min(1, 'Category required')
    .optional(),
  mainImage: z.string()
    .url('Invalid image URL')
    .optional(),
  variants: z.array(productVariantSchema).optional(),
  isActive: z.boolean().optional(),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Category schema
export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long'),
  slug: z.string()
    .min(2, 'Slug too short')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string()
    .min(5, 'Description too short')
    .max(1000, 'Description too long'),
  icon: z.string()
    .url('Invalid icon URL')
    .optional(),
  parentId: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Review schema
export const createReviewSchema = z.object({
  productId: z.string()
    .min(1, 'Product ID required'),
  rating: z.number()
    .int('Rating must be integer')
    .min(1, 'Rating minimum 1')
    .max(5, 'Rating maximum 5'),
  title: z.string()
    .min(5, 'Title too short')
    .max(100, 'Title too long'),
  content: z.string()
    .min(10, 'Content too short')
    .max(2000, 'Content too long'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// Payment schema
export const createPaymentSchema = z.object({
  orderId: z.string()
    .min(1, 'Order ID required'),
  method: z.enum(['CARD', 'BKASH', 'NAGAD', 'ROCKET'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  amount: z.number()
    .positive('Amount must be positive'),
  transactionId: z.string()
    .min(1, 'Transaction ID required')
    .max(100, 'Transaction ID too long'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
