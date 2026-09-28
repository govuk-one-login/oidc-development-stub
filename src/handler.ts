import { configure } from "@codegenie/serverless-express";
import {
  APIGatewayProxyEvent,
  Handler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { createApp } from "./app.js";

type ApiGatewayHandler = Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult | void
>;

let serverlessExpressInstance: ApiGatewayHandler;

const setup: ApiGatewayHandler = async (event, context, callback) => {
  const app = await createApp();
  serverlessExpressInstance = configure<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  >({ app });
  return serverlessExpressInstance(event, context, callback);
};

export const handler: ApiGatewayHandler = (event, context, callback) => {
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context, callback);
  }
  return setup(event, context, callback);
};
