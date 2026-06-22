import { Request } from 'express';
import { config } from '../../../config';

function assertIsAuthenticated(req: Request) {
    const authorization = req.header('Authorization');
    if (!authorization) {
        throw new Error(`No Authorization header provided`);
    }
    const [_, token] = authorization.toString().split(' ');
    if (!token) {
        throw new Error(`No Bearer token provided`);
    }

    if (token !== config.UPTIME_ROBOT_API_KEY) {
        throw new Error(`Invalid Bearer token provided`);
    }
    return true;
}

export { assertIsAuthenticated };
