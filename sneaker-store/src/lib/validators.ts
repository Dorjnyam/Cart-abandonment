import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const orderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      size: z.number().int().min(1),
      color: z.string().min(1),
      qty: z.number().int().min(1).max(20),
    })
  ).min(1),
  couponCode: z.string().optional(),
  paymentMethod: z.string().min(1),
  deliveryOption: z.enum(["standard", "express"]).optional(),
  deliveryAddress: z.object({
    name: z.string().min(1),
    phone: z.string().min(3),
    street: z.string().min(1),
    district: z.string().min(1),
  }),
});

