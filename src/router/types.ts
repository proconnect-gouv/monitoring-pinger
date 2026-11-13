import { RequestHandler } from "express";
import { z } from "zod";
import { authenticatedControllerType } from "./lib/buildController/types";

type methodType = "get" | "post" | "put" | "patch" | "delete";
type routeType<paramsT, queryT, bodyT> = {
  method: methodType;
  middlewares?: RequestHandler[];
  path: string;
  controller: authenticatedControllerType<paramsT, queryT, bodyT>;
  schema?: z.ZodType;
};

export type { routeType };
