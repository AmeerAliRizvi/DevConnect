
const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^[A-Z]/, "Password must start with a capital letter")
  .regex(/\d/, "Password must contain at least one digit")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

const signupSchema = z.object({
  body: z
    .object({
      firstName: z
        .string({
          required_error: "Name is required",
        })
        .min(3, "Name must be at least 3 characters"),

        lastName: z
        .string()
        .optional(),

      emailId: z
        .email("Invalid email format"),

      password: passwordSchema,

      age: z.coerce
    .number({
        invalid_type_error: "Age must be a number",
    })
    .int("Age must be a whole number")
    .positive("Age must be positive"),
      

      gender: z.enum(["male", "female", "other"])
    }),
});

const loginSchema = z.object({
  body: z.object({
    emailId: z
      
      .email("Invalid email format"),


    password: z
      .string({
        required_error: "Password is required",
      })
      .min(8, "Password must be at least 8 characters"),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
};
