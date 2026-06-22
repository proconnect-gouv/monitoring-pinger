import dotenv from 'dotenv';
import pgConnectionString from 'pg-connection-string';

dotenv.config();

const databaseConfig = {} as {
    DATABASE_PORT: number;
    DATABASE_HOST: string;
    DATABASE_NAME: string;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
};

if (process.env.DATABASE_URL) {
    const infos = pgConnectionString.parse(process.env.DATABASE_URL);
    databaseConfig.DATABASE_PORT = infos.port ? Number(infos.port) : 5432;
    databaseConfig.DATABASE_HOST = infos.host || '';
    databaseConfig.DATABASE_NAME = infos.database || '';
    databaseConfig.DATABASE_USER = infos.user || '';
    databaseConfig.DATABASE_PASSWORD = infos.password || '';
} else {
    databaseConfig.DATABASE_HOST = process.env.DATABASE_HOST || '';
    databaseConfig.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || '';
    databaseConfig.DATABASE_USER = process.env.DATABASE_USER || '';
    databaseConfig.DATABASE_NAME = process.env.DATABASE_NAME || '';
    databaseConfig.DATABASE_PORT = process.env.DATABASE_PORT
        ? Number(process.env.DATABASE_PORT)
        : 5432;
}

const config = {
    PORT: process.env.PORT || 3000,
    UPTIME_ROBOT_API_KEY: process.env.UPTIME_ROBOT_API_KEY || '',
    MATRIX_DOMAIN: process.env.MATRIX_DOMAIN || '',
    MATRIX_SERVER_URL: process.env.MATRIX_SERVER_URL || '',
    DEFAULT_ROOM_ID: process.env.DEFAULT_ROOM_ID || '',
    TCHAP_USERNAME: process.env.TCHAP_USERNAME || '',
    TCHAP_PASSWORD: process.env.TCHAP_PASSWORD || '',
    SENSITIVE_MONITOR_GROUP: process.env.SENSITIVE_MONITOR_GROUP || '',
    ...databaseConfig,
};

export { config };
