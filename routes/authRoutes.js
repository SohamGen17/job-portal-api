
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const protect = require("../middleware/auth");

const validate = require("../middleware/validate");

const {
  registerRules,
  loginRules,
} = require("../middleware/validationRules");

// Register route
router.post("/register", registerRules, validate, register);

// Login route
router.post("/login", loginRules, validate, login);

// Get logged-in user's profile
router.get("/me", protect, getMe);

module.exports = router;
