import { IncomingMessage, ServerResponse } from "http";
import { NextHandler } from "next-connect";
import convertIncomingMessageToExpressRequest from "./request";
import convertServerResponseToExpressResponse from "./response";

const convertRequestAndResponseToExpressMiddleware = (
  req: IncomingMessage,
  res: ServerResponse & Partial<{ _req: any }>,
  next: NextHandler
) => {
  res._req = req;
  convertIncomingMessageToExpressRequest(req, next);
  convertServerResponseToExpressResponse(res, next);
  return next();
};

export default convertRequestAndResponseToExpressMiddleware;
