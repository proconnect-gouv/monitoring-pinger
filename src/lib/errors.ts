import httpStatus from 'http-status';

class AppError extends Error {
    public statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = this.constructor.name;
        if (statusCode) {
            this.statusCode = statusCode;
        }
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    public statusCode = httpStatus.NOT_FOUND;
}

export { NotFoundError, AppError };
