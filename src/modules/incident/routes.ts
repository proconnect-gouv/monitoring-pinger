import { routeType } from '../../router/types';
import { incidentController } from './incident.controller';

const incidentRoutes: Array<routeType<any, any, any>> = [
    {
        method: 'get',
        path: '/incidents',
        controller: incidentController.upsertIncident,
    },
];

export { incidentRoutes };
