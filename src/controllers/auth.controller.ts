import { APIGatewayProxyHandler, AuthResponse, PolicyDocument, Statement } from 'aws-lambda';
import fetch from 'node-fetch';
import 'node-jose';
import { JWK, JWS, util } from 'node-jose';

import congnitoConnector from './../connector/cognito.connector';
import CONSTANT from './../constants';

interface CustomAuthResponse {
  token: string,
  refresh: string,
  user: string,
}

const generatePolicy = function (principalId: string, effect: string, resource: string): AuthResponse {
  const policyDocument: PolicyDocument = {
    Version: '2012-10-17',
    Statement: [], 
  };
  const statementOne: Statement = {
    Action: 'execute-api:Invoke',
    Effect: effect,
    Resource: resource,
  };
  policyDocument.Statement.push(statementOne);
  return {
    principalId,
    policyDocument,
  };
}

const generateAllow = function (principalId: string, resource: string)  {
  return generatePolicy(principalId, 'Allow', resource);
}

export const authUser: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const data = JSON.parse(event.body);

    const user = data.user;
    const password = data.password;

    if (!user || !password) {
      const error = 'User and password are required.';
      console.error(error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': CONSTANT.CORS_ORIGIN,
        },
        body: error,
      };
    } else {
      const result = await congnitoConnector.authenticateUser(user, password);
      const response: CustomAuthResponse = {
        token: result.tokenId,
        refresh: result.refreshToken,
        user,
      };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': CONSTANT.CORS_ORIGIN,
        },
        body: JSON.stringify(response),
      };
    }
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANT.CORS_ORIGIN,
      },
      body: 'Unable to authenticate user using AWS Cognito',
    };
  }
}

// TODO: fix deprecated code and Promise<any>
export const authWebsocket: APIGatewayProxyHandler = async (event, context): Promise<any> => {
  const methodArn = event['methodArn'];
  const token = event.queryStringParameters.Authorizer;

  if (!token) {
    return context.fail('Unauthorized');
  } else {
    const sections = token.split('.');
    let header = util.base64url.decode(sections[0]);
    const header_parsed = JSON.parse(header.toString());
    const kid = header_parsed.kid;

    // validate JWT token
    // https://docs.aws.amazon.com/ja_jp/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
    const rawRes = await fetch(CONSTANT.KEYS_URL);
    const response = await rawRes.json();

    if (rawRes.ok) {
      const keys = response['keys'];
      const foundKey = keys.find((key) => key.kid === kid);

      if (!foundKey) {
        context.fail('Public key not found in jwks.json');
      } else {
        try {
          console.log(`methodArn: ${methodArn}, token: ${token}`);
          const result = await JWK.asKey(foundKey);
          console.log(`result: ${JSON.stringify(result)}`);
          const keyVerify = JWS.createVerify(result);
          console.log(`keyVerify: ${JSON.stringify(keyVerify)}`);
          const verificationResult = await keyVerify.verify(token);
          console.log(`verificationResult: ${JSON.stringify(verificationResult)}`);

          const claims = JSON.parse(verificationResult.payload.toString());
          console.log(`claims: ${JSON.stringify(claims)}`);

          // Verify the token expiration
          const currentTime = Math.floor((new Date()).getTime() / 1000);
          if (currentTime > claims.exp) {
            console.error('Token expired');
            context.fail('Token expired');
          } else if (claims['client_id'] !== CONSTANT.COGNITO_USER_POOL_CLIENT) {
            console.error(`claims.aud: ${claims.aud}`);
            console.error(`CONSTANT.COGNITO_USER_POOL_CLIENT: ${CONSTANT.COGNITO_USER_POOL_CLIENT}`);
            console.error('Token wasn\'t issued for target audience');
            context.fail('Token wasn\'t issued for target audience');
          } else {
            context.succeed(generateAllow('me', methodArn));
          }
        } catch (e) {
          console.error('Unable to verify token', e);
          context.fail('Signature verification failed.');
        }
      }
    }
  }
}

// TODO: fix any typing
export const autoConfirmUser: any = (event: any, _context: any, callback: any) => {
  event['response']['autoConfirmUser'] = true;
  callback(null, event);
}

export const refreshToken: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const data = JSON.parse(event.body);
    const user = data.user;
    const refresh = data.refresh;

    if (!user || !refresh) {
      const error = 'user and refresh token are required.';
      console.error(error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': CONSTANT.CORS_ORIGIN,
        },
        body: error,
      };
    } else {
      const result = await congnitoConnector.refreshToken(user, refresh);
      const response: CustomAuthResponse = {
        token: result.tokenId,
        refresh: result.refreshToken,
        user,
      };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': CONSTANT.CORS_ORIGIN,
        },
        body: JSON.stringify(response),
      };
    }
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANT.CORS_ORIGIN,
      },
      body: 'Unable to refresh user token using AWS Cognito'
    };
  }
}
