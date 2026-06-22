type incidentDtoType = {
    monitorID: string;
    monitorFriendlyName: string;
    monitorGroup: string;
    incidentId: string;
    alertTypeFriendlyName: 'Down' | 'Up';
    alertDetails: string;
};

export type { incidentDtoType };
