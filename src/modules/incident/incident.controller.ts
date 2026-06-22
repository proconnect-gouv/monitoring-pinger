import { incidentDtoType } from './incident.dto';
import { incidentService } from './incident.service';

const incidentController = {
    upsertIncident,
};

async function upsertIncident(params: { query: incidentDtoType }) {
    console.log(
        `Received incident update for monitor ${params.query.monitorFriendlyName} (${params.query.monitorGroup}) with status ${params.query.alertTypeFriendlyName}`,
    );
    return incidentService.upsertIncident(params.query);
}

export { incidentController };
