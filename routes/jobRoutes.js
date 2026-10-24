
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

const {
  applyToJob,
  getJobApplications,
} = require("../controllers/applicationController");


router.post(
  "/:id/apply",
  protect,
  authorize("candidate"),
  applyToJob
);

router.get(
  "/:id/applications",
  protect,
  authorize("employer"),
  getJobApplications
);

router.get("/", getJobs);
router.get("/:id", getJob);

router.post("/", protect, authorize("employer"), createJob);
router.put("/:id", protect, authorize("employer"), updateJob);
router.patch("/:id/close", protect, authorize("employer"), closeJob);
router.delete("/:id", protect, authorize("employer"), deleteJob);
router.get("/:id/stats", protect, authorize("employer"), getJobStats);

module.exports = router;

