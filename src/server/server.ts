import express, { RequestHandler }  from 'express'
import { Application,Handler} from 'express'
import path from 'path'

import {EventLogger,ConsoleAdapter} from 'gd-eventlog'
import Controller from '../controllers/controller'
import { FilterFunc } from 'gd-eventlog/lib/LogAdapter'

interface Asset {
    path: string;
    directory: string;
    opts?;
}

export interface ServerOpts {
    port: number;
    name: string;
    version: string;
    preProcessors?: Array<RequestHandler>;
    postProcessors?: Array<RequestHandler>;
    controllers: Array<Controller>|Controller;
    assets?: Array<Asset>;
    autoInit?: boolean;
    logFilter?: FilterFunc;
}

export default class Server {

    private logger: EventLogger;
    public app: Application;
    private reqId: number;
    private port: number;
    private opts: ServerOpts;

    constructor( opts: ServerOpts) {
        this.logger = new EventLogger(opts.name);
        this.app = express();
        this.reqId = 0;
        this.opts = opts;
        this.opts.autoInit = opts.autoInit===undefined ? true : opts.autoInit;

        this.logger.set({version:opts.version})
        EventLogger.registerAdapter(new ConsoleAdapter(), this.opts.logFilter)        
        if (this.opts.autoInit)
            this.init();
    }

    serveStatic(directory: string,opts?): Handler {
        return express.static(path.join(directory,'./'),opts)
    }

    initAssets( assets?: Array<Asset>): void {
        if (assets==undefined) 
            return;
        
            assets.forEach( asset => { 
                this.app.use( asset.path, this.serveStatic(asset.directory,asset.opts))
            })
        
    }

    initMiddleware( arr?: Array<RequestHandler> ): void {
        if (arr===undefined)
            return;

        arr.forEach( mw => {this.app.use( mw)})
    }

    initRoutes( ctrl: Array<Controller>|Controller ): void {
        if ( ctrl===undefined)
            return;
        if (Array.isArray(ctrl)) {
            ctrl.forEach( c => this.app.use(c.path,c.router))
        }
        else {
            this.app.use(ctrl.path,ctrl.router)
        }

    }

    
    init(): void {
        
        // pre processing
        this.initMiddleware(this.opts.preProcessors);
        
        // routes
        this.initRoutes(this.opts.controllers);
        this.initAssets(this.opts.assets)

        // post processing
        this.initMiddleware(this.opts.postProcessors);

    }

    start(): void {
        this.app.listen(this.opts.port, () => this.logger.log(`Server listening on port ${this.opts.port}!`));

    }


}
