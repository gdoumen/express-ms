
/* istanbul ignore file */
const {name,version} = require ( '../package.json')
const {config } = require ('dotenv')
const path = require ('path')
const process = require( 'process')

const HelloController = require( './controllers/hello')
const {Server, requestLogger,responseSender,bodyParser,ProbeController,MetricController} = require( 'gd-express-ms')


const DEFAULT_PORT = 3000;

config();

const port= Number(process.env.PORT) || DEFAULT_PORT;
const directory = process.env.BASE_DIR || path.join(__dirname,'/public')

function logFilter  (context, event) {
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
        requestLogger( {metrics:true, prefix:'express'} )],
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
