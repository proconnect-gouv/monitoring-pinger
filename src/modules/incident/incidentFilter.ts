import { z } from "zod";

const TIME_ZONE = "Europe/Paris";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must be formatted as "HH:MM"');

// An incident filter raises the notification threshold of one monitor for the incidents
// starting in a daily window (Europe/Paris time). It is used to silence known, recurring
// incidents (e.g. a nightly maintenance job) while still being notified if they last too long.
const incidentFilterSchema = z
  .object({
    monitorId: z.number().int(),
    minutes: z.number().positive(),
    from: timeSchema, // "HH:MM", included
    to: timeSchema, // "HH:MM", excluded
  })
  .refine((filter) => filter.from < filter.to, {
    message:
      '"from" must be before "to" (windows crossing midnight are not supported)',
  });

const incidentFiltersSchema = z.array(incidentFilterSchema);

type IncidentFilter = z.infer<typeof incidentFilterSchema>;

function parseIncidentFilters(rawValue: string): IncidentFilter[] {
  const result = incidentFiltersSchema.safeParse(JSON.parse(rawValue));
  if (!result.success) {
    throw new Error(z.prettifyError(result.error));
  }
  return result.data;
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
