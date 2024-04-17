import {StatusCodes} from 'http-status-codes'

export class ExtError extends Error {
    statusCode: StatusCodes;

    constructor(message?: string, statusCode?: StatusCodes) {
        super(message);
        this.statusCode = statusCode;
    }
}
