
const express = require("express");
const router = express.Router();

const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  closeJob,
  deleteJob,
  getJobStats,
} = require("../controllers/jobController");

const protect = require("../middleware/auth");
const authorize = require("../middleware/role");

router.get("/", getJobs);
router.get("/:id", getJob);

router.post("/", protect, authorize("employer"), createJob);
router.put("/:id", protect, authorize("employer"), updateJob);
router.patch("/:id/close", protect, authorize("employer"), closeJob);
router.delete("/:id", protect, authorize("employer"), deleteJob);
router.get("/:id/stats", protect, authorize("employer"), getJobStats);

module.exports = router;
