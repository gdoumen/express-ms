import ProbeController from './probe'
import { Request } from 'jest-express/lib/request';
import { Response } from 'jest-express/lib/response';

describe ( 'getProbe' ,() => {

    let c;

    beforeAll( ()=> {
        c = new ProbeController('/');
    })


    test ( 'healthy' , ()=> {
        const request = new Request();
        const response = new Response();
        const next = jest.fn();

        c.getProbe( request,response,next)
        expect(response['result'].status).toEqual(200)
        expect(response['result'].json).toEqual({})            
    })
});