import { APIGatewayProxyHandler } from "aws-lambda";
import { SocketMessage } from "../types";
import dynamodbconnector from '../connector/dynamodb.connector';
import apigatewayconnector from '../connector/apigateway.connector';
import CONSTANTS from '../constants';

export const sendmsg: APIGatewayProxyHandler = async (event, _context) => {
  try {
    //const connectionId = event.requestContext.connectionId;
    const data = JSON.parse(event.body);

    const message = data['message'];
    const timestamp = data['timestamp'];
    const fromSub = data['fromSub'];
    const toSub = data['toSub'];

    const messageId = await dynamodbconnector.registerMessage(message, fromSub, toSub, timestamp);
    // send Message to partner user
    const sockets = await dynamodbconnector.findSocketsBySub(toSub);
    if (sockets.Count > 0) {
      const sendMessage: SocketMessage = {
        action: 'SENDMSG',
        message,
        fromSub,
        toSub,
        timestamp,
      };
      await apigatewayconnector.generateSocketMessage(
        sockets.Items[0].connectionId,
        JSON.stringify(sendMessage),
      );
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
    console.error('Failed to store message and send message to partner user', e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Failed to store message and send message to partner user',
    };
  }
}
