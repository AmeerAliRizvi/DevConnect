
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

    if (err instanceof ZodError) {
    
      return res.status(400).json({
        success: false,
        errors: err?.errors?.map((e) => ({ 
          path: e?.path.join("."),
          message: e?.message,
        })),
      });
    }


    return res.status(500).json({
      success: false,
      message: "Something went wrong in validation",
    });
  }
};

module.exports = valid;