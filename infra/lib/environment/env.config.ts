export interface EnvVarConfig {
  name: string;
  description: string;
  required: boolean;
  localOverride?: boolean; // If true, can be overridden by .env file
}

export const requiredEnvVars: EnvVarConfig[] = [
  {
    name: 'API_KEY',
    description: 'API key for external service',
    required: true,
    localOverride: false,
  },
  // {
  //   name: 'DATABASE_URL',
  //   description: 'Database connection string',
  //   required: true,
  //   localOverride: false,
  // },
  // {
  //   name: 'LOG_LEVEL',
  //   description: 'Application log level',
  //   required: true,
  //   localOverride: false,
  // },
  // Add more required environment variables here
]; 