import Controller,{BaseController} from './controller'
import {register} from 'prom-client'


export default class MetricController extends BaseController implements Controller{
    
    /* istanbul ignore next */
    initRoutes(): void{
        this.router.get('/', (req,res,next)=> {this.getMetrics(req,res,next)})
    }

    getMetrics(req,res,next): void {
        req['metricsIgnore'] = true;
        req['logIgnore'] = true;

        res.set('Content-Type', register.contentType);
        register.metrics().then( (metrics) => {
            res.send(metrics);
            next();    
        })
        .catch( () => {
            this.setResponse(res,{ status:500, error:true, message:'server error'})
        })
    }

}