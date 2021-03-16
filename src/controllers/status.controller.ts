import { APIGatewayProxyHandler } from "aws-lambda";
import { SocketMessage } from "../types";
import dynamodbconnector from '../connector/dynamodb.connector';
import apigatewayconnector from '../connector/apigateway.connector';
import cognitoconnector from '../connector/cognito.connector';
import CONSTANTS from '../constants';

export const status: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const data = JSON.parse(event.body);

    const partnerSub = data['partnerSub'];

    try {
      const res = await cognitoconnector.findUserBySub(partnerSub);
      console.log(`Fetched username: ${res}`);
      try {
        const partnerInfoMessage: SocketMessage = {
          action: 'PARTNERINFO',
          value: res.Users[0].Username,
        };
        await apigatewayconnector.generateSocketMessage(
          connectionId,
          JSON.stringify(partnerInfoMessage),
        );
      } catch (e) {
        console.error(`Unable to deliver message to ${connectionId}`, e);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
          },
          body: 'Unable to deliver message',
        };
      }
    } catch (e) {
      console.error('Failed to find partner user by sub', e);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
        },
        body: 'Failed to find partner user by sub',
      };
    }

    // find partner user status
    const partnerSockets = await dynamodbconnector.findSocketsBySub(partnerSub);
    if (partnerSockets.Count > 0) {
      try {
        const statusUpdateMessage: SocketMessage = {
          action: 'ISONLINE',
          value: '1'
        };
        await apigatewayconnector.generateSocketMessage(
          connectionId,
          JSON.stringify(statusUpdateMessage),
        );
      } catch (e) {
        console.error(`Unable to deliver message to ${connectionId}`, e);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
          },
          body: 'Unable to deliver message',
        };
      }
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
      body: 'Unable to send user status.',
    };
  }
}
