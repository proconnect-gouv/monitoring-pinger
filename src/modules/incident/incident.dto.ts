type incidentDtoType = {
    monitorID: string;
    monitorFriendlyName: string;
    incidentId: string;
    alertTypeFriendlyName: 'Down' | 'Up';
    alertDetails: string;
};

export type { incidentDtoType };
