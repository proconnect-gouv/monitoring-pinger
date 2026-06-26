import { matrix } from './matrix';

const notificationService = {
    postMessage,
};

async function postMessage(message: string): Promise<boolean> {
    try {
        console.info(`Sending message to matrix: ${message}`);
        const eventId = await matrix.sendMessage(message);
        console.info(`Message sent to matrix with event ID: ${eventId}`);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export { notificationService };
