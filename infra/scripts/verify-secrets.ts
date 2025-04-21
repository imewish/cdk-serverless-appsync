import * as AWS from 'aws-sdk';
import { createConfig } from '../lib/config';
import { requiredEnvVars } from '../lib/environment';
import * as cdk from 'aws-cdk-lib';

const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';
const secretsManager = new AWS.SecretsManager({ region });

async function verifySecrets() {
  const app = new cdk.App();
  const config = createConfig(app);

  const missingVars: string[] = [];

  try {
    const secret = await secretsManager.getSecretValue({ SecretId: config.secretName }).promise();
    const secretValues = JSON.parse(secret.SecretString || '{}');

    for (const envVar of requiredEnvVars) {
      if (!envVar.localOverride && !secretValues[envVar.name]) {
        missingVars.push(envVar.name);
      }
    }

    if (missingVars.length > 0) {
      console.error(
        `Missing required environment variables in secret ${config.secretName}: ${missingVars.join(', ')}\n` +
        'Please add these variables to the secret before deployment.'
      );
      process.exit(1);
    }

    console.log('All required environment variables are present in the secret');
    process.exit(0);
  } catch (error) {
    if ((error as AWS.AWSError).code === 'ResourceNotFoundException') {
      console.error(
        `Secret ${config.secretName} not found in Secrets Manager\n` +
        'Please create the secret before deployment.'
      );
    } else {
      console.error('Error checking secret:', error);
    }
    process.exit(1);
  }
}

verifySecrets(); 