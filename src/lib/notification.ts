import { matrix } from './matrix';

const notificationService = {
    postMessage,
};

async function postMessage(message: string) {
    try {
        await matrix.sendMessage(message);
    } catch (error) {
        console.error(error);
        return { error };
    }
}

export { notificationService };
