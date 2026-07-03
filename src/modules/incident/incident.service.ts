import { IsNull } from 'typeorm';
import { dataSource } from '../../dataSource';
import { incidentDtoType } from './incident.dto';
import { Incident } from './incident.entity';
import { config } from '../../config';
import { notificationService } from '../../lib/notification';
import { logger } from '../../lib/logger';

const INCIDENT_DURATION_THRESHOLD = config.INCIDENT_MINUTES_THRESHOLD * 60 * 1000;

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
                const isSensitiveMonitor =
                    incidentDto.monitorGroup === config.SENSITIVE_MONITOR_GROUP;

                if (isSensitiveMonitor) {
                    await notificationService.postMessage(
                        `Incident for sensitive monitor ${incidentDto.monitorFriendlyName} (${incidentDto.monitorGroup}) has started. Cause: ${incidentDto.alertDetails}`,
                    );
                    newIncident.hasBeenNotified = true;
                } else {
                    logger.info(
                        `Monitor ${incidentDto.monitorFriendlyName} (${incidentDto.monitorGroup}) is down. Cause: ${incidentDto.alertDetails}. No notification sent because it is not a sensitive monitor.`,
                    );
                }

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
                        await notificationService.postMessage(
                            `Incident for monitor ${ongoingIncident.monitorName} is now resolved. It lasted ${Math.round(
                                duration / 1000 / 60,
                            )} minutes.`,
                        );
                    } else {
                        logger.info(
                            `Incident for monitor ${ongoingIncident.monitorName} is now resolved. It lasted ${Math.round(
                                duration / 1000 / 60,
                            )} minutes. No notification sent because it was below the threshold (${config.INCIDENT_MINUTES_THRESHOLD} minutes).`,
                        );
                    }
                } else {
                    logger.info(
                        `There was no ongoing incident for monitor ${incidentDto.monitorFriendlyName} (${incidentDto.monitorGroup}) to resolve.`,
                    );
                }
                break;
        }
    }

    async function checkAllIncidents() {
        const ongoingIncidents = await incidentRepository.find({
            where: { endedAt: IsNull(), hasBeenNotified: false },
        });
        for (const incident of ongoingIncidents) {
            const duration = new Date().getTime() - new Date(incident.startedAt).getTime();
            if (duration > INCIDENT_DURATION_THRESHOLD) {
                const hasSucceeded = await notificationService.postMessage(
                    `Incident for monitor ${incident.monitorName} has started ${Math.round(duration / 1000 / 60)} minutes ago.`,
                );
                if (hasSucceeded) {
                    await incidentRepository.update(incident.id, { hasBeenNotified: true });
                }
            }
        }
    }
}

const incidentService = buildIncidentService();

export { incidentService };
