import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { AppSyncResolverEvent } from 'aws-lambda';

const dynamoDb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: AppSyncResolverEvent<{ id: string }>) => {
  try {
    const { id } = event.arguments;
    console.log({API_KEY: process.env.API_KEY})
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id })
    });

    const result = await dynamoDb.send(command);
    return result.Item ? unmarshall(result.Item) : null;
  } catch (error) {
    console.error('Error in getItem:', error);
    throw error;
  }
}; 