import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // API Configuration
  NEXT_PUBLIC_API_BASE_URL: z.string().url('NEXT_PUBLIC_API_BASE_URL must be a valid URL'),
  
  // Development flags
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API Mocking
  NEXT_PUBLIC_API_MOCKING: z.enum(['enabled', 'disabled']).default('disabled'),
  
  // Application Configuration
  NEXT_PUBLIC_APP_NAME: z.string().default('iCMS'),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default('Integrated Content Management System'),
  
  // Optional development settings
  NEXT_PUBLIC_DEBUG: z.enum(['true', 'false']).default('false').optional(),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info').optional(),
  
  // Backblaze B2 Configuration (for backend use - these are server-side only)
  BACKBLAZE_APPLICATION_KEY_ID: z.string().optional(),
  BACKBLAZE_APPLICATION_KEY: z.string().optional(),
  BACKBLAZE_BUCKET_NAME: z.string().optional(),
  BACKBLAZE_BUCKET_ID: z.string().optional(),
  BACKBLAZE_ENDPOINT: z.string().url().optional(),
  BACKBLAZE_REGION: z.string().optional(),
  BACKBLAZE_CUSTOM_DOMAIN: z.string().optional(),
  BACKBLAZE_URL_EXPIRATION: z.string().transform(val => parseInt(val, 10)).optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

class EnvironmentError extends Error {
  public missingVars: string[];
  
  constructor(message: string, missingVars: string[]) {
    super(message);
    this.name = 'EnvironmentError';
    this.missingVars = missingVars;
  }
}

function validateEnvironment(): EnvConfig {
  // Safe environment variable access with proper client/server handling
  const getEnvVar = (key: string, fallback?: string) => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback;
    }
    return fallback;
  };

  const env = {
    NEXT_PUBLIC_API_BASE_URL: getEnvVar('NEXT_PUBLIC_API_BASE_URL'),
    // NODE_ENV fallback for client-side - use production as safe default
    NODE_ENV: getEnvVar('NODE_ENV', 'production'),
    NEXT_PUBLIC_API_MOCKING: getEnvVar('NEXT_PUBLIC_API_MOCKING'),
    NEXT_PUBLIC_APP_NAME: getEnvVar('NEXT_PUBLIC_APP_NAME'),
    NEXT_PUBLIC_APP_DESCRIPTION: getEnvVar('NEXT_PUBLIC_APP_DESCRIPTION'),
    NEXT_PUBLIC_DEBUG: getEnvVar('NEXT_PUBLIC_DEBUG'),
    NEXT_PUBLIC_LOG_LEVEL: getEnvVar('NEXT_PUBLIC_LOG_LEVEL'),
    // Server-side only variables
    BACKBLAZE_APPLICATION_KEY_ID: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_APPLICATION_KEY_ID') : undefined,
    BACKBLAZE_APPLICATION_KEY: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_APPLICATION_KEY') : undefined,
    BACKBLAZE_BUCKET_NAME: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_BUCKET_NAME') : undefined,
    BACKBLAZE_BUCKET_ID: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_BUCKET_ID') : undefined,
    BACKBLAZE_ENDPOINT: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_ENDPOINT') : undefined,
    BACKBLAZE_REGION: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_REGION') : undefined,
    BACKBLAZE_CUSTOM_DOMAIN: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_CUSTOM_DOMAIN') : undefined,
    BACKBLAZE_URL_EXPIRATION: typeof window === 'undefined' ? getEnvVar('BACKBLAZE_URL_EXPIRATION') : undefined,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars: string[] = [];
      const errorMessages: string[] = [];

      error.issues.forEach((err) => {
        const path = err.path.join('.');
        missingVars.push(path);
        errorMessages.push(`❌ ${path}: ${err.message}`);
      });

      const message = `
🚫 Environment Configuration Error!

The following environment variables are missing or invalid:
${errorMessages.join('\n')}

Please create a .env.local file in your project root with the following variables:

📝 Required Variables:
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_MOCKING=enabled

📝 Optional Variables:
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=iCMS
NEXT_PUBLIC_APP_DESCRIPTION=Integrated Content Management System
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_LOG_LEVEL=info

Example .env.local file:
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Development Settings
NEXT_PUBLIC_API_MOCKING=enabled
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug

# Application Configuration
NEXT_PUBLIC_APP_NAME=iCMS
NEXT_PUBLIC_APP_DESCRIPTION=Integrated Content Management System

🔧 After creating the .env.local file, restart your development server.
      `;

      throw new EnvironmentError(message, missingVars);
    }
    throw error;
  }
}

