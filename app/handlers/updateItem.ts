import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { AppSyncResolverEvent } from 'aws-lambda';

const dynamoDb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: AppSyncResolverEvent<{ id: string; input: { name?: string; description?: string } }>) => {
  try {
    const { id, input } = event.arguments;
    const now = new Date().toISOString();

    const updateExpression = [];
    const expressionAttributeValues: any = { ':updatedAt': { S: now } };
    const expressionAttributeNames: any = {};

    if (input.name) {
      updateExpression.push('#name = :name');
      expressionAttributeValues[':name'] = { S: input.name };
      expressionAttributeNames['#name'] = 'name';
    }

    if (input.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeValues[':description'] = { S: input.description };
      expressionAttributeNames['#description'] = 'description';
    }

    const command = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id }),
      UpdateExpression: `SET ${updateExpression.join(', ')}, updatedAt = :updatedAt`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW'
    });

    const result = await dynamoDb.send(command);
    return result.Attributes ? unmarshall(result.Attributes) : null;
  } catch (error) {
    console.error('Error in updateItem:', error);
    throw error;
  }
}; 