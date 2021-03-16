import { APIGatewayProxyHandler } from 'aws-lambda';
import apigatewayconnector from '../connector/apigateway.connector';
import dynamodbconnector from '../connector/dynamodb.connector';
import CONSTANTS from '../constants';
import { SocketMessage } from '../types';

export const greeting: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const data = JSON.parse(event.body);
    const greetingMessage: SocketMessage = {
      action: data.action,
      value: data.message,
    };

    const sockets = await dynamodbconnector.findSocketsBySubscription('chat');
    if (sockets.Count > 0) {
      const deliverableSockets = sockets.Items.filter((socket) => socket.connectionId !== connectionId);

      for (const socket of deliverableSockets) {
        try {
          await apigatewayconnector.generateSocketMessage(
            socket.connectionId,
            JSON.stringify(greetingMessage),
          );
        } catch (e) {
          console.error(`Unable to deliver message to ${socket.connectionId}`, e);
        }
      }
    } else {
      console.log('No sockets subscribed to greetings found.');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Greeting delivered',
    };
  } catch (e) {
    console.error('Unable to generate greeting', e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Unable to generate greeting.',
    };
  }
}  
