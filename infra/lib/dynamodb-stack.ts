import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DynamoDBStackProps extends cdk.StackProps {
  stage: string;
  tableName: string;
  partitionKey: {
    name: string;
    type: dynamodb.AttributeType;
  };
  sortKey?: {
    name: string;
    type: dynamodb.AttributeType;
  };
  billingMode?: dynamodb.BillingMode;
  readCapacity?: number;
  writeCapacity?: number;
  removalPolicy?: string;
  tags?: Record<string, string>;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    // Apply tags to all resources
    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this).add(key, value);
      });
    }

    // Create DynamoDB table
    this.table = new dynamodb.Table(this, 'ItemsTable', {
      tableName: props.tableName,
      partitionKey: {
        name: props.partitionKey.name,
        type: props.partitionKey.type,
      },
      sortKey: props.sortKey ? {
        name: props.sortKey.name,
        type: props.sortKey.type,
      } : undefined,
      billingMode: props.billingMode || dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      removalPolicy: props.removalPolicy === 'DESTROY' 
        ? cdk.RemovalPolicy.DESTROY 
        : cdk.RemovalPolicy.RETAIN,
    });
  }
} 