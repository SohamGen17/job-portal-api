
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");

// Apply to a job (candidate only)
exports.applyToJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { coverLetter } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "open") {
      return res.status(409).json({
        success: false,
        message: "Cannot apply to a closed job",
      });
    }

    const existing = await Application.findOne({
      job: id,
      candidate: req.user.id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    const application = await Application.create({
      job: id,
      candidate: req.user.id,
      coverLetter,
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    next(error);
  }
};

// Get my applications (candidate)
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({
      candidate: req.user.id,
    })
      .populate("job")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// Get applications for a job (employer)
exports.getJobApplications = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot view applications for this job",
      });
    }

    const filter = { job: job._id };

    if (req.query.status) {
      const allowedStatuses = [
        "applied", "shortlisted", "rejected", "hired",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application status",
        });
      }

      filter.status = req.query.status;
    }

    const applications = await Application.find(filter)
      .populate("candidate", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// Update application status (employer)
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(id).populate("job");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this application",
      });
    }

    const transitions = {
      applied: ["shortlisted", "rejected"],
      shortlisted: ["hired", "rejected"],
      hired: [],
      rejected: [],
    };

    if (!transitions[application.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `An application cannot move from ${application.status} to ${status}`,
      });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// Withdraw application (candidate)
exports.withdrawApplication = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.candidate.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot withdraw someone else's application",
      });
    }

    if (application.status !== "applied") {
      return res.status(400).json({
        success: false,
        message: "Only applications with applied status can be withdrawn",
      });
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    next(error);
  }
};
