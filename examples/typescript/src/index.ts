/* istanbul ignore file */
import {config as initDotEnv } from 'dotenv'
import path from 'path'
import {name,version} from '../package.json'

import HelloController from './controllers/hello'
import {Server, requestLogger,responseSender,bodyParser,ProbeController,MetricController} from 'gd-express-ms'

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
        requestLogger( {metrics:true, prefix:'express-ms'} )],
    postProcessors:[
        responseSender],
    controllers: [
        new HelloController('/hello'),
        new ProbeController('/probe'),
        new MetricController('/metrics')
    ],
    assets: [
        { path:'/download', directory }
    ]
});

server.start();
