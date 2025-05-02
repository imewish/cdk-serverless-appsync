#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const app = new cdk.App();

// Get stage from context or default to 'dev'
const stage = app.node.tryGetContext('stage') || 'dev';

// Create DynamoDB stack
new DynamoDBStack(app, 'DynamoDBStack', {
  stage,
  tableName: `items-table-${stage}`,
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.STRING
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: 'DESTROY',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
}); 