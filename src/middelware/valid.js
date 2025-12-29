
const { ZodError } = require("zod");

const valid = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err) {
    // 1. Handle Zod validation errors first
    if (err instanceof ZodError) {
      // We are certain 'err.errors' exists here
      return res.status(400).json({
        success: false,
        errors: err?.errors?.map((e) => ({ // <-- Now this is safe
          path: e?.path.join("."),
          message: e?.message,
        })),
      });
    }

    // 2. Handle any other unexpected errors
    return res.status(500).json({
      success: false,
      message: "Something went wrong in validation",
    });
  }
};

module.exports = valid;