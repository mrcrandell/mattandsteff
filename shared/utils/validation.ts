import { z } from "zod";

export const uploadValidation = z
  .object({
    message: z.string().trim().optional().default(""),
    name: z.string().trim().optional().default(""),
    phone: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.message && data.message.length > 0) {
      if (!data.name || data.name.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Please enter your name.",
          path: ["name"],
        });
      }
      if (!data.phone || data.phone.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Please enter your phone number.",
          path: ["phone"],
        });
      }
    }
  });

export const loginValidation = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});
