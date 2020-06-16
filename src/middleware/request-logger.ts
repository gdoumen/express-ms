import { Request, Response,NextFunction,RequestHandler } from 'express'
import {EventLogger} from 'gd-eventlog'
import onFinished from 'on-finished'
import promClient,{register,Counter} from 'prom-client'
import UAAnalyzer from 'sniffr'

let reqId = 0;


const getQuery = (req: Request): string => {
    let qstr = '';
    if ( req.query!==undefined)  {
        

        const keys = Object.keys(req.query);
        const values = Object.values(req.query);

        keys.forEach( (key,i) => {
            qstr += (i==0 ? '?': '&');
            qstr += `${key}=${values[i]}`;
        });
    }
    return qstr;
}

function getOS(ua: UAAnalyzer, version = false): string {
    
    const os = ua.os;

    if ( ua.os===undefined  || ua.os.name===undefined) {
        return 'unknown'
    }

    if ( version)
        return `${os.name} ${os.versionString}`
    else 
        return `${os.name}`
} 


class Logger {

    logger: EventLogger;
    reqId: number;
    metrics: boolean | false;
    requestCount?: Counter<string>;
    requestDuration?: Counter<string>;
    ua: UAAnalyzer;
    prefix: string;

    constructor ( opts) {
        this.ua = new UAAnalyzer();
        this.logger = new EventLogger('request');
        this.reqId = 0;
        this.prefix = 'http';
        this.metrics = false;

        if (opts!==undefined) {
            this.metrics = opts.metrics;
            this.prefix = opts.prefix || 'http'
            if (this.metrics)
                this.initMetrics();
        }
            
        
    }

    initMetrics(): void {
        this.requestCount = new Counter({  
            name: this.prefix+'_request_total',
            help: 'Number of requests which are made to this service',
            labelNames: ['path','status','os']
        });
        this.requestDuration = new Counter({  
            name: this.prefix+'_request_duration_ms_sum',
            help: 'total time spend processing requests which are made to this service',
            labelNames: ['path','status','os']
        });
        //promClient.collectDefaultMetrics();
    }


    responseLogger  (path: string, req: Request,res: Response): void  {
            
        const ts = new Date();
        const duration = Number(ts)-req['ts'];
        
        const qstr = getQuery(req);
        //console.log (res )
        const status = res.statusCode===304 ? 200:  res.statusCode;

        if ( res['result']==undefined && res['static']==undefined) {
            this.logger.logEvent({message:`${req.method} ${path}${qstr}`, status ,duration })
        }
        else {
            this.logger.logEvent({message:`${req.method} ${path}${qstr}`,status ,duration, result:res['result']})
        }
    
        if ( this.metrics &&  req['metricsIgnore'] !== true) {
            const os = getOS(this.ua)        ;
            this.requestCount.inc({path,status,os})
            this.requestDuration.inc({path,status,os},duration)
        }

    }
    
    
    requestLogger (req: Request,res: Response,next: NextFunction): void {
    
        // for some reason, the req.path object gets overwritten in the /metrics endpoint (-> / ). 
        // therefore we have to copy it before and pass it as argument to the response Logger
        const path= req.path;
        onFinished( res, () => {
            
            this.responseLogger( path, req,res)
        } )

        this.ua.sniff(req.headers['user-agent'])
        req['ts'] = new Date();

        this.logger.set({id:++reqId})

        const qstr = getQuery(req);
        this.logger.logEvent({message:`${req.method} ${req.path}${qstr}`,headers:req.headers,body:req.body,os:`${getOS(this.ua,true)}`})

        next();
    }
    

}



const requestLogger = ( opts): RequestHandler => {

    const logger = new Logger(opts);
    return logger.requestLogger.bind(logger);
}



export { 
    requestLogger
}