/* istanbul ignore file */
import Server from './server/server'
import * as bodyParser from 'body-parser'
import {requestLogger} from './middleware/request-logger'
import responseSender from './middleware/response-sender'
import ProbeController from './controllers/probe'
import MetricController from './controllers/metrics'
import Controller,{BaseController} from './controllers/controller'

export {
    Server,
    bodyParser,
    requestLogger,
    responseSender,
    Controller,
    BaseController,
    ProbeController,
    MetricController
}