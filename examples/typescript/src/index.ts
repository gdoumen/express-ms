/* istanbul ignore file */
import Server from './server/server'
import {config as initDotEnv } from 'dotenv'
import path from 'path'
import {name,version} from '../package.json'

import * as bodyParser from 'body-parser'
import {requestLogger} from './middleware/request-logger'
import responseSender from './middleware/response-sender'
import ApiController from './controllers/api'
import ProbeController from './controllers/probe'
import MetricController from './controllers/metrics'

const DEFAULT_PORT = 3000;

initDotEnv();

const port: number = Number(process.env.PORT) || DEFAULT_PORT;
const directory = process.env.BASE_DIR || path.join(__dirname,'/public')


function logFilter  (context: string, event?: any): boolean {
    if ( event===undefined)
        return false;

    if (context==='request' && event.message.startsWith('GET /probe') || event.message.startsWith('GET /metrics')) {
        return (process.env.LOGPROBE!==undefined && Boolean(process.env.LOGPROBE)==true);
    }
    if (context==='api' && event.message.startsWith('loadDB response') || event.message.startsWith('loadDB request')) {
        return (process.env.LOGDB!==undefined && Boolean(process.env.LOGDB)==true);
    }

    return true;
}

const server = new Server({
    port,
    name,
    version,
    logFilter,
    preProcessors:[
        bodyParser.json(),
        bodyParser.urlencoded({extended:true}),
        requestLogger( {metrics:true, prefix:'updateserver'} )],
    postProcessors:[
        responseSender],
    controllers: [
        new ApiController('/api/v1'),
        new ProbeController('/probe'),
        new MetricController('/metrics')
    ],
    assets: [
        { path:'/download', directory }
    ]
});

server.start();
