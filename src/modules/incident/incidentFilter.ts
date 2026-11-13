// An incident filter raises the notification threshold of one monitor for the incidents
// starting in a daily window (Europe/Paris time). It is used to silence known, recurring
// incidents (e.g. a nightly maintenance job) while still being notified if they last too long.
type IncidentFilter = {
  monitorId: number;
  minutes: number;
  from: string; // "HH:MM", included
  to: string; // "HH:MM", excluded
};

const TIME_ZONE = "Europe/Paris";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseIncidentFilters(rawValue: string): IncidentFilter[] {
  const value: unknown = JSON.parse(rawValue);
  if (!Array.isArray(value)) {
    throw new Error("INCIDENT_FILTERS must be a JSON array");
  }
  return value.map((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !Number.isInteger(item.monitorId) ||
      typeof item.minutes !== "number" ||
      !(item.minutes > 0) ||
      typeof item.from !== "string" ||
      !TIME_PATTERN.test(item.from) ||
      typeof item.to !== "string" ||
      !TIME_PATTERN.test(item.to)
    ) {
      throw new Error(
        `INCIDENT_FILTERS[${index}] must look like {"monitorId": 123, "minutes": 120, "from": "03:30", "to": "04:30"}`,
      );
    }
    if (item.from >= item.to) {
      throw new Error(
        `INCIDENT_FILTERS[${index}]: "from" must be before "to" (windows crossing midnight are not supported)`,
      );
    }
    return {
      monitorId: item.monitorId,
      minutes: item.minutes,
      from: item.from,
      to: item.to,
    };
  });
}

// An invalid configuration must never make us miss alerts: we fall back to no filter at all.
function loadIncidentFilters(
  rawValue: string | undefined,
  defaultFilters: IncidentFilter[],
  onError: (message: string) => void,
): IncidentFilter[] {
  if (rawValue === undefined) {
    return defaultFilters;
  }
  try {
    return parseIncidentFilters(rawValue);
  } catch (error) {
    onError(
      `Invalid INCIDENT_FILTERS, no incident filter will be applied: ${(error as Error).message}`,
    );
    return [];
  }
}

function getParisTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function findMatchingFilter(
  incident: { monitorId: number; startedAt: string },
  filters: IncidentFilter[],
): IncidentFilter | undefined {
  const startTime = getParisTime(new Date(incident.startedAt));
  return filters.find(
    (filter) =>
      filter.monitorId === incident.monitorId &&
      filter.from <= startTime &&
      startTime < filter.to,
  );
}

function getThresholdMinutes(
  incident: { monitorId: number; startedAt: string },
  filters: IncidentFilter[],
  defaultMinutes: number,
): { minutes: number; filter: IncidentFilter | undefined } {
  const filter = findMatchingFilter(incident, filters);
  return { minutes: filter ? filter.minutes : defaultMinutes, filter };
}

export { getThresholdMinutes, loadIncidentFilters };
export type { IncidentFilter };
