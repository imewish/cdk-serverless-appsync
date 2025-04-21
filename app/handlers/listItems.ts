import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AppSyncResolverEvent } from 'aws-lambda';

const dynamoDb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: AppSyncResolverEvent<void>) => {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });

    const result = await dynamoDb.send(command);
    return result.Items?.map(item => unmarshall(item)) || [];
  } catch (error) {
    console.error('Error in listItems:', error);
    throw error;
  }
}; 