#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';
import { createConfig } from '../lib/config';

const app = new cdk.App();
const config = createConfig(app);

new MainStack(app, 'AppSyncLambdaStack', {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});