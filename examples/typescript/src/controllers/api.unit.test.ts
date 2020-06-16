import ApiController from './api'
import { Request } from 'jest-express/lib/request';
import { Response } from 'jest-express/lib/response';

jest.mock('express', () => {
    return require( 'jest-express')
})


describe ( 'constructor' ,() => {
    let initFn;

    beforeEach( ()=> {
        initFn = ApiController.prototype.initRoutes;
        ApiController.prototype.initRoutes = jest.fn();
    })

    afterEach( ()=> {
        ApiController.prototype.initRoutes = initFn;
    })

    test ( 'with path' ,()=> {
        const c = new ApiController('/test');
        expect(c.path).toBe('/test');
        expect(c.initRoutes).toHaveBeenCalled();
        expect(c['logger']).toBeDefined();
    })

})



describe ( 'initRoutes' ,() => {

    let initFn;
    let c;

    beforeEach( ()=> {
        initFn = ApiController.prototype.initRoutes;
        ApiController.prototype.initRoutes = jest.fn();

        c = new ApiController('/');
        c.router.get = jest.fn( );
        
        c.initRoutes = initFn.bind(c)
    })

    afterEach( ()=> {
        ApiController.prototype.initRoutes = initFn;
    })

    test ( 'sets up route' ,()=> {

        c.path = '/test';
        c.initRoutes();
        expect(c.router.get).toHaveBeenCalledWith( '/apps/:app/:version', expect.anything() );
        
        
    })

})


describe ( 'loadDB' ,() => {

    let c;
    let err = null;
    let data = undefined;

    beforeAll( ()=> {
        c = new ApiController('/');        
        c.readFile = jest.fn ( (fileName: string, callback: (_err,_data) => void ) => {
            callback(err,data)
        })
    })

    afterEach( ()=> {
        err = null;
        data = undefined;
    })


    test ( 'success' ,async ()=> {
        data = Buffer.from(JSON.stringify({ a:1, b:2}));
        const json = await c.loadDB();

        expect(json).toEqual( { a:1, b:2} );
    })

    test ( 'generic error' , async ()=> {

        let result;
        err = 'some error'

        try  {
            result = await c.loadDB()
        }
        catch ( error) {
            result = 'EXCEPTION: '+error;
        }
        expect(result).toBe('EXCEPTION: some error')            
    })

    test ( 'parsing error' , async ()=> {

        let result;
        err = null
        data = Buffer.from('Hallo')

        try  {
            result = await c.loadDB()
        }
        catch ( error) {
            result = 'EXCEPTION: '+error;
        }
        expect(result).toMatch(/EXCEPTION: SyntaxError/)            
    })

})

describe ( 'getApp' ,() => {

    let c;
    let db;
    let err;
    const next = jest.fn();

    const testData = {
        app: {
            incyclist: {
              latest: [      
                {appVersion:'0.4.0', reactVersion:'0.1.0' ,size: 2243785 },
                {appVersion:'0.5.0', reactVersion:'0.2.2' ,size: 2627722, setting: { logRest:{ sendInterval:10 }  }},
              ]
            }
          },
          settings :[
            { uuid:'123',values: { test:1 }},
            { uuid:'234'},
            { uuid:'345',values: { logRest:{ sendInterval:12 } }},
            { uuid:'app',app: { reactVersion:'0.2.3' ,size: 12345} },
          ]             
    }


    beforeAll( ()=> {

        c = new ApiController('/');
        c.loadDB = jest.fn( (): Promise< {app;settings?}> => {
            return new Promise( (resolve,reject) => {
                if ( err) reject(err)
                else resolve( db)
            });
        } )
    })

    afterEach( ()=> {
        db = undefined;
        err = undefined;
    })

    test ( 'version found' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.5.0', reactVersion:'0.2.2' ,size: 2627722, setting: { logRest:{ sendInterval:10 }}})            
    })

    test ( 'version found, uuid found' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        request.setQuery( 'uuid', '123')
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.5.0', reactVersion:'0.2.2' ,size: 2627722, setting: { logRest:{ sendInterval:10 }, test:1}})            
    })

    test ( 'version found, uuid found, version has no settings' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.4.0'})
        request.setQuery( 'uuid', '123')
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.4.0', reactVersion:'0.1.0' ,size: 2243785, setting: { test:1}})            
    })

    test ( 'version found, uuid found, uuid has not settings' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        request.setQuery( 'uuid', '234')
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.5.0', reactVersion:'0.2.2' ,size: 2627722, setting: { logRest:{ sendInterval:10 }}})            
    })

    test ( 'version found, uuid found, uuid overwrites app setting' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        request.setQuery( 'uuid', '345')
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.5.0', reactVersion:'0.2.2' ,size: 2627722, setting: { logRest:{ sendInterval:12 }}})            
    })

    test ( 'version found, uuid found, uuid overwrites react version' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        request.setQuery( 'uuid', 'app')
        const response = new Response();
        db = testData;
        

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.5.0', reactVersion:'0.2.3' ,size:12345, setting: { logRest:{ sendInterval:10 }}})            
    })


    test ( 'version found, uuid not found' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        request.setQuery( 'uuid', 'xxxx')
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.5.0', reactVersion:'0.2.2' ,size: 2627722, setting: { logRest:{ sendInterval:10 }}})            
    })


    test ( 'version not found' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.1.0'})
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({})        
    })

    test ( 'app not found' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'other app', version:'0.1.0'})
        const response = new Response();
        db = testData;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(404)
        expect(response['result'].message).toEqual('not found')        
        expect(response['result'].error).toEqual(true)        
    })


    test ( 'DB error' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.1.0'})
        const response = new Response();

        db = undefined;
        err = new Error('some error')

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(500)
        expect(response['result'].message).toEqual('server error')        
        expect(response['result'].error).toEqual(true)        
    })

    test ( 'DB no settings' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        const response = new Response();

        db = JSON.parse(JSON.stringify(testData))
        db.settings = undefined;

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({appVersion:'0.5.0', reactVersion:'0.2.2' ,size: 2627722, setting: { logRest:{ sendInterval:10 }}})            

    })

    test ( 'DB empty' ,async ()=> {
        const request = new Request();
        request.setParams( { app:'incyclist', version:'0.5.0'})
        const response = new Response();

        db = {}

        await c.getApp( request,response,next)
        expect(response['result'].status).toEqual(404)
        expect(response['result'].message).toEqual('not found')        
        expect(response['result'].error).toEqual(true)        

    })


})


