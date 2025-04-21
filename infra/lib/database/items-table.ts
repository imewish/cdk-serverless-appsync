import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { ServiceConfig } from '../config';

export interface ItemsTableProps {
  tableName: string;
}

export class ItemsTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ItemsTableProps) {
    super(scope, id);

    // Create DynamoDB table
    this.table = new dynamodb.Table(this, 'Table', {
      tableName: props.tableName,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Output the table name
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
    });
  }
} 