import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppSyncApi } from './appsync/appsync-api';
import { LambdaFunctions } from './lambda/functions';
import { DynamoDBPermissions } from './permissions/dynamodb-permissions';
import { ItemsTable } from './database/items-table';
import { ServiceConfig, getResourceName } from './config';

export interface MainStackProps extends cdk.StackProps {
  config: ServiceConfig;
}

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const itemsTable = new ItemsTable(this, 'ItemsTable', {
      tableName: getResourceName(props.config, 'items-table'),
    });

    // Create Lambda functions
    const lambdaFunctions = new LambdaFunctions(this, 'LambdaFunctions', {
      config: props.config,
      stage: props.config.stage,
      rootPath: props.config.rootPath,
    });

    // Create AppSync API
    new AppSyncApi(this, 'AppSyncApi', {
      lambdaFunctions,
      config: props.config,
    });

    // Grant DynamoDB permissions to Lambda functions
    new DynamoDBPermissions(this, 'DynamoDBPermissions', {
      table: itemsTable.table,
      lambdaFunctions,
    });
  }
} 