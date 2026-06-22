import Express, { RequestHandler } from 'express';
import { buildAuthenticatedController } from './lib/buildController';
import { routes } from './routes';
import { notificationService } from '../lib/notification';

const router = buildRouter();

function buildRouter() {
    const router = Express.Router();
    for (const route of routes) {
        let builtController: RequestHandler;
        builtController = buildAuthenticatedController(route.controller, {
            schema: route.schema,
        });

        router[route.method](route.path, [...(route.middlewares || [])], builtController);
    }

    router.get('/test', async (req, res) => {
        const response = await notificationService.postMessage('TEST');
        res.status(200).send(response);
    });

    return router;
}

export { router };
