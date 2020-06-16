import express,{Request,Response,NextFunction} from 'express'
import Controller,{BaseController} from './controller'
import path from 'path'
import fs from 'fs'

import {EventLogger} from 'gd-eventlog'
const DB_DIR = process.env.DB_DIR || __dirname;

export default class ApiController extends BaseController implements Controller{

    private logger: EventLogger;
    
    constructor(path: string) {
        super(path);
        this.logger = new EventLogger('api')
    }

    initRoutes(): void{
        this.router.get('/apps/:app/:version', this.getApp.bind(this))
    }

    /* istanbul ignore next */
    readFile( fileName: string, callback: (err,data) => void ): void{
        fs.readFile( fileName, 'utf8', callback)
    }

    loadDB(): Promise< {app;settings?}> {
        this.logger.logEvent({message:'loadDB request'})

        return new Promise( (resolve,reject) => {
            const fileName = path.join(DB_DIR,'db.json')
            this.readFile(fileName, (err,data) => {
                if (err) {
                    this.logger.logEvent({message:'loadDB error',error:err})
                    return reject(err);
                }
                try {
                    resolve( JSON.parse(data) );
                    this.logger.logEvent({message:'loadDB response',data})
                }
                catch( err){
                    this.logger.logEvent({message:'loadDB error',error:err})
                    reject(err)
                } 
                 
            });
        })
    }

    versionMatches(app: string,min: string): boolean {
        return min==app;
    }

    async getApp  (req: Request,res: Response,next: NextFunction): Promise<void>  {

        this.logger.logEvent( {message:'getApp request',app:req.params.app, version: req.params.version})
        try {
            const db = await this.loadDB();
            const settings = db.settings || [];
            const app = db.app || []
            const json = app[req.params.app];

            if ( json == undefined || json.latest==undefined) {
                this.logger.logEvent( {message:'getApp error',error:'not found'})
                this.setResponse(res,{ status:404, error:true, message:'not found'});
                next();
                return;
            }

            const found = json.latest.find( element => {
                return this.versionMatches(element.appVersion,req.params.version) 
            }) || {};
            
            const result = JSON.parse( JSON.stringify( found));

            if ( req.query.uuid!==undefined) {
                const userRecord = settings.find( element => element.uuid ==req.query.uuid );
                
                // copy settings
                if ( userRecord!==undefined && userRecord.values!==undefined) {
                    if ( result.setting === undefined)
                        result.setting = userRecord.values;
                    else {
                        const keys = Object.keys(userRecord.values);
                        keys.forEach( key => {
                            result.setting[key] = userRecord.values[key];
                        })
                    }
                }


                if ( userRecord!==undefined && userRecord.app!==undefined) {
                    const keys = Object.keys(userRecord.app);
                    keys.forEach( key => {
                        result[key] = userRecord.app[key];
                    })
                }
            

            }

            this.setResponse(res,{ status:200, json:result})
        }
        catch( error ) {
            //            
            this.logger.logEvent( {message:'getApp error',error})
            this.setResponse(res,{ status:500, error:true, message:'server error'})
        }

        next();
    }
}