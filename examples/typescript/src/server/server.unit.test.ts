import Server from './server'
import Controller, {ControllerResponse} from '../controllers/controller'
import express,{Response}  from 'express'
import path from 'path'

jest.mock('express', () => {
    return require( 'jest-express')
})

class MockConroller implements Controller {
    path =  '/'
    router =  jest.fn();

    constructor(path?: string) {
        this.initRoutes = jest.fn();
        this.setResponse = jest.fn();
        this.path = path
    }
    initRoutes(): void {
        throw new Error('Method not implemented.');
    }
    setResponse(_res: Response, _result: ControllerResponse): this {
        throw new Error('Method not implemented.');
    }
}

describe ('Constructor',()=> {

    let init;

    beforeEach( ()=> {
        init = Server.prototype.init
        Server.prototype.init = jest.fn();
    })
    afterEach( ()=> {
        Server.prototype.init = init;
    })

    test('only mandatory parameters', ()=> {
        const server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller() });
        const opts = server['opts'];
        expect(opts.name).toBe('test');
        expect(opts.version).toBe('1');
        expect(opts.port).toBe(2000);
        expect(server.init).toBeCalled();
    })

    test('disable auto-init', ()=> {
        const server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false });
        const opts = server['opts'];
        expect(opts.name).toBe('test');
        expect(opts.version).toBe('1');
        expect(opts.port).toBe(2000);
        expect(server.init).not.toBeCalled();
    })

})

//type staticHandler(root: string, options?: serveStatic.ServeStaticOptions): express.Handler

describe ('serveStatic',()=> {

    let server;
    
    test('wo /', ()=> {
        const assets = {path:'/assets', directory:'/dir', opts:{ dummy:true}};
        
        server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false });
        server.serveStatic( assets.directory,assets.opts);

        expect( express.static).toHaveBeenCalledWith(path.join('/dir/',''),{ dummy:true})
    })

    test('with /', ()=> {
        const assets = {path:'/assets', directory:'/dir/', opts:{ dummy:true}};
        
        server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false });
        server.serveStatic( assets.directory,assets.opts);

        expect( express.static).toHaveBeenCalledWith(path.join('/dir/',''),{ dummy:true})
    })

    test('with subdirs', ()=> {
        const assets = {path:'/assets', directory:'/dir/sub/sub2', opts:{ dummy:true}};
        
        server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false });
        server.serveStatic( assets.directory,assets.opts);

        expect( express.static).toHaveBeenCalledWith(path.join('/dir/sub/sub2/',''),{ dummy:true})
    })

});

describe ('initAssets',()=> {

    let server;
    beforeEach( ()=> {
        
        server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false});
        server.app.use = jest.fn();
        server.serveStatic = jest.fn();
        
    })

    test('only mandatory parameters', ()=> {
        const assets = {path:'/assets', directory:'/dir', opts:{ dummy:true}};

        server.initAssets([assets]);

        expect(server.app.use).toHaveBeenCalledTimes(1);
        expect(server.app.use).toHaveBeenCalledWith( assets.path, server.serveStatic(assets.directory,assets.opts));
    })

    test('no assets', ()=> {
        server.initAssets();

        expect(server.app.use).toHaveBeenCalledTimes(0);
    })

    test('empty assets', ()=> {
        server.initAssets([]);

        expect(server.app.use).toHaveBeenCalledTimes(0);
    })

    // todo: same path used multiple times

})

describe ('initMiddleware',()=> {

    let server;
    beforeEach( ()=> {
        server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false});
        server.app.use = jest.fn();        
    })

    test('multiple middleware functions', ()=> {
        const mw1 = jest.fn();
        const mw2 = jest.fn();

        server.initMiddleware([mw1,mw2]);

        expect(server.app.use).toHaveBeenCalledTimes(2);
        expect(server.app.use).toHaveBeenNthCalledWith(1,  mw1);
        expect(server.app.use).toHaveBeenNthCalledWith(2,  mw2);
    })

    test('no middleware', ()=> {
        server.initMiddleware();
        expect(server.app.use).toHaveBeenCalledTimes(0);
    })

    test('empty middleware', ()=> {
        server.initMiddleware([]);
        expect(server.app.use).toHaveBeenCalledTimes(0);
    })

    // todo: same path used multiple times

})


describe ('initRoutes',()=> {

    let server;
    beforeEach( ()=> {
        server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false});
        server.app.use = jest.fn();        
    })

    test('only mandatory parameters', ()=> {
        const route1 = new MockConroller('/1');
        const route2 = new MockConroller('/2');

        server.initRoutes([route1,route2]);

        expect(server.app.use).toHaveBeenCalledTimes(2);
        expect(server.app.use).toHaveBeenNthCalledWith(1,'/1',route1.router);
        expect(server.app.use).toHaveBeenNthCalledWith(2,'/2',route2.router);
    })

    test('no routes', ()=> {
        server.initRoutes();

        expect(server.app.use).toHaveBeenCalledTimes(0);
    })

    test('empty routes', ()=> {
        server.initRoutes([]);

        expect(server.app.use).toHaveBeenCalledTimes(0);
    })

    test('ingle route', ()=> {
        const route1 = new MockConroller('/1');

        server.initRoutes(route1);

        expect(server.app.use).toHaveBeenCalledTimes(1);
        expect(server.app.use).toHaveBeenNthCalledWith(1,'/1',route1.router);
    })


    // todo: same path used multiple times

})




describe ('start',()=> {

    let server;
    beforeEach( ()=> {
        server = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false});
    })

    test('only mandatory parameters', ()=> {
        server.app.listen = jest.fn();        
        server.start()

        expect(server.app.listen).toHaveBeenCalledTimes(1);
        expect(server.app.listen).toHaveBeenCalledWith(2000,expect.anything());
    })

    test('only mandatory parameters', ()=> {

        server.app.listen = jest.fn( (port,cb): void => { cb() });        
        server.logger.log = jest.fn();
        server.start()

        expect(server.logger.log).toHaveBeenCalledTimes(1);
        expect(server.logger.log).toHaveBeenCalledWith('Server listening on port 2000!');
    })

});


describe ('init',()=> {

    let srv =undefined;
    beforeEach( ()=> {
        srv = new Server( {name:'test',version:'1',port:2000, controllers: new MockConroller(),autoInit:false});
        srv.initMiddleware = jest.fn();        
        srv.initAssets = jest.fn();        
        srv.initRoutes = jest.fn();        
    })

    test('only mandatory parameters',   ()=> {
        srv.init()

        expect(srv.initMiddleware).toHaveBeenCalledTimes(2);
    })

});