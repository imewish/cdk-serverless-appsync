import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ServiceConfig, getResourceName } from '../config';

export interface AppSyncApiProps {
  lambdaFunctions: LambdaFunctions;
  config: ServiceConfig;
}

export class AppSyncApi extends Construct {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    // Create the AppSync API
    this.api = new appsync.GraphqlApi(this, 'Api', {
      name: getResourceName(props.config, 'api'),
      definition: appsync.Definition.fromFile('lib/appsync/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        },
      },
      xrayEnabled: true,
    });

    // Create data sources for each Lambda function
    const getItemDataSource = this.api.addLambdaDataSource('GetItemDataSource', props.lambdaFunctions.getItemFunction);
    const listItemsDataSource = this.api.addLambdaDataSource('ListItemsDataSource', props.lambdaFunctions.listItemsFunction);
    const createItemDataSource = this.api.addLambdaDataSource('CreateItemDataSource', props.lambdaFunctions.createItemFunction);
    const updateItemDataSource = this.api.addLambdaDataSource('UpdateItemDataSource', props.lambdaFunctions.updateItemFunction);
    const deleteItemDataSource = this.api.addLambdaDataSource('DeleteItemDataSource', props.lambdaFunctions.deleteItemFunction);

    // Create resolvers for each operation
    getItemDataSource.createResolver('GetItemResolver', {
      typeName: 'Query',
      fieldName: 'getItem',
    });

    listItemsDataSource.createResolver('ListItemsResolver', {
      typeName: 'Query',
      fieldName: 'listItems',
    });

    createItemDataSource.createResolver('CreateItemResolver', {
      typeName: 'Mutation',
      fieldName: 'createItem',
    });

    updateItemDataSource.createResolver('UpdateItemResolver', {
      typeName: 'Mutation',
      fieldName: 'updateItem',
    });

    deleteItemDataSource.createResolver('DeleteItemResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteItem',
    });

    // Output the API URL and API Key
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: this.api.graphqlUrl
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: this.api.apiKey || ''
    });
  }
}

interface LambdaFunctions {
  getItemFunction: lambda.Function;
  listItemsFunction: lambda.Function;
  createItemFunction: lambda.Function;
  updateItemFunction: lambda.Function;
  deleteItemFunction: lambda.Function;
} 