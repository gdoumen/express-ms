import express,{Request,Response,NextFunction} from 'express'
import {Controller,BaseController} from 'gd-express-ms'

import {EventLogger} from 'gd-eventlog'

export default class ApiController extends BaseController implements Controller{    
    constructor(path: string) {
        super(path);
    }

    initRoutes(): void{
        this.router.get('/:user', this.hello.bind(this))
    }

    hello  (req: Request,res: Response,next: NextFunction): void  {

        const user = req.params.user || 'world';
        this.setResponse(res,{ status:200, json: {user}})
        next();
    }
}