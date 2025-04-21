import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

export interface ServiceConfig {
  serviceName: string;
  stage: string;
  secretName: string;
  rootPath: string;
}

interface ResourceConfig {
  serviceName: string;
  stage: string;
}

export function getResourceName(config: ResourceConfig, resource: string): string {
  return `${config.serviceName}-${config.stage}-${resource}`;
}

export function createConfig(app: cdk.App): ServiceConfig {
  const stage = app.node.tryGetContext('stage') || 'dev';
  const rootPath = path.resolve(__dirname, '../');
  return {
    serviceName: 'appsync-lambda',
    stage,
    secretName: 'dev/appsync',
    rootPath
  };
} 