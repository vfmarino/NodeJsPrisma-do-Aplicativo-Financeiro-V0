import Koa from "koa";
import jwt from "koa-jwt";
import bodyParser from "koa-body";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import winston from "winston";
import "reflect-metadata";
import { logger } from "./logger";
import { config } from "./config";
import { unprotectedRouter } from "./unprotectedRoutes";
import { protectedRouter } from "./protectedRoutes";
import { getCryptoPrices } from "./controller/cryptoPrice"; // importando a função getCryptoPrices

const app = new Koa();

// Provides important security headers to make your app more secure
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc:["'self'"],
    scriptSrc:["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
    styleSrc:["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
    fontSrc:["'self'","fonts.gstatic.com"],
    imgSrc:["'self'", "data:", "online.swagger.io", "validator.swagger.io"]
  }
}));

// Enable cors with default options(Habilita o CORS para permitir que os recursos da API sejam acessados a partir de diferentes origens.)
app.use(cors());

// Logger middleware -> use winston as logger (logging.ts with config)
app.use(logger(winston));

// Enable bodyParser with default options ( faz requisições em JSON)
app.use(bodyParser());

// these routes are NOT protected by the JWT middleware, also include middleware to respond with "Method Not Allowed - 405".
app.use(unprotectedRouter.routes());
app.use(unprotectedRouter.allowedMethods());

// JWT middleware -> below this line routes are only reached if JWT token is valid, secret as env variable
app.use(jwt({ secret: config.jwtSecret }));

// Adiciona a rota protegida que executa a função getCryptoPrices a cada requisição do cliente
protectedRouter.get("/crypto-prices", async (ctx) => {
  await getCryptoPrices();
  ctx.body = "Cryptomoedas atualizadas com sucesso!";
});

app.use(protectedRouter.routes());
app.use(protectedRouter.allowedMethods());

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

