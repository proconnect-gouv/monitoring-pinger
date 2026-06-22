import Express from 'express';
import bodyParser from 'body-parser';
import { config } from '../config';
import { router } from '../router';
import { logger } from '../lib/logger';
import { matrix } from '../lib/matrix';
import { dataSource } from '../dataSource';

export { runApp };

async function runApp() {
    const app = Express();

    try {
        console.log(`Initialisation du client Matrix...`);
        await matrix.initialize();
        console.log(`Initialisation du client Matrix réussie !`);
    } catch (error) {
        console.error(error);
    }

    console.log('Connexion à la db...');
    await dataSource.initialize();
    console.log('Connexion à la db réussie !');

    app.use('/api', bodyParser.json(), router);

    app.listen(config.PORT, async () => {
        logger.info(`Server is running on port ${config.PORT}`);
    });
}
