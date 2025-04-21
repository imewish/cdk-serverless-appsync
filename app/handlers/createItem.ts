import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { AppSyncResolverEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: AppSyncResolverEvent<{ input: { name: string; description?: string } }>) => {
  try {
    const { name, description } = event.arguments.input;
    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(item)
    });

    await dynamoDb.send(command);
    return item;
  } catch (error) {
    console.error('Error in createItem:', error);
    throw error;
  }
}; 