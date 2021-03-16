import 'aws-sdk';
import { ApiGatewayManagementApi, AWSError } from 'aws-sdk';
import { ClientConfiguration } from 'aws-sdk/clients/acm';

import CONSTANTS from '../constants';
import dynamodbConnector from './dynamodb.connector';

class ApiGatewayConnector {
  _connector: ApiGatewayManagementApi;

  constructor() {
    const CONNECTOR_OPS: ClientConfiguration = {
      endpoint: CONSTANTS.WEBSOCKET_API_ENDPOINT,
    };
    this._connector = new ApiGatewayManagementApi(CONNECTOR_OPS);
  }

  get connector() {
    return this._connector;
  }

  async generateSocketMessage(connectionId: string, data: Object) {
    try {
      return await this._connector.postToConnection({
        ConnectionId: connectionId,
        Data: data,
      }).promise();
    } catch (e) {
      console.error('Unable to generate socket message', e);
      if (e.statusCode === 410) {
        console.log(`Removing stale connector ${connectionId}`);
        await dynamodbConnector.removeSocket(connectionId);
      }
    }
  }
}

const APIGW_CONNECTOR = new ApiGatewayConnector();
export default APIGW_CONNECTOR;
