import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { AdapterConstructor } from "oidc-provider";

const ddbClient = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.FLOCI_ENDPOINT && {
    endpoint: process.env.FLOCI_ENDPOINT,
  }),
});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export function createDynamoDbAdapter(): AdapterConstructor {
  const tableName = `${process.env.ENVIRONMENT || "local"}-oidc-stub-data`;

  return class DynamoDbAdapter {
    name: string;

    constructor(name: string) {
      this.name = name;
    }

    async upsert(
      id: string,
      payload: Record<string, string>,
      expiresIn?: number
    ): Promise<void> {
      const expiresAt = expiresIn
        ? Math.floor(Date.now() / 1000) + expiresIn
        : undefined;

      const item: Record<string, unknown> = {
        pk: this.key(id),
        payload,
        ...(expiresAt && { ttl: expiresAt }),
        ...(payload.userCode && { userCode: payload.userCode }),
        ...(payload.uid && { uid: payload.uid }),
        ...(payload.grantId && { grantId: payload.grantId }),
      };

      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
    }

    async find(id: string): Promise<Record<string, string> | undefined> {
      const result = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { pk: this.key(id) },
        })
      );

      if (!result.Item || this.isExpired(result.Item.ttl)) {
        return undefined;
      }

      return result.Item.payload;
    }

    async findByUserCode(
      userCode: string
    ): Promise<Record<string, string> | undefined> {
      const result = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "userCode-index",
          KeyConditionExpression: "userCode = :userCode",
          ExpressionAttributeValues: { ":userCode": userCode },
          Limit: 1,
        })
      );

      const item = result.Items?.[0];
      if (!item || this.isExpired(item.ttl)) {
        return undefined;
      }

      return item.payload;
    }

    async findByUid(uid: string): Promise<Record<string, string> | undefined> {
      const result = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "uid-index",
          KeyConditionExpression: "uid = :uid",
          ExpressionAttributeValues: { ":uid": uid },
          Limit: 1,
        })
      );

      const item = result.Items?.[0];
      if (!item || this.isExpired(item.ttl)) {
        return undefined;
      }

      return item.payload;
    }

    async consume(id: string): Promise<void> {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: this.key(id) },
          UpdateExpression: "SET payload.consumed = :consumed",
          ExpressionAttributeValues: {
            ":consumed": Math.floor(Date.now() / 1000),
          },
        })
      );
    }
    async destroy(id: string): Promise<void> {
      await docClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { pk: this.key(id) },
        })
      );
    }

    async revokeByGrantId(grantId: string): Promise<void> {
      let ExclusiveStartKey: Record<string, string> | undefined = undefined;

      do {
        const result: QueryCommandOutput = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: "grantId-index",
            KeyConditionExpression: "grantId = :grantId",
            ExpressionAttributeValues: { ":grantId": grantId },
            ExclusiveStartKey,
          })
        );

        ExclusiveStartKey = result.LastEvaluatedKey;
        const items = result.Items || [];

        if (items.length === 0) continue;

        for (let i = 0; i < items.length; i += 25) {
          const batch = items.slice(i, i + 25);
          await docClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [tableName]: batch.map((item) => ({
                  DeleteRequest: { Key: { pk: item.pk } },
                })),
              },
            })
          );
        }
      } while (ExclusiveStartKey);
    }

    private key(id: string): string {
      return `${this.name}:${id}`;
    }

    private isExpired(ttl?: number): boolean {
      if (!ttl) return false;
      return Math.floor(Date.now() / 1000) > ttl;
    }
  };
}
