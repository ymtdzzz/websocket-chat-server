import { APIGatewayEvent, APIGatewayEventRequestContext, APIGatewayProxyHandler } from 'aws-lambda';
import apigatewayconnector from '../connector/apigateway.connector';
import dynamodbconnector from '../connector/dynamodb.connector';
import cognitoconnector from '../connector/cognito.connector';
import CONSTANTS from '../constants';
import { SocketMessage } from '../types';

export const defaultSocketHandler: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const data = JSON.parse(event.body);
    // TODO: typeguard
    const action = data.action;

    const connectionId = event.requestContext.connectionId;
    switch(action) {
      case 'PING':
        const res: SocketMessage = {
          action: 'PING',
          value: 'PONG',
        };
        const pingResponse = JSON.stringify(res);
        await apigatewayconnector.generateSocketMessage(connectionId, pingResponse);
        break;
      default:
        const invalidRes: SocketMessage = {
          action: 'ERROR',
          error: 'Invalid request',
        };
        const invalidResponse = JSON.stringify(invalidRes);
        await apigatewayconnector.generateSocketMessage(connectionId, invalidResponse);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Default socket response',
    };
  } catch (e) {
    console.error('Unable to generate default response', e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Default socket response error.',
    }
  }
};

export const handleSocketConnect: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const connectionType = (event.queryStringParameters) ? event.queryStringParameters.connectionType : '';
    const sub = (event.queryStringParameters) ? event.queryStringParameters.sub : '';
    const selfSub = (event.queryStringParameters) ? event.queryStringParameters.selfSub : '';
    
    await dynamodbconnector.registerSocket(connectionId, connectionType, selfSub, sub);

    // find sockets to be sent status update message
    const sockets = await dynamodbconnector.findSocketsByPartnerSub(selfSub);
    const items = sockets.Items.map((i) => i);
    for (const socket of items) {
      try {
        const statusUpdateMessage: SocketMessage = {
          action: 'ISONLINE',
          value: '1',
        };
        await apigatewayconnector.generateSocketMessage(
          socket.connectionId,
          JSON.stringify(statusUpdateMessage),
        );
      } catch (e) {
        console.error(`Unable to deliver message to ${socket.connectionId}`, e);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Socket successfully registered.',
    };
  } catch (e) {
    console.error('Unable to inintialize socket connection', e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Unable to register socket.',
    };
  }
};

export const handleSocketDisconnect: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const connectionId = event.requestContext.connectionId;

    const sockets = await dynamodbconnector.findSocketsByConnectionId(connectionId);
    await dynamodbconnector.removeSocket(connectionId);

    if (sockets.Count > 0) {
      const deletedSocketSub = sockets.Items[0]['sub'];
      const otherSockets = await dynamodbconnector.findSocketsByPartnerSub(deletedSocketSub);
      if (otherSockets.Count > 0) {
        for (const socket of otherSockets.Items) {
          const statusUpdateMessage: SocketMessage = {
            action: 'ISONLINE',
            value: '0',
          };
          await apigatewayconnector.generateSocketMessage(
            socket.connectionId,
            JSON.stringify(statusUpdateMessage),
          );
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Socket successfully terminated.',
    };
  } catch (e) {
    console.error('Unable to terminate socket connection', e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Unable to terminate socket.',
    }
  }
}; 
