import Controller,{BaseController} from './controller'


export default class ProbeController extends BaseController implements Controller{
    
    /* istanbul ignore next */
    initRoutes(): void{
        this.router.get('/', (req,res,next)=> {this.getProbe(req,res,next)})
    }

    getProbe(req,res,next): void {
        this.setResponse( res,{ status:200, json:{}})
        next();
    }

}