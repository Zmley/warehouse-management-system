import winston from "winston";
import expressWinston from "express-winston";

const loggerFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const httpLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console(), 
    new winston.transports.File({ filename: "logs/http.log" }), 
  ],
  format: loggerFormat,
  meta: true,
  expressFormat: true,
  colorize: false,
  requestWhitelist: ["method", "url", "body", "query", "params"],
});

export default httpLogger;