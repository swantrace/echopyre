import type { IncomingMessage, ServerResponse } from "http";
import { NextHandler } from "next-connect";
import parseurl from "parseurl";
import qs from "qs";
import accepts from "accepts";

function header(this: any, name: any) {
  if (!name) {
    throw new TypeError("name argument is required to req.get");
  }

  if (typeof name !== "string") {
    throw new TypeError("name must be a string to req.get");
  }

  var lc = name.toLowerCase();

  switch (lc) {
    case "referer":
    case "referrer":
      return this.headers.referrer || this.headers.referer;
    default:
      return this.headers[lc];
  }
}

function acceptsF(this: any) {
  var accept = accepts(this);
  // @ts-ignore
  return accept.types.apply(accept, arguments);
}

function convertIncomingMessageToExpressRequest(
  req: IncomingMessage &
    Partial<{
      query: string;
      get: Function;
      header: Function;
      accepts: Function;
      next: NextHandler;
      originalUrl: string | undefined;
    }>,
  next: NextHandler
) {
  req.next = next;
  req.originalUrl = req.originalUrl || req.url;
  if (!req.query) {
    // @ts-ignore
    const val = parseurl(req).query;
    // @ts-ignore
    req.query = qs.parse(val);
  }
  req.accepts = acceptsF.bind(req);
  req.get = req.header = header.bind(req);
  return req;
}

export default convertIncomingMessageToExpressRequest;
