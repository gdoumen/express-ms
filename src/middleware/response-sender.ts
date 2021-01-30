import { Request, Response,NextFunction } from 'express'

const responseSender = (req: Request,res: Response,next: NextFunction): void => {
    
    
    if ( res['result']===undefined) {
        return next();
    }
    const result = res['result'];

    if ( result.error===undefined && result.json===undefined && result.file===undefined)
        return next();


    if ( result.error!==undefined) {
        const status = result.status || 500;
        if ( result.message!==undefined) {
            res.status(status).send(result.message)
        }
        else {
            res.status(status).send(result.error)  
        }
        return;
    }
    
    else {

        if ( result.file!==undefined) {
            return res.sendFile(result.file);    
        }

        const status = result.status || 200;
        res.status(status).send(result.json);
        return;
    }
    
}

export default responseSender