// Validate environment variables at module load
let envConfig: EnvConfig;

try {
  envConfig = validateEnvironment();
} catch (error) {
  if (error instanceof EnvironmentError) {
    // Use safe defaults in all environments to prevent crashes
    console.warn('Environment validation failed, using safe defaults');
    if (typeof window !== 'undefined') {
      console.error(error.message);
    }
    
    envConfig = {
      NEXT_PUBLIC_API_BASE_URL: 'http://192.168.1.65:4000/api/v1',
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_MOCKING: 'disabled',
      NEXT_PUBLIC_APP_NAME: 'iCMS',
      NEXT_PUBLIC_APP_DESCRIPTION: 'Integrated Content Management System',
      NEXT_PUBLIC_DEBUG: 'false',
      NEXT_PUBLIC_LOG_LEVEL: 'info',
    };
  } else {
    // Fallback for any other errors - prevent app crashes
    console.warn('Unknown environment error, using minimal defaults');
    envConfig = {
      NEXT_PUBLIC_API_BASE_URL: 'http://192.168.1.65:4000/api/v1',
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_MOCKING: 'disabled',
      NEXT_PUBLIC_APP_NAME: 'iCMS',
      NEXT_PUBLIC_APP_DESCRIPTION: 'Integrated Content Management System',
      NEXT_PUBLIC_DEBUG: 'false',
      NEXT_PUBLIC_LOG_LEVEL: 'info',
    };
  }
}

// Export validated environment config  
export const env = envConfig!;

// Helper functions
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';
export const isApiMockingEnabled = () => env.NEXT_PUBLIC_API_MOCKING === 'enabled';
export const isDebugEnabled = () => env.NEXT_PUBLIC_DEBUG === 'true';

// Environment info for debugging
export const getEnvironmentInfo = () => ({
  nodeEnv: env.NODE_ENV,
  apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  apiMocking: env.NEXT_PUBLIC_API_MOCKING,
  appName: env.NEXT_PUBLIC_APP_NAME,
  debug: env.NEXT_PUBLIC_DEBUG,
  logLevel: env.NEXT_PUBLIC_LOG_LEVEL,
});

// Backblaze B2 Configuration helpers
// Note: These functions only work on the server side since Backblaze variables are not public
export const getBackblazeConfig = () => {
  // Only return config on server side
  if (typeof window === 'undefined') {
    return {
      applicationKeyId: env.BACKBLAZE_APPLICATION_KEY_ID,
      applicationKey: env.BACKBLAZE_APPLICATION_KEY,
      bucketName: env.BACKBLAZE_BUCKET_NAME,
      bucketId: env.BACKBLAZE_BUCKET_ID,
      endpoint: env.BACKBLAZE_ENDPOINT,
      region: env.BACKBLAZE_REGION,
      customDomain: env.BACKBLAZE_CUSTOM_DOMAIN,
      urlExpiration: env.BACKBLAZE_URL_EXPIRATION,
    };
  }
  
  // Return empty config on client side
  return {
    applicationKeyId: undefined,
    applicationKey: undefined,
    bucketName: undefined,
    bucketId: undefined,
    endpoint: undefined,
    region: undefined,
    customDomain: undefined,
    urlExpiration: 3600,
  };
};

export const isBackblazeConfigured = () => {
  // Only check on server side
  if (typeof window === 'undefined') {
    const config = getBackblazeConfig();
    return !!(config.applicationKeyId && config.applicationKey && config.bucketName);
  }
  
  // Always return false on client side
  return false;
};

// Ensure environment is properly initialized
if (!envConfig) {
  console.error('Environment configuration failed to initialize, using emergency defaults');
  envConfig = {
    NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000/api/v1',
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_MOCKING: 'disabled',
    NEXT_PUBLIC_APP_NAME: 'iCMS',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Integrated Content Management System',
    NEXT_PUBLIC_DEBUG: 'false',
    NEXT_PUBLIC_LOG_LEVEL: 'info',
  };
}

// Development warning
if (isDevelopment() && typeof window !== 'undefined') {
  console.log('🚀 iCMS Development Environment Loaded');
  console.log('📋 Environment Config:', getEnvironmentInfo());
  
  if (isApiMockingEnabled()) {
    console.log('🎭 API Mocking is ENABLED');
  } else {
    console.log('🌐 Using real API:', env.NEXT_PUBLIC_API_BASE_URL);
  }
} 