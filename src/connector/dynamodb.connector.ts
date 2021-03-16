import 'aws-sdk';
import { DynamoDB } from 'aws-sdk';
import { DeleteItemInput, PutItemInput, QueryInput } from 'aws-sdk/clients/dynamodb';
import CONSTANTS from '../constants';
import { randomBytes } from 'crypto';

class DynamoDbConnector {
  _connector: DynamoDB.DocumentClient;
  
  constructor() {
    this._connector = new DynamoDB.DocumentClient(CONSTANTS.DYNAMODB_OPTIONS);
  }

  get connector() {
    return this._connector;
  }

  async findSocketsByConnectionId(connectionId: string) {
    const queryParams: QueryInput = {
      TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
      KeyConditionExpression: '#ci = :ci',
      ExpressionAttributeNames: {
        '#ci': 'connectionId',
      },
      ExpressionAttributeValues: {
        ':ci': connectionId,
      },
    };

    return await this._connector.query(queryParams).promise();
  }

  async findSocketsBySubscription(subscription: string) {
    const queryParams: QueryInput = {
      TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
      IndexName: CONSTANTS.DYNAMODB_SOCKETS_TYPE_GSI,
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': subscription,
      },
    };
    
    return await this._connector.query(queryParams).promise();
  }

  async findSocketsByPartnerSub(partnerSub: string) {
    const queryParams: QueryInput = {
      TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
      IndexName: CONSTANTS.DYNAMODB_SOCKETS_PARTNER_SUB_GSI,
      KeyConditionExpression: '#ps = :ps',
      ExpressionAttributeNames: {
        '#ps': 'partnerSub',
      },
      ExpressionAttributeValues: {
        ':ps': partnerSub,
      },
    };

    return await this._connector.query(queryParams).promise();
  }

  async findSocketsBySub(sub: string) {
    const queryParams: QueryInput = {
      TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
      IndexName: CONSTANTS.DYNAMODB_SOCKETS_SUB_GSI,
      KeyConditionExpression: '#s = :s',
      ExpressionAttributeNames: {
        '#s': 'sub',
      },
      ExpressionAttributeValues: {
        ':s': sub,
      },
    };

    return await this._connector.query(queryParams).promise();
  }

  async registerSocket(connectionId: string, connectionType: string, sub: string, partnerSub: string) {
    const socketParams: PutItemInput = {
      TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
      Item: {
        connectionId,
        type: connectionType,
        sub,
        partnerSub,
      }
    } 
    return await this._connector.put(socketParams).promise();
  }

  async removeSocket(connectionId: string) {
    const socketParams: DeleteItemInput = {
      TableName: CONSTANTS.DYNAMODB_SOCKETS_TABLE,
      Key: {
        connectionId,
      }
    }
    return await this._connector.delete(socketParams).promise();
  }

  async registerMessage(message: string, fromSub: string, toSub: string, timestamp: number) {
    const messageId = randomBytes(10).reduce((p, i) => p + (i % 36).toString(36), '')  
    const messageParams: PutItemInput = {
      TableName: CONSTANTS.DYNAMODB_LOGS_TABLE,
      Item: {
        messageId,
        message,
        fromSub,
        toSub,
        timestamp,
      },
    }
    return await this._connector.put(messageParams).promise();
  }

  async findMessagesByBothSubs(fromSub: string, toSub: string) {
    const queryParams: QueryInput = {
      TableName: CONSTANTS.DYNAMODB_LOGS_TABLE,
      IndexName: CONSTANTS.DYNAMODB_LOGS_TO_SUB_GSI,
      KeyConditionExpression: '#ts = :ts',
      FilterExpression: '#fs = :fs',
      ExpressionAttributeNames: {
        '#ts': 'toSub',
        '#fs': 'fromSub',
      },
      ExpressionAttributeValues: {
        ':ts': toSub,
        ':fs': fromSub,
      },
    }
    return await this._connector.query(queryParams).promise();
  }
}

const DYNAMODB_CONNECTOR = new DynamoDbConnector();
export default DYNAMODB_CONNECTOR;
