require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");

// security packages
app.use(helmet());
app.use(cors());
app.use(xss());
// Express rate limiting to limit the number of requests from a particular client
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// DB
const connectDb = require("./db/connect");

// routes
const authRoutes = require("./routes/auth");
const jobsRoutes = require("./routes/jobs");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");
const { StatusCodes } = require("http-status-codes");

app.use(express.json());
// extra packages

app.use("/", (req,res) => {
  res.status(StatusCodes.OK).json({ msg: "Welcome to the Jobs-Api" });
});

// routes
app.use("/api/v1/jobs", authMiddleware, jobsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDb(process.env.MONGO_URI.toString());
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

// Export the Express app
module.exports = app;
