import { Request } from 'jest-express/lib/request';
import { Response } from 'jest-express/lib/response';
import MetricsController  from './metrics';
import {register} from 'prom-client'
import { resolve } from 'path/posix';


describe ( 'getMetrics' ,() => {

    let c;
    const original = register.metrics

    beforeAll( ()=> {
        c = new MetricsController('/');
    })

    afterEach( () => {
        register.metrics = original
    })

    test ( 'success' , async ()=> {
        const request = new Request();
        const response = new Response();
        const execute = ()=> {
            return new Promise( (resolve)=> { 
                register.metrics = jest.fn( ()=> Promise.resolve('{ a:1, b:2}'))

                response.send = jest.fn( (d)=>resolve(d))
                response.status = jest.fn( ()=> response)
                const next = jest.fn( () => {resolve('')});
                c.getMetrics( request,response,next)
            })

        }



        await execute();
        expect(request['metricsIgnore']).toBeTruthy()
        expect(request['logIgnore']).toBeTruthy()
        expect(response.send).toHaveBeenCalledWith('{ a:1, b:2}')
          
    })


    test ( 'error' , async ()=> {
        const request = new Request();
        const response = new Response();

        const execute = ()=> {
            return new Promise( (resolve)=> { 
                register.metrics = jest.fn( ()=> Promise.reject('error'))

                response.send = jest.fn( (d)=>resolve(d))
                response.status = jest.fn( ()=> response)
                const next = jest.fn( () => {resolve('')});
                c.getMetrics( request,response,next)
            })

        }

        await execute();
        expect(response.status).toHaveBeenCalledWith(500)
        expect(response.send).toHaveBeenCalledWith('server error')
        
          
    })

});