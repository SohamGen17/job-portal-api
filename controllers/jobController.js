
const Job = require("../models/Job");

// Create a job (employer only)

exports.createJob = async (req, res, next) => {
  try {
    const {
      title,
      description,
      location,
      type,
      salary,
      skills,
    } = req.body;

    if (
      !title ||
      !description ||
      !location ||
      !type ||
      salary === undefined ||
      !Array.isArray(skills)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required job fields",
      });
    }

    if (!Number.isFinite(Number(salary)) || Number(salary) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Salary must be a positive number",
      });
    }

    // Get company name from the logged-in employer
    const User = require("../models/User");
    const employer = await User.findById(req.user.id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    const job = await Job.create({
      title,
      description,
      companyName: employer.companyName,
      location,
      type,
      salary: Number(salary),
      skills,
      postedBy: employer._id,
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Get all jobs (public, with search, filters, sorting and pagination)
exports.getJobs = async (req, res, next) => {
  try {
    const {
      search,
      location,
      type,
      skill,
      minSalary,
      sort,
    } = req.query;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit",
      });
    }

    if (minSalary !== undefined &&
        (!Number.isFinite(Number(minSalary)) || Number(minSalary) < 0)) {
      return res.status(400).json({
        success: false,
        message: "minSalary must be a non-negative number",
      });
    }

    const filter = { status: "open" };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (type) filter.type = type;
    if (skill) filter.skills = { $regex: skill, $options: "i" };
    if (minSalary !== undefined) filter.salary = { $gte: Number(minSalary) };

    const allowedSorts = {
      salary: { salary: 1 },
      "-salary": { salary: -1 },
      createdAt: { createdAt: 1 },
      "-createdAt": { createdAt: -1 },
    };

    if (sort && !allowedSorts[sort]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option",
      });
    }

    const total = await Job.countDocuments(filter);
    const data = await Job.find(filter)
      .sort(allowedSorts[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Get one job
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};


const mongoose = require("mongoose");
const Application = require("../models/Application");

// Helper: validate ID and check job ownership
const getOwnedJob = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid job ID",
    });
    return null;
  }

  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404).json({
      success: false,
      message: "Job not found",
    });
    return null;
  }

  if (job.postedBy.toString() !== req.user.id) {
    res.status(403).json({
      success: false,
      message: "You are not authorized to manage this job",
    });
    return null;
  }

  return job;
};

// Update job
exports.updateJob = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req, res);
    if (!job) return;

    const allowedFields = [
      "title", "description", "location",
      "type", "salary", "skills",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    }

    await job.save();

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Close job
exports.closeJob = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req, res);
    if (!job) return;

    job.status = "closed";
    await job.save();

    res.status(200).json({
      success: true,
      message: "Job closed successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// Delete job and its applications
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req, res);
    if (!job) return;

    await Application.deleteMany({ job: job._id });
    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job and its applications deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get application statistics
exports.getJobStats = async (req, res, next) => {
  try {
    const job = await getOwnedJob(req, res);
    if (!job) return;

    const stats = await Application.aggregate([
      { $match: { job: job._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      applied: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    };

    stats.forEach((item) => {
      result[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

