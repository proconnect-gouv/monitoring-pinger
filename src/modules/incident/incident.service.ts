import { IsNull } from "typeorm";
import { config } from "../../config";
import { dataSource } from "../../dataSource";
import { logger } from "../../lib/logger";
import { notificationService } from "../../lib/notification";
import { incidentDtoType } from "./incident.dto";
import { Incident } from "./incident.entity";
import { getThresholdMinutes } from "./incidentFilter";

function buildIncidentService() {
  const incidentRepository = dataSource.getRepository(Incident);

  const incidentService = {
    upsertIncident,
    checkAllIncidents,
  };

  return incidentService;

  async function upsertIncident(incidentDto: incidentDtoType) {
    switch (incidentDto.alertTypeFriendlyName) {
      case "Down":
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
            `**Un incident pour la sonde sensible "${incidentDto.monitorFriendlyName}" (${incidentDto.monitorGroup}) a commencé.** Cause : ${incidentDto.alertDetails}`,
          );
          newIncident.hasBeenNotified = true;
        } else {
          logger.info(
            `Monitor ${incidentDto.monitorFriendlyName} (${incidentDto.monitorGroup}) is down. Cause: ${incidentDto.alertDetails}. No notification sent because it is not a sensitive monitor.`,
          );
        }

        await incidentRepository.save(newIncident);
        break;
      case "Up":
        const ongoingIncident = await incidentRepository.findOne({
          where: {
            monitorId: Number(incidentDto.monitorID),
            endedAt: IsNull(),
          },
          order: { startedAt: "DESC" },
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
          const threshold = getIncidentThreshold(ongoingIncident);
          if (duration > threshold.minutes * 60 * 1000) {
            const readableDuration =
              convertMillisecondsToReadableDuration(duration);

            await notificationService.postMessage(
              `L'incident pour la sonde "${ongoingIncident.monitorName}" est maintenant résolu. Il a duré ${readableDuration}.`,
            );
          } else if (threshold.filter) {
            logger.info(
              `Incident for monitor ${ongoingIncident.monitorName} (id ${ongoingIncident.monitorId}) is now resolved. It lasted ${Math.round(
                duration / 1000 / 60,
              )} minutes. No notification sent because it was filtered: below the threshold of ${threshold.minutes} minutes for incidents starting between ${threshold.filter.from} and ${threshold.filter.to}.`,
            );
          } else {
            logger.info(
              `Incident for monitor ${ongoingIncident.monitorName} is now resolved. It lasted ${Math.round(
                duration / 1000 / 60,
              )} minutes. No notification sent because it was below the threshold (${threshold.minutes} minutes).`,
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
      const duration =
        new Date().getTime() - new Date(incident.startedAt).getTime();
      if (duration > getIncidentThreshold(incident).minutes * 60 * 1000) {
        const readableDuration =
          convertMillisecondsToReadableDuration(duration);
        const hasSucceeded = await notificationService.postMessage(
          `Un incident pour la sonde "${incident.monitorName}" a commencé il y a ${readableDuration}.`,
        );
        if (hasSucceeded) {
          await incidentRepository.update(incident.id, {
            hasBeenNotified: true,
          });
        }
      }
    }
  }

  function getIncidentThreshold(incident: Incident) {
    return getThresholdMinutes(
      incident,
      config.INCIDENT_FILTERS,
      config.INCIDENT_MINUTES_THRESHOLD,
    );
  }

  function convertMillisecondsToReadableDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours} heures et ${remainingMinutes} minute(s)`;
    } else {
      return `${remainingMinutes} minute(s)`;
    }
  }
}

const incidentService = buildIncidentService();

export { incidentService };
