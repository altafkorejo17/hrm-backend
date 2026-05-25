import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const env = config.get<string>('app.env');

  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors();

  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HRM API')
      .setDescription('Human Resource Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application running on: ${await app.getUrl()}`);
  if (env !== 'production') {
    logger.log(`Swagger docs: ${await app.getUrl()}/api/docs`);
  }
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Error starting application', err);
  process.exit(1);
});
