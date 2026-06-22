import { IsNull } from 'typeorm';
import { dataSource } from '../../dataSource';
import { incidentDtoType } from './incident.dto';
import { Incident } from './incident.entity';
import { matrix } from '../../lib/matrix';

const INCIDENT_DURATION_THRESHOLD = 1 * 60 * 1000; // 1 minute

function buildIncidentService() {
    const incidentRepository = dataSource.getRepository(Incident);

    const incidentService = {
        upsertIncident,
        checkAllIncidents,
    };

    return incidentService;

    async function upsertIncident(incidentDto: incidentDtoType) {
        switch (incidentDto.alertTypeFriendlyName) {
            case 'Down':
                const newIncident = incidentRepository.create({
                    monitorId: Number(incidentDto.monitorID),
                    monitorName: incidentDto.monitorFriendlyName,
                    cause: incidentDto.alertDetails,
                    startedAt: new Date().toISOString(),
                    endedAt: null,
                });
                await incidentRepository.save(newIncident);
                break;
            case 'Up':
                const ongoingIncident = await incidentRepository.findOne({
                    where: {
                        monitorId: Number(incidentDto.monitorID),
                        endedAt: IsNull(),
                    },
                    order: { startedAt: 'DESC' },
                });
                if (!!ongoingIncident) {
                    const incidentEndTime = new Date().toISOString();
                    await incidentRepository.update(ongoingIncident.id, {
                        endedAt: incidentEndTime,
                        hasBeenNotified: true,
                    });
                    const duration =
                        new Date(incidentEndTime).getTime() -
                        new Date(ongoingIncident.startedAt).getTime();
                    if (duration > INCIDENT_DURATION_THRESHOLD) {
                        await matrix.sendMessage(
                            `Incident for monitor ${ongoingIncident.monitorName} is now resolved. It lasted ${Math.round(
                                duration / 1000 / 60,
                            )} minutes.`,
                        );
                    }
                }
                break;
        }
    }

    async function checkAllIncidents() {
        const ongoingIncidents = await incidentRepository.find({
            where: { endedAt: IsNull() },
        });
        for (const incident of ongoingIncidents) {
            if (incident.hasBeenNotified) {
                continue;
            }
            const duration = new Date().getTime() - new Date(incident.startedAt).getTime();
            if (duration > INCIDENT_DURATION_THRESHOLD) {
                await matrix.sendMessage(
                    `Incident for monitor ${incident.monitorName} is still ongoing. It has lasted ${Math.round(
                        duration / 1000 / 60,
                    )} minutes.`,
                );
                await incidentRepository.update(incident.id, { hasBeenNotified: true });
            }
        }
    }
}

const incidentService = buildIncidentService();

export { incidentService };
