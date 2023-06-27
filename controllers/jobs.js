const jobModel = require("../models/Job");
const { StatusCodes } = require("http-status-codes");

const BadRequestError = require("../errors/bad-request");
const { Mongoose, isValidObjectId } = require("mongoose");
const notFound = require("../middleware/not-found");
const { NotFoundError } = require("../errors");

// create job
const createJob = async (req, res) => {
  const { company, position } = req.body;

  if (!company.trim() || !position.trim()) {
    throw new BadRequestError("Please enter conpany and position");
  }

  req.body.createdBy = req.user.id;
  const job = await jobModel.create(req.body);
  console.log(job);
  res.status(StatusCodes.CREATED).json(job);
};

// get all jobs
const getAllJobs = async (req, res) => {
  const allJobs = await jobModel.find({ createdBy: req.user.id });
  res.status(StatusCodes.OK).json({ jobs: allJobs, mbHits: allJobs.length });
};

// get single job
const getJob = async (req, res) => {
  const {
    params: { id },
    user: { id: userId },
  } = req;

  // check if the id is a valid mongo id
  // if (!isValidObjectId(id)) {
  //   throw new BadRequestError("Please enter a valid job id");
  // }

  const job = await jobModel.findOne({ _id: id, createdBy: userId });

  if (!job) {
    throw new NotFoundError("Not found");
  }
  res.status(StatusCodes.OK).json(job);
};

// update job
const updateJob = async (req, res) => {
  const {
    params: { id },
    user: { id: userId },
  } = req;

  if (req.body.company.trim() === "" || req.body.position.trim() === "")
    throw new BadRequestError("Please enter company and position");
  // perform update
  const updatedJob = await jobModel.findOneAndUpdate(
    {
      _id: id,
      createdBy: userId,
    },
    req.body,
    { new: true }
  );

  // throw error if no job found
  if (!updatedJob) {
    throw new NotFoundError("Not found");
  }

  res.status(StatusCodes.OK).json(updatedJob);
};

const deleteJob = async (req, res) => {
  const {
    params: { id },
    user: { id: userId },
  } = req;

  // // check if the id is a valid mongo id
  // if (!isValidObjectId(id)) {
  //   throw new BadRequestError("Please enter a valid job id");
  // }

  // perform delete
  const deleteJob = await jobModel.findByIdAndDelete({
    _id: id,
    createdBy: userId,
  });

  // throw error if no job found
  if (!deleteJob) {
    throw new NotFoundError("Not found");
  }

  res.status(200).send("Deleted");
};

module.exports = {
  createJob,
  getAllJobs,
  getJob,
  updateJob,
  deleteJob,
};
