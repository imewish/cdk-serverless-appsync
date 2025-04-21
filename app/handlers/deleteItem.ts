import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { AppSyncResolverEvent } from 'aws-lambda';

const dynamoDb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: AppSyncResolverEvent<{ id: string }>) => {
  try {
    const { id } = event.arguments;

    const command = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id })
    });

    await dynamoDb.send(command);
    return true;
  } catch (error) {
    console.error('Error in deleteItem:', error);
    throw error;
  }
}; 