import type { ServerResponse } from "http";
import deprecated from "depd";
import encodeUrl from "encodeurl";
import send from "send";
import statuses from "statuses";
import escapeHtml from "escape-html";
import vary from "vary";
import { NextHandler } from "next-connect";
import contentType from "content-type";
import { Buffer } from "safe-buffer";

const deprecate = deprecated("express");
const mime = send.mime;
const charsetRegExp = /;\s*charset\s*=/;

function setCharset(type: string, charset: string) {
  if (!type || !charset) {
    return type;
  }

  // parse type
  var parsed = contentType.parse(type);

  // set charset
  parsed.parameters.charset = charset;

  // format type
  return contentType.format(parsed);
}

function contentTypeF(this: any, type: string) {
  var ct = type.indexOf("/") === -1 ? mime.lookup(type) : type;

  return this.set("Content-Type", ct);
}

function sendF(this: any, body: any) {
  var chunk = body;
  var encoding: string | undefined = "utf-8";
  var req = this._req;
  var type;

  // settings
  // var app = this.app;

  // allow status / body
  if (arguments.length === 2) {
    // res.send(body, status) backwards compat
    if (typeof arguments[0] !== "number" && typeof arguments[1] === "number") {
      deprecate(
        "res.send(body, status): Use res.status(status).send(body) instead"
      );
      this.statusCode = arguments[1];
    } else {
      deprecate(
        "res.send(status, body): Use res.status(status).send(body) instead"
      );
      this.statusCode = arguments[0];
      chunk = arguments[1];
    }
  }

  // disambiguate res.send(status) and res.send(status, num)
  if (typeof chunk === "number" && arguments.length === 1) {
    // res.send(status) will set status message as text string
    if (!this.get("Content-Type")) {
      this.type("txt");
    }

    deprecate("res.send(status): Use res.sendStatus(status) instead");
    this.statusCode = chunk;
    chunk = statuses[chunk];
  }

  switch (typeof chunk) {
    // string defaulting to html
    case "string":
      if (!this.get("Content-Type")) {
        this.type("html");
      }
      break;
    case "boolean":
    case "number":
    case "object":
      if (chunk === null) {
        chunk = "";
      } else if (Buffer.isBuffer(chunk)) {
        if (!this.get("Content-Type")) {
          this.type("bin");
        }
      } else {
        return this.json(chunk);
      }
      break;
  }

  // write strings in utf-8
  if (typeof chunk === "string") {
    encoding = "utf8";
    type = this.get("Content-Type");

    // reflect this in content-type
    if (typeof type === "string") {
      this.set("Content-Type", setCharset(type, "utf-8"));
    }
  }

  // determine if ETag should be generated
  // var etagFn = app.get("etag fn");
  // var generateETag = !this.get("ETag") && typeof etagFn === "function";
  // temp:
  const generateETag = false;

  // populate Content-Length
  var len;
  if (chunk !== undefined) {
    if (Buffer.isBuffer(chunk)) {
      // get length of Buffer
      len = chunk.length;
    } else if (!generateETag && chunk.length < 1000) {
      // just calculate length when no ETag + small chunk
      len = Buffer.byteLength(chunk, encoding);
    } else {
      // convert chunk to Buffer and calculate
      chunk = Buffer.from(chunk, encoding);
      encoding = undefined;
      len = chunk.length;
    }

    this.set("Content-Length", len);
  }

  // populate ETag
  // var etag;
  // if (generateETag && len !== undefined) {
  //   if ((etag = etagFn(chunk, encoding))) {
  //     this.set("ETag", etag);
  //   }
  // }

  // freshness
  if (req.fresh) this.statusCode = 304;

  // strip irrelevant headers
  if (204 === this.statusCode || 304 === this.statusCode) {
    this.removeHeader("Content-Type");
    this.removeHeader("Content-Length");
    this.removeHeader("Transfer-Encoding");
    chunk = "";
  }

  if (req.method === "HEAD") {
    // skip body for HEAD
    this.end();
  } else {
    // respond
    this.end(chunk, encoding);
  }

  return this;
}

function status(this: any, code: any) {
  this.statusCode = code;
  return this;
}

function get(this: any, field: any) {
  return this.getHeader(field);
}

function varyF(this: any, field: any) {
  // checks for back-compat
  if (!field || (Array.isArray(field) && !field.length)) {
    deprecate("res.vary(): Provide a field name");
    return this;
  }

  vary(this, field);

  return this;
}

function acceptParams(str: string, index?: number) {
  var parts = str.split(/ *; */);
  var ret = { value: parts[0], quality: 1, params: {}, originalIndex: index };

  for (var i = 1; i < parts.length; ++i) {
    var pms = parts[i].split(/ *= */);
    if ("q" === pms[0]) {
      ret.quality = parseFloat(pms[1]);
    } else {
      // @ts-ignore
      ret.params[pms[0]] = pms[1];
    }
  }

  return ret;
}

function normalizeType(type: any) {
  return ~type.indexOf("/")
    ? acceptParams(type)
    : { value: mime.lookup(type), params: {} };
}

function normalizeTypes(types: any[]) {
  var ret = [];

  for (var i = 0; i < types.length; ++i) {
    ret.push(exports.normalizeType(types[i]));
  }

  return ret;
}

function header(this: any, field: any, val: any) {
  if (arguments.length === 2) {
    var value = Array.isArray(val) ? val.map(String) : String(val);

    // add charset to content-type
    if (field.toLowerCase() === "content-type") {
      if (Array.isArray(value)) {
        throw new TypeError("Content-Type cannot be set to an Array");
      }
      if (!charsetRegExp.test(value)) {
        // @ts-ignore
        var charset = mime.charsets.lookup(value.split(";")[0]);
        if (charset) value += "; charset=" + charset.toLowerCase();
      }
    }

    this.setHeader(field, value);
  } else {
    for (var key in field) {
      this.set(key, field[key]);
    }
  }
  return this;
}

function format(this: any, obj: any) {
  var req = this._req;
  var next = req.next;

  var fn = obj.default;
  if (fn) delete obj.default;
  var keys = Object.keys(obj);

  var key = keys.length > 0 ? req.accepts(keys) : false;

  this.vary("Accept");

  if (key) {
    this.set("Content-Type", normalizeType(key).value);
    obj[key](req, this, next);
  } else if (fn) {
    fn();
  } else {
    var err: Error & Partial<{ status: any; statusCode: any; types: any }> =
      new Error("Not Acceptable");
    err.status = err.statusCode = 406;
    err.types = normalizeTypes(keys).map(function (o) {
      return o.value;
    });
    next(err);
  }

  return this;
}

function location(this: any, url: string) {
  var loc = url;

  // "back" is an alias for the referrer
  if (url === "back") {
    loc = this._req.get("Referrer") || "/";
  }

  // set location
  return this.set("Location", encodeUrl(loc));
}

function redirect(this: any, url: string) {
  var address = url;
  var body: any;
  var status = 302;

  // allow status / url
  if (arguments.length === 2) {
    if (typeof arguments[0] === "number") {
      status = arguments[0];
      address = arguments[1];
    } else {
      deprecate(
        "res.redirect(url, status): Use res.redirect(status, url) instead"
      );
      status = arguments[1];
    }
  }

  // Set location header
  address = this.location(address).get("Location");

  // Support text/{plain,html} by default
  this.format({
    text: function () {
      // @ts-ignore
      body = statuses[status] + ". Redirecting to " + address;
    },

    html: function () {
      var u = escapeHtml(address);
      body =
        "<p>" +
        // @ts-ignore
        statuses[status] +
        '. Redirecting to <a href="' +
        u +
        '">' +
        u +
        "</a></p>";
    },

    default: function () {
      body = "";
    },
  });

  // Respond
  this.statusCode = status;
  this.set("Content-Length", Buffer.byteLength(body));

  if (this._req.method === "HEAD") {
    this.end();
  } else {
    this.end(body);
  }
}

function convertServerResponseToExpressResponse(
  res: ServerResponse &
    Partial<{
      _req: any;
      locals: any;
      get: Function;
      set: Function;
      header: Function;
      format: Function;
      location: Function;
      redirect: Function;
      vary: Function;
      status: Function;
      send: Function;
      type: Function;
      contentType: Function;
    }>,
  next: NextHandler
) {
  if (!res.locals) {
    res.locals = {};
  }
  res.get = get.bind(res);
  res.set = res.header = header.bind(res);
  res.vary = varyF.bind(res);
  res.format = format.bind(res);
  res.location = location.bind(res);
  res.redirect = redirect.bind(res);
  res.status = status.bind(res);
  res.send = sendF.bind(res);
  res.type = res.contentType = contentTypeF.bind(res);
  return res;
}

export default convertServerResponseToExpressResponse;
