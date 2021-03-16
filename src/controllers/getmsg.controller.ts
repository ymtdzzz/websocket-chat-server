import { APIGatewayProxyHandler } from "aws-lambda";
import { SocketLogsMessage } from "../types";
import dynamodbconnector from '../connector/dynamodb.connector';
import apigatewayconnector from '../connector/apigateway.connector';
import CONSTANTS from '../constants';

export const getmsg: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const data = JSON.parse(event.body);

    const fromSub = data['fromSub'];
    const toSub = data['toSub'];

    const res1 = await dynamodbconnector.findMessagesByBothSubs(fromSub, toSub);
    const res2 = await dynamodbconnector.findMessagesByBothSubs(toSub, fromSub);
    if (res1.Count > 0 || res2.Count > 0) {
      const msgs = [...(res1.Items.map(msg => msg)), ...(res2.Items.map(msg => msg))].sort((a, b) => {
        return a.timestamp - b.timestamp
      });
      const sendMessage: SocketLogsMessage = {
        action: 'GETMSG',
        messages: msgs,
      };
      await apigatewayconnector.generateSocketMessage(
        connectionId,
        JSON.stringify(sendMessage),
      );
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Logs delivered',
    };
  } catch (e) {
    console.error('Failed to deliver logs', e);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': CONSTANTS.CORS_ORIGIN,
      },
      body: 'Failed to deliver logs',
    };
  }
}
