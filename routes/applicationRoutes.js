
const express = require("express");
const router = express.Router();

const {
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
} = require("../controllers/applicationController");

const protect = require("../middleware/auth");
const authorize = require("../middleware/role");

router.get("/my", protect, authorize("candidate"), getMyApplications);

router.patch(
  "/:id/status",
  protect,
  authorize("employer"),
  updateApplicationStatus
);

router.delete(
  "/:id",
  protect,
  authorize("candidate"),
  withdrawApplication
);

module.exports = router;
