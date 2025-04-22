import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { AuthorizationType } from 'aws-cdk-lib/aws-appsync';

export interface IAMPermission {
  actions: string[];
  resources: string[];
}

export interface LambdaFunctionConfig {
  name: string;
  handler: string;
  entry: string;
  runtime?: Runtime;
  timeout?: Duration;
  memorySize?: number;
  environment?: Record<string, string>;
  permissions?: IAMPermission[];
  logRetention?: RetentionDays;
  bundling?: {
    minify?: boolean;
    sourceMap?: boolean;
    target?: string;
    externalModules?: string[];
  };
}

export interface AppSyncConfig {
  name: string;
  schema: string;
  authenticationType: AuthorizationType;
  apiKeyConfig?: {
    expires: cdk.Expiration;
  };
  logConfig?: {
    fieldLogLevel: 'ALL' | 'ERROR' | 'NONE';
    retention?: RetentionDays;
  };
  xrayEnabled?: boolean;
  resolvers?: {
    typeName: string;
    fieldName: string;
    dataSource: string;
  }[];
}

export interface DynamoDBConfig {
  tableName: string;
  partitionKey: {
    name: string;
    type: 'STRING' | 'NUMBER' | 'BINARY';
  };
  sortKey?: {
    name: string;
    type: 'STRING' | 'NUMBER' | 'BINARY';
  };
  billingMode?: 'PAY_PER_REQUEST' | 'PROVISIONED';
  readCapacity?: number;
  writeCapacity?: number;
  removalPolicy?: 'DESTROY' | 'RETAIN';
}

export interface SecretConfig {
  name: string;
  description?: string;
  variables: {
    [key: string]: {
      source: 'secret' | 'static';
      value?: string;
    };
  };
}

export interface ServerlessConfig {
  serviceName: string;
  stage: string;
  region: string;
  account: string;
  tags: Record<string, string>;
  appSync: AppSyncConfig;
  dynamoDB: DynamoDBConfig;
  functions: Record<string, LambdaFunctionConfig>;
  secrets: SecretConfig[];
  defaultLambdaConfig?: {
    runtime?: Runtime;
    timeout?: Duration;
    memorySize?: number;
    logRetention?: RetentionDays;
    environment?: Record<string, string>;
    bundling?: {
      minify?: boolean;
      sourceMap?: boolean;
      target?: string;
      externalModules?: string[];
    };
  };
}

export function createServerlessConfig(app: cdk.App): ServerlessConfig {
  const stage = app.node.tryGetContext('stage') || 'dev';
  const region = app.node.tryGetContext('region') || 'us-east-1';
  const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;

  
  if (!account) {
    throw new Error('AWS account ID is required. Set it via CDK context (--context account=123456789012), CDK_DEFAULT_ACCOUNT, or AWS_ACCOUNT_ID environment variable.');
  }

  return {
    serviceName: 'appsync-lambda-svc',
    stage,
    region,
    account,
    tags: {
      Environment: stage,
      Project: 'appsync-lambda',
      ManagedBy: 'CDK'
    },
    appSync: {
      name: `appsync-${stage}`,
      schema: 'lib/appsync/schema.graphql',
      authenticationType: AuthorizationType.API_KEY,
      apiKeyConfig: {
        expires: cdk.Expiration.after(cdk.Duration.days(365))
      },
      logConfig: {
        fieldLogLevel: 'ERROR',
        retention: RetentionDays.ONE_WEEK
      },
      xrayEnabled: false,
      resolvers: [
        { typeName: 'Query', fieldName: 'getItem', dataSource: 'getItem' },
        { typeName: 'Query', fieldName: 'listItems', dataSource: 'listItems' },
        { typeName: 'Mutation', fieldName: 'createItem', dataSource: 'createItem' },
        { typeName: 'Mutation', fieldName: 'updateItem', dataSource: 'updateItem' },
        { typeName: 'Mutation', fieldName: 'deleteItem', dataSource: 'deleteItem' }
      ]
    },
    dynamoDB: {
      tableName: `items-table-${stage}`,
      partitionKey: {
        name: 'id',
        type: 'STRING'
      },
      billingMode: 'PAY_PER_REQUEST',
      removalPolicy: 'DESTROY'
    },
    functions: {
      getItem: {
        name: `get-item-${stage}`,
        handler: 'handler',
        entry: 'app/handlers/getItem.ts',
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 256,
        permissions: [
          {
            actions: ['dynamodb:GetItem'],
            resources: [`arn:aws:dynamodb:${region}:${account}:table/items-table-${stage}`]
          }
        ],
        logRetention: RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node20',
          externalModules: ['@aws-sdk/*']
        }
      },
      listItems: {
        name: `list-items-${stage}`,
        handler: 'handler',
        entry: 'app/handlers/listItems.ts',
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 256,
        permissions: [
          {
            actions: ['dynamodb:Scan'],
            resources: [`arn:aws:dynamodb:${region}:${account}:table/items-table-${stage}`]
          }
        ],
        logRetention: RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node20',
          externalModules: ['@aws-sdk/*']
        }
      },
      createItem: {
        name: `create-item-${stage}`,
        handler: 'handler',
        entry: 'app/handlers/createItem.ts',
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 256,
        permissions: [
          {
            actions: ['dynamodb:PutItem'],
            resources: [`arn:aws:dynamodb:${region}:${account}:table/items-table-${stage}`]
          }
        ],
        logRetention: RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node20',
          externalModules: ['@aws-sdk/*']
        },
      },
      updateItem: {
        name: `update-item-${stage}`,
        handler: 'handler',
        entry: 'app/handlers/updateItem.ts',
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 256,
        permissions: [
          {
            actions: ['dynamodb:UpdateItem'],
            resources: [`arn:aws:dynamodb:${region}:${account}:table/items-table-${stage}`]
          }
        ],
        logRetention: RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node20',
          externalModules: ['@aws-sdk/*']
        }
      },
      deleteItem: {
        name: `delete-item-${stage}`,
        handler: 'handler',
        entry: 'app/handlers/deleteItem.ts',
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 256,
        permissions: [
          {
            actions: ['dynamodb:DeleteItem'],
            resources: [`arn:aws:dynamodb:${region}:${account}:table/items-table-${stage}`]
          }
        ],
        logRetention: RetentionDays.ONE_WEEK,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node20',
          externalModules: ['@aws-sdk/*']
        }
      }
    },
    secrets: [
      {
        name: `${stage}/appsync`,
        description: 'AppSync and Lambda environment variables',
        variables: {
          STAGE: { source: 'static', value: stage },
          REGION: { source: 'static', value: region },
          API_KEY: { source: 'secret' },
          DATABASE_URL: { source: 'secret' }
        }
      }
    ],
    defaultLambdaConfig: {
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      logRetention: RetentionDays.ONE_WEEK,
      environment: {
        STAGE: stage,
        REGION: region
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node20',
        externalModules: ['@aws-sdk/*']
      }
    }
  };
} 