import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream, TransformStream, WritableStream } from "stream/web";
import { MessageChannel, MessagePort } from "worker_threads";

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  TransformStream,
  WritableStream,
  MessageChannel,
  MessagePort,
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Request, Response, Headers, fetch } = require("undici");
Object.assign(globalThis, { Request, Response, Headers, fetch });
