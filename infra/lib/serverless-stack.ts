import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { ServerlessConfig, IAMPermission } from './serverless-config';
import * as path from 'path';
import { SecretsManager } from 'aws-sdk';

export interface ServerlessStackProps extends cdk.StackProps {
  config: ServerlessConfig;
}

export class ServerlessStack extends cdk.Stack {
  private readonly lambdaFunctions: Record<string, lambda.Function> = {};
  private readonly config: ServerlessConfig;

  constructor(scope: Construct, id: string, props: ServerlessStackProps) {
    super(scope, id, props);
    this.config = props.config;

    // Apply tags to all resources
    Object.entries(props.config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create DynamoDB table
    const table = this.createDynamoDBTable(props.config.dynamoDB);

    // Create Lambda functions
    this.createLambdaFunctions(props.config.functions, props.config.defaultLambdaConfig);

    // Create AppSync API
    const api = this.createAppSyncApi(props.config.appSync);

    // Grant permissions
    this.grantPermissions();
  }

  private getResourceName(resource: string): string {
    return `${this.config.serviceName}-${this.config.stage}-${resource}`;
  }

  private createDynamoDBTable(config: ServerlessConfig['dynamoDB']): dynamodb.Table {
    return new dynamodb.Table(this, 'ItemsTable', {
      tableName: this.getResourceName(config.tableName),
      partitionKey: {
        name: config.partitionKey.name,
        type: dynamodb.AttributeType[config.partitionKey.type],
      },
      sortKey: config.sortKey ? {
        name: config.sortKey.name,
        type: dynamodb.AttributeType[config.sortKey.type],
      } : undefined,
      billingMode: dynamodb.BillingMode[config.billingMode || 'PAY_PER_REQUEST'],
      readCapacity: config.readCapacity,
      writeCapacity: config.writeCapacity,
      removalPolicy: config.removalPolicy === 'DESTROY' ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
    });
  }

  private async getSecretValue(secretName: string, key: string): Promise<string> {
    const secretsManager = new SecretsManager();
    const response = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    const secretString = response.SecretString;
    if (!secretString) {
      throw new Error(`Secret ${secretName} has no SecretString`);
    }
    const secretJson = JSON.parse(secretString);
    if (!(key in secretJson)) {
      throw new Error(`Key ${key} not found in secret ${secretName}`);
    }
    return secretJson[key];
  }

  private createLambdaFunctions(
    functions: ServerlessConfig['functions'],
    defaultConfig?: ServerlessConfig['defaultLambdaConfig']
  ): void {
    // Cache for secret objects
    const secretCache: Record<string, secretsmanager.ISecret> = {};

    Object.entries(functions).forEach(([key, config]) => {
      // Merge default config with function-specific config
      const functionConfig = {
        ...defaultConfig,
        ...config,
        environment: {
          ...defaultConfig?.environment,
          ...config.environment,
        },
        bundling: {
          ...defaultConfig?.bundling,
          ...config.bundling,
        },
      };

      // Create environment variables map
      const environment: Record<string, string> = {
        ...functionConfig.environment,
      };

      // Add secret references to environment variables
      for (const secret of this.config.secrets) {
        // Get or create secret object
        const secretObj = secretCache[secret.name] || secretsmanager.Secret.fromSecretNameV2(
          this,
          `Secret-${secret.name}`,
          secret.name
        );
        secretCache[secret.name] = secretObj;
        
        // Add each environment variable from the secret
        for (const [envVar, config] of Object.entries(secret.variables)) {
          if (config.source === 'secret') {
            environment[envVar] = secretObj.secretValueFromJson(envVar).unsafeUnwrap();
          } else if (config.source === 'static' && config.value) {
            environment[envVar] = config.value;
          }
        }
      }

      this.lambdaFunctions[key] = new nodejs.NodejsFunction(this, `${key}Function`, {
        functionName: this.getResourceName(config.name),
        runtime: functionConfig.runtime || lambda.Runtime.NODEJS_20_X,
        handler: config.handler,
        entry: path.join(this.node.tryGetContext('rootPath') || '.', config.entry),
        timeout: functionConfig.timeout || cdk.Duration.seconds(30),
        memorySize: functionConfig.memorySize || 256,
        environment,
        logRetention: functionConfig.logRetention,
        bundling: {
          ...functionConfig.bundling,
          sourceMap: true,
          minify: true,
          target: 'node20',
          externalModules: ['@aws-sdk/*']
        },
      });

      // Grant permissions after function creation
      for (const secret of this.config.secrets) {
        const secretObj = secretCache[secret.name];
        secretObj.grantRead(this.lambdaFunctions[key].role as iam.IRole);
      }
    });
  }

  private createAppSyncApi(config: ServerlessConfig['appSync']): appsync.GraphqlApi {
    const api = new appsync.GraphqlApi(this, 'AppSyncApi', {
      name: this.getResourceName(config.name),
      definition: appsync.Definition.fromFile(config.schema),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: config.authenticationType,
          apiKeyConfig: config.apiKeyConfig,
        },
      },
      logConfig: config.logConfig ? {
        fieldLogLevel: appsync.FieldLogLevel[config.logConfig.fieldLogLevel],
        retention: config.logConfig.retention,
      } : undefined,
      xrayEnabled: config.xrayEnabled,
    });

    // Create data sources and resolvers
    config.resolvers?.forEach(resolver => {
      const dataSource = api.addLambdaDataSource(
        `${resolver.dataSource}DataSource`,
        this.lambdaFunctions[resolver.dataSource]
      );

      dataSource.createResolver(`${resolver.fieldName}Resolver`, {
        typeName: resolver.typeName,
        fieldName: resolver.fieldName,
      });
    });

    // Output the API URL and API Key
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || '',
    });

    return api;
  }

  private grantPermissions(): void {
    Object.entries(this.lambdaFunctions).forEach(([key, func]) => {
      const config = this.config.functions[key];
      const permissions = config.permissions as IAMPermission[] | undefined;
      
      // Add custom permissions from config
      if (permissions?.length) {
        permissions.forEach(permission => {
          func.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: permission.actions,
            resources: permission.resources,
          }));
        });
      }

      // Add secret access permissions
      this.config.secrets.forEach(secret => {
        func.addToRolePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['secretsmanager:GetSecretValue'],
          resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:${secret.name}*`],
        }));
      });
    });
  }
} 