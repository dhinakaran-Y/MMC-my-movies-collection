import { z } from "zod";

export default function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const fields = parsed.error.issues.reduce((acc, issue) => {
        const field = issue.path.join(".") || "form";
        if (!acc[field]) acc[field] = [];
        acc[field].push(issue.message);
        return acc;
      }, {});

      return res.status(400).json({
        error: "Validation failed",
        fields,
      });
    }

    req.validateBody = parsed.data;
    next();
  };
}