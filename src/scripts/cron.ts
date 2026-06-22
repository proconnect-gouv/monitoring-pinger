import { CronJob } from 'cron';
import { dataSource } from '../dataSource';
import { incidentService } from '../modules/incident';
import { matrix } from '../lib/matrix';

async function buildCron() {
    console.log('=== CRON ===');

    console.log('Initializing database...');
    await dataSource.initialize();
    console.log('Database initialized!');

    console.log(`Initialisation du client Matrix...`);
    await matrix.initialize();
    console.log(`Initialisation du client Matrix réussie !`);

    CronJob.from({
        cronTime: '* * * * *',
        onTick: incidentService.checkAllIncidents,
        start: true,
        timeZone: 'Europe/Paris',
    });

    console.log('Cron jobs started');
}

buildCron();
