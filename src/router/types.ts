import Joi from 'joi';
import { authenticatedControllerType } from './lib/buildController/types';
import { RequestHandler } from 'express';

type methodType = 'get' | 'post' | 'put' | 'patch' | 'delete';
type routeType<paramsT, queryT, bodyT> = {
    method: methodType;
    middlewares?: RequestHandler[];
    path: string;
    controller: authenticatedControllerType<paramsT, queryT, bodyT>;
    schema?: Joi.Schema;
};

export type { routeType };
