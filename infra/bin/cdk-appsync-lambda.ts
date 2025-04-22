#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerlessStack } from '../lib/serverless-stack';
import { createServerlessConfig } from '../lib/serverless-config';
import { SecretsManager } from 'aws-sdk';
import * as path from 'path';

async function validateSecrets(config: ReturnType<typeof createServerlessConfig>) {
  const secretsManager = new SecretsManager({region: 'us-east-1'});
  
  for (const secret of config.secrets) {
    try {
      const response = await secretsManager.getSecretValue({ SecretId: secret.name }).promise();
      const secretString = response.SecretString;
      
      if (!secretString) {
        throw new Error(`Secret ${secret.name} has no SecretString`);
      }
      
      const secretJson = JSON.parse(secretString);
      for (const [envVar, config] of Object.entries(secret.variables)) {
        if (config.source === 'secret') {
          if (!(envVar in secretJson)) {
            throw new Error(`Key ${envVar} not found in secret ${secret.name}`);
          }
          console.log(`Validated secret ${secret.name} has key ${envVar}`);
        }
      }
    } catch (error) {
      console.log({error});
      
      if (error instanceof Error) {
        throw new Error(`Secret validation failed for ${secret.name}: ${error.message}`);
      }
      throw error;
    }
  }
}

async function main() {
  const app = new cdk.App();

  // Set the root path in the context
  app.node.setContext('rootPath', path.resolve(__dirname, '../..'));

  // Create the serverless configuration
  const config = createServerlessConfig(app);

  // Validate secrets before creating the stack
  try {
    await validateSecrets(config);
  } catch (error) {
    console.error('Secret validation failed:', error);
    process.exit(1);
  }

  // Create the serverless stack
  new ServerlessStack(app, 'ServerlessStack', {
    config,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || config.region,
    },
  });

  app.synth();
}

main().catch(error => {
  console.error('Failed to deploy:', error);
  process.exit(1);
}); 