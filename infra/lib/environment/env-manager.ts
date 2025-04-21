import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { ServiceConfig } from '../config';
import { EnvVarConfig, requiredEnvVars } from '.';

export interface EnvProps {
  config: ServiceConfig;
  scope: Construct;
  stage: string;
}

export class EnvironmentManager {
  private readonly config: ServiceConfig;
  private readonly scope: Construct;
  private readonly stage: string;
  private readonly environment: { [key: string]: string } = {};
  private secret: secretsmanager.ISecret | undefined;

  constructor(props: EnvProps) {
    this.config = props.config;
    this.scope = props.scope;
    this.stage = props.stage;

    // Initialize with required variables
    this.initializeRequiredVariables();
  }

  private getSecret(): secretsmanager.ISecret {
    if (!this.secret) {
      this.secret = secretsmanager.Secret.fromSecretNameV2(
        this.scope,
        'AppSecret',
        this.config.secretName
      );
    }
    return this.secret;
  }

  private initializeRequiredVariables(): void {
    const secret = this.getSecret();

    for (const envVar of requiredEnvVars) {
      // Set the environment variable to reference the secret value
      this.environment[envVar.name] = secret.secretValueFromJson(envVar.name).unsafeUnwrap();
    }
  }

  /**
   * Get the environment configuration for Lambda functions
   */
  public getEnvironment(): { [key: string]: string } {
    return { ...this.environment };
  }

  /**
   * Grant read access to secrets for a Lambda function
   */
  public grantSecretAccess(lambdaFunction: cdk.aws_lambda.IFunction): void {
    const secret = this.getSecret();
    secret.grantRead(lambdaFunction);
  }
} 