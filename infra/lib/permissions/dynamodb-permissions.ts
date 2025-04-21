import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class DynamoDBPermissions extends Construct {
  constructor(scope: Construct, id: string, props: { 
    table: dynamodb.Table;
    lambdaFunctions: LambdaFunctions;
  }) {
    super(scope, id);

    // Grant Lambda functions access to DynamoDB table
    props.table.grantReadWriteData(props.lambdaFunctions.getItemFunction);
    props.table.grantReadWriteData(props.lambdaFunctions.listItemsFunction);
    props.table.grantReadWriteData(props.lambdaFunctions.createItemFunction);
    props.table.grantReadWriteData(props.lambdaFunctions.updateItemFunction);
    props.table.grantReadWriteData(props.lambdaFunctions.deleteItemFunction);
  }
}

interface LambdaFunctions {
  getItemFunction: lambda.Function;
  listItemsFunction: lambda.Function;
  createItemFunction: lambda.Function;
  updateItemFunction: lambda.Function;
  deleteItemFunction: lambda.Function;
} 