import { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { AppError } from "../../../lib/errors";
import { logger } from "../../../lib/logger";
import { assertIsAuthenticated } from "./assertIsAuthenticated";

export { buildAuthenticatedController };

function buildAuthenticatedController<
  paramsT extends Record<string, string>,
  queryT extends Record<string, string>,
  bodyT,
  resultT extends Record<string, any>,
>(
  controller: (params: {
    query: queryT;
    urlParams: paramsT;
    body: bodyT;
    file?: { buffer: Buffer; fileName: string };
  }) => resultT | Promise<resultT>,
  options?: {
    schema?: z.ZodType;
  },
) {
  return async (req: Request, res: Response) => {
    try {
      assertIsAuthenticated(req);
    } catch (error) {
      logger.error(error);
      res.sendStatus(httpStatus.UNAUTHORIZED);
      return;
    }

    if (options?.schema) {
      const result = options.schema.safeParse(req.body);
      if (!result.success) {
        logger.error(result.error);
        res.status(httpStatus.BAD_REQUEST).send(z.prettifyError(result.error));
        return;
      }
    }

    try {
      const result = await controller({
        query: req.query as queryT,
        urlParams: req.params as paramsT,
        body: req.body,
      });

      res.setHeader("Content-Type", "application/json");
      res.send(result);
    } catch (error: any) {
      logger.error(error);
      if (error instanceof AppError) {
        res.status(error.statusCode).send(error.message);
      } else {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error.message);
      }
    }
  };
}
