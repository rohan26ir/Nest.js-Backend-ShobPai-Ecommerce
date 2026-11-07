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
  @IsOptional()
  DATABASE_URL?: string;

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
  try {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join('; ');
      console.warn(`[Config Validation Notice]: ${errorMessages}`);
    }

    return validatedConfig;
  } catch (err: any) {
    console.warn(`[Config Validation Notice]: ${err?.message || err}`);
    return config as any;
  }
}
