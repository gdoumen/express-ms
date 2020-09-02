const {Controller,BaseController} = require ( 'gd-express-ms')

const {EventLogger} = require( 'gd-eventlog')

class ApiController extends BaseController {    
    constructor(path) {
        super(path);
    }

    initRoutes(){
        this.router.get('/:user', this.hello.bind(this))
    }

    hello  (req,res,next) {

        const user = req.params.user || 'world';
        this.setResponse(res,{ status:200, json: {user}})
        next();
    }
}

module.exports = ApiController