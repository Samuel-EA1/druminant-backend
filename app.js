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

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://druminant.vercel.app",
    "https://druminantfarm.vercel.app",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// ss

// security packages
app.use(helmet());
app.use(cors(corsOptions));
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

const farmLandRoutes = require("./routes/farmLand.routes/index");
const profileRoutes = require("./routes/profile");
const authRoutes = require("./routes/auth.routes/index");
const refreshToken = require("./routes/refreshToken.routes/index");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");
const { StatusCodes } = require("http-status-codes");

app.use(express.json());
// extra packages

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth", authMiddleware, refreshToken);
app.use("/api/v1/farmland", authMiddleware, farmLandRoutes);
app.use("/api/v1/profile", profileRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/", (req, res) => {
  res
    .status(StatusCodes.OK)
    .send(
      `<div><h1>Welcome to Druminant api.</h1> <a href='https://documenter.getpostman.com/view/18542024/2sA3XSCMwY#abfce83a-5344-4b41-859b-96d6959069e8'>Check our the documentation here</a> </div>`
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
