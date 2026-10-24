
const { body } = require("express-validator");

exports.registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["candidate", "employer"])
    .withMessage("Role must be candidate or employer"),
  body("companyName").custom((value, { req }) => {
    if (req.body.role === "employer" && !value?.trim()) {
      throw new Error("Company name is required for employers");
    }
    return true;
  }),
];

exports.loginRules = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.jobRules = [
  body("title").trim().notEmpty().withMessage("Job title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("type")
    .isIn(["full-time", "part-time", "internship", "remote"])
    .withMessage("Invalid job type"),
  body("salary")
    .isFloat({ gt: 0 })
    .withMessage("Salary must be a positive number"),
  body("skills").isArray().withMessage("Skills must be an array"),
];
