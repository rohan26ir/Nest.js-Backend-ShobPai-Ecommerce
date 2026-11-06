import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 5000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  DIRECT_URL?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  ADMIN_EMAILS?: string = 'rohan26ir@gmail.com,admin@shobpai.com';

  @IsString()
  @IsOptional()
  FIREBASE_PROJECT_ID?: string = 'shonpai-ecommerce';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => Object.values(e.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`[Config Validation Error]: ${errorMessages}`);
  }

  return validatedConfig;
}

