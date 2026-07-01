import "reflect-metadata";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/errors/http-exception.filter";
import { RequestIdMiddleware } from "./common/logging/request-id.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: webOrigin, credentials: true });
  app.use(new RequestIdMiddleware().use);
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Multi-Tenant SaaS Starter API")
    .setDescription("Secure multi-tenant SaaS reference API")
    .setVersion("0.1.0")
    .addCookieAuth("sid")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
