import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface SocketMessage {
  action: string,
  value?: string,
  error?: string,
}

export interface SocketLogsMessage {
  action: string,
  messages: DocumentClient.AttributeMap[],
}
