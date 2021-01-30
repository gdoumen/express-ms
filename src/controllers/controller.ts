import express from 'express'
import {Response} from 'express'

export interface ControllerResponse {
    status: number;
    error?;
    message?: string;
    json?: object;
    file?: string;
}

export default interface Controller {
    path: string;
    router;

    initRoutes(): void;
    setResponse(res: Response,result: ControllerResponse): this;
    
}

export class BaseController implements Controller {
    public router =  express.Router();
    public path;

    constructor(path) {
        this.path = path;
        this.initRoutes();
    }

    /* istanbul ignore next */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    initRoutes(): void {}

    setResponse(res: Response,result: ControllerResponse ): this {
        res['result'] = result;
        return this;
    }

}