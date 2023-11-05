import responseSender from './response-sender'
import {Request,Response} from 'express'

describe ( 'responseSender' ,() => {

    let request: Partial<Request>;
    let response: Partial<Response>;

    beforeEach( ()=> {
        request = {};
        response = {};
        response.status = jest.fn( (): Response => { return response as Response} )
        response.send = jest.fn();
        response.sendFile = jest.fn();
    })


    test ( 'succes:json' , ()=> {

        response['result'] = { 
            status: 200,
            json: {a:1, b:2}
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.send).toHaveBeenCalledWith({a:1,b:2})            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'succes:file' , ()=> {

        response['result'] = { 
            status: 200,
            file: './somefile'
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)

        expect(response.sendFile).toHaveBeenCalledWith('./somefile')            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'succes, but no status code' , ()=> {

        response['result'] = { 
            json: {a:1, b:2}
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)
        
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.send).toHaveBeenCalledWith({a:1,b:2})            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'error with message, wo status' , ()=> {

        response['result'] = { 
            error: true,
            message: 'some message' 
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)
        
        expect(response.status).toHaveBeenCalledWith(500)
        expect(response.send).toHaveBeenCalledWith('some message')            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'error with message, with status' , ()=> {

        response['result'] = { 
            error: true,
            status: 404,
            message: 'not found' 
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)
        
        expect(response.status).toHaveBeenCalledWith(404)
        expect(response.send).toHaveBeenCalledWith('not found')            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'error object, no message, no status' , ()=> {

        response['result'] = { 
            error: { a:1},
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)
        
        expect(response.status).toHaveBeenCalledWith(500)
        expect(response.send).toHaveBeenCalledWith({a:1})            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'error object, no message, with status' , ()=> {

        response['result'] = { 
            error: { a:1},
            status: 505
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)
        
        expect(response.status).toHaveBeenCalledWith(505)
        expect(response.send).toHaveBeenCalledWith({a:1})            
        expect(next).not.toHaveBeenCalled()
    })


    test ( 'error object, with message, no status' , ()=> {

        response['result'] = { 
            error: { a:1},
            message: 'hello world'
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)
        
        expect(response.status).toHaveBeenCalledWith(500)
        expect(response.send).toHaveBeenCalledWith('hello world')            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'error and json ' , ()=> {

        response['result'] = { 
            error: { a:1},
            message: 'hello world',
            json: { b:2}
        }     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)
        
        expect(response.status).toHaveBeenCalledWith(500)
        expect(response.send).toHaveBeenCalledWith('hello world')            
        expect(next).not.toHaveBeenCalled()
    })

    test ( 'no result' , ()=> {

        const next = jest.fn();
        responseSender( request as Request,response as Response,next)

        expect(next).toHaveBeenCalled()
        expect(response.status).not.toHaveBeenCalled()
        expect(response.send).not.toHaveBeenCalled()            
    })

    test ( 'empty result' , ()=> {

        response['result'] = {}     
        const next = jest.fn();
        responseSender( request as Request,response as Response,next)

        expect(next).toHaveBeenCalled()
        expect(response.status).not.toHaveBeenCalled()
        expect(response.send).not.toHaveBeenCalled()            
    })

});