import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { ServiceConfig, getResourceName } from '../config';
import { EnvironmentManager } from '../environment/env-manager';
import * as path from 'path';

export interface LambdaFunctionsProps {
  config: ServiceConfig;
  stage: string;
  rootPath: string;
}

export class LambdaFunctions extends Construct {
  public readonly getItemFunction: lambda.Function;
  public readonly listItemsFunction: lambda.Function;
  public readonly createItemFunction: lambda.Function;
  public readonly updateItemFunction: lambda.Function;
  public readonly deleteItemFunction: lambda.Function;
  private readonly envManager: EnvironmentManager;

  constructor(scope: Construct, id: string, props: LambdaFunctionsProps) {
    super(scope, id);

    // Initialize environment manager
    this.envManager = new EnvironmentManager({
      config: props.config,
      scope: this,
      stage: props.stage,
    });


    const commonProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: this.envManager.getEnvironment(),
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node20',
        externalModules: ['@aws-sdk/*'],
      },
    };

    this.getItemFunction = new nodejs.NodejsFunction(this, 'GetItemFunction', {
      ...commonProps,
      functionName: getResourceName(props.config, 'get-item'),
      entry: path.join(props.rootPath, '../app/handlers/getItem.ts'),
      handler: 'handler',
    });

    this.listItemsFunction = new nodejs.NodejsFunction(this, 'ListItemsFunction', {
      ...commonProps,
      functionName: getResourceName(props.config, 'list-items'),
      entry: path.join(props.rootPath, '../app/handlers/listItems.ts'),
      handler: 'handler',
    });

    this.createItemFunction = new nodejs.NodejsFunction(this, 'CreateItemFunction', {
      ...commonProps,
      functionName: getResourceName(props.config, 'create-item'),
      entry: path.join(props.rootPath, '../app/handlers/createItem.ts'),
      handler: 'handler',
    });

    this.updateItemFunction = new nodejs.NodejsFunction(this, 'UpdateItemFunction', {
      ...commonProps,
      functionName: getResourceName(props.config, 'update-item'),
      entry: path.join(props.rootPath, '../app/handlers/updateItem.ts'),
      handler: 'handler',
    });

    this.deleteItemFunction = new nodejs.NodejsFunction(this, 'DeleteItemFunction', {
      ...commonProps,
      functionName: getResourceName(props.config, 'delete-item'),
      entry: path.join(props.rootPath, '../app/handlers/deleteItem.ts'),
      handler: 'handler',
    });

    // Grant secret access to all functions
    this.grantSecretAccessToAllFunctions();
  }

  /**
   * Get all Lambda functions in this class
   */
  private getAllLambdaFunctions(): lambda.Function[] {
    const functions: lambda.Function[] = [];
    
    // Get all properties of this class
    const properties = Object.getOwnPropertyNames(this);
    
    // Filter for function properties that end with 'Function'
    for (const prop of properties) {
      const value = (this as any)[prop];
      if (prop.endsWith('Function') && value instanceof lambda.Function) {
        functions.push(value);
      }
    }
    
    return functions;
  }

  /**
   * Grant secret access to all Lambda functions
   */
  private grantSecretAccessToAllFunctions(): void {
    const functions = this.getAllLambdaFunctions();
    functions.forEach(func => this.envManager.grantSecretAccess(func));
  }
} 