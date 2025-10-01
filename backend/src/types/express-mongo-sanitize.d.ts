declare module 'express-mongo-sanitize' {
  import { RequestHandler } from 'express';
  function mongoSanitize(options?: unknown): RequestHandler;
  export default mongoSanitize;
}
