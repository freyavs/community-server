import { CredentialsExtractor } from '../../../src/authentication/CredentialsExtractor';
import { Authorizer } from '../../../src/authorization/Authorizer';
import { AuthenticatedLdpHandler, AuthenticatedLdpHandlerArgs } from '../../../src/ldp/AuthenticatedLdpHandler';
import { RequestParser } from '../../../src/ldp/http/RequestParser';
import { ResponseWriter } from '../../../src/ldp/http/ResponseWriter';
import { Operation } from '../../../src/ldp/operations/Operation';
import { OperationHandler } from '../../../src/ldp/operations/OperationHandler';
import { PermissionsExtractor } from '../../../src/ldp/permissions/PermissionsExtractor';
import { HttpRequest } from '../../../src/server/HttpRequest';
import { HttpResponse } from '../../../src/server/HttpResponse';
import { StaticAsyncHandler } from '../../util/StaticAsyncHandler';

describe('An AuthenticatedLdpHandler', (): void => {
  let args: AuthenticatedLdpHandlerArgs;
  let responseFn: jest.Mock<Promise<void>, [any]>;

  beforeEach(async(): Promise<void> => {
    const requestParser: RequestParser = new StaticAsyncHandler(true, 'parser' as any);
    const credentialsExtractor: CredentialsExtractor = new StaticAsyncHandler(true, 'credentials' as any);
    const permissionsExtractor: PermissionsExtractor = new StaticAsyncHandler(true, 'permissions' as any);
    const authorizer: Authorizer = new StaticAsyncHandler(true, 'authorizer' as any);
    const operationHandler: OperationHandler = new StaticAsyncHandler(true, 'operation' as any);
    const responseWriter: ResponseWriter = new StaticAsyncHandler(true, 'response' as any);

    responseFn = jest.fn(async(input: any): Promise<void> => {
      if (!input) {
        throw new Error('error');
      }
    });
    responseWriter.canHandle = responseFn;

    args = { requestParser, credentialsExtractor, permissionsExtractor, authorizer, operationHandler, responseWriter };
  });

  it('can be created.', async(): Promise<void> => {
    expect(new AuthenticatedLdpHandler(args)).toBeInstanceOf(AuthenticatedLdpHandler);
  });

  it('can check if it handles input.', async(): Promise<void> => {
    const handler = new AuthenticatedLdpHandler(args);

    await expect(handler.canHandle(
      { request: {} as HttpRequest, response: {} as HttpResponse },
    )).resolves.toBeUndefined();
  });

  it('can handle input.', async(): Promise<void> => {
    const handler = new AuthenticatedLdpHandler(args);

    await expect(handler.handle({ request: 'request' as any, response: 'response' as any })).resolves.toBeUndefined();
    expect(responseFn).toHaveBeenCalledTimes(1);
    expect(responseFn).toHaveBeenLastCalledWith({ response: 'response', result: 'operation' as any });
  });

  it('sends an error to the output if a handler does not support the input.', async(): Promise<void> => {
    args.requestParser = new StaticAsyncHandler(false, {} as Operation);
    const handler = new AuthenticatedLdpHandler(args);

    await expect(handler.handle({ request: 'request' as any, response: {} as HttpResponse })).resolves.toBeUndefined();
    expect(responseFn).toHaveBeenCalledTimes(1);
    expect(responseFn.mock.calls[0][0].result).toBeInstanceOf(Error);
  });

  it('errors if the response writer does not support the result.', async(): Promise< void> => {
    args.responseWriter = new StaticAsyncHandler(false, undefined);
    const handler = new AuthenticatedLdpHandler(args);

    await expect(handler.handle({ request: 'request' as any, response: {} as HttpResponse })).rejects.toThrow(Error);
  });
});
