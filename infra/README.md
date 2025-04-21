# AppSync Lambda CDK Project

This project sets up an AppSync API with Lambda resolvers and a DynamoDB table.

## Prerequisites

- Node.js 20.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally

## First Time Setup

1. Install AWS CDK globally:
```bash
npm install -g aws-cdk
```

2. Install project dependencies:
```bash
npm install
```

3. Bootstrap your AWS environment (only needed once per account/region):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

4. Deploy the stack:
```bash
# For development environment
npm run cdk deploy

# For production environment
npm run cdk deploy -- -c stage=prod
```

## Stack Information

The stack creates the following resources:
- AppSync API with GraphQL schema
- Lambda functions for resolvers
- DynamoDB table for data storage
- IAM roles and permissions

## Stack Outputs

After deployment, the following outputs will be available:
- GraphQL API URL
- GraphQL API Key
- DynamoDB Table Name

## Development

To make changes to the stack:
1. Modify the code
2. Run `npm run build` to compile TypeScript
3. Run `npm run cdk deploy` to deploy changes

## Cleanup

To delete all resources:
```bash
npm run cdk destroy
```
