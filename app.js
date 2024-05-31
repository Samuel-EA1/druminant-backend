require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swaggerUi.json");

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

const adminRoutes = require("./routes/admin.routes/index");
const staffRoutes = require("./routes/staff.routes/index");
const farmLandRoutes = require("./routes/farmLand.routes/index");
const loginRoute = require("./routes/login");
const profileRoutes = require("./routes/profile")

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");
const { StatusCodes } = require("http-status-codes");

app.use(express.json());
// extra packages

// routes
app.use("/api/v1/auth", loginRoute);
app.use("/api/v1/auth/admin", adminRoutes);
app.use("/api/v1/auth/staff", staffRoutes);
app.use("/api/v1/farmland", authMiddleware, farmLandRoutes);
app.use("/api/v1/profile", authMiddleware, profileRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/", (req, res) => {
  res
    .status(StatusCodes.OK)
    .send(
      `<div><h1>Welcome to Job api.</h1> <a href='/api-docs'>Check our the documentation here</a> </div>`
    );
});

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
