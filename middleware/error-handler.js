const { CustomAPIError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const errorHandlerMiddleware = (err, req, res, next) => {
  console.log(err.name);

  // custom error obj
  let customError = {
    statusCode: (err.statusCode =
      err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR),
    message: err.message || "Something went wrong try again later",
  };

  // check for when user didn't provide email and password
  if (err.name === "ValidationError") {
    customError.message = Object.values(err.errors)
      .map(({ message }) => message)
      .join(",");
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // check for when user is trying to register with an already existing email
  if (err.code === 11000) {
    customError.message = "Duplicate email, please choose another email";
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.name === "CastError") {
    customError.message = "Not found";
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  // if (err instanceof CustomAPIError) {
  //   return res.status(err.statusCode).json({ msg: err.message })
  // }
  return res
    .status(customError.statusCode)
    .json({ message: customError.message });
};

module.exports = errorHandlerMiddleware;
