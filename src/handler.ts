import { configure } from "@codegenie/serverless-express";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { createApp } from "./app.js";

type ApiGatewayHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

let serverlessExpressInstance: ApiGatewayHandler;

const setup: ApiGatewayHandler = async (event, context) => {
  const app = await createApp();
  serverlessExpressInstance = configure({
    app,
  }) as unknown as ApiGatewayHandler;
  return serverlessExpressInstance(event, context);
};

export const handler: ApiGatewayHandler = (event, context) => {
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  return setup(event, context);
};
