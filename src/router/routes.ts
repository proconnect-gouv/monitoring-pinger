import { incidentRoutes } from '../modules/incident';
import { routeType } from './types';

const routes = buildRoutes();

function buildRoutes() {
    const routes: routeType<any, any, any>[] = [];
    routes.push(...incidentRoutes);
    return routes;
}

export { routes };
