#!/usr/bin/env bash


# Uncomment to create secret
# aws secretsmanager create-secret --name sam-local-oidc-stub-client-config \
    # --secret-string '[
      # INSERT JSON CONFIG HERE
    # ]'


provider_key="""
INSERT EC PRIVATE KEY HERE
"""

# Uncomment to create secret
# aws secretsmanager create-secret --name sam-local-oidc-provider-ec-signing-key \
#     --secret-string "${provider_key}"

TABLE_NAME="sam-local-oidc-stub-data"

echo "Creating DynamoDB table '$TABLE_NAME'..."
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=userCode,AttributeType=S \
    AttributeName=uid,AttributeType=S \
    AttributeName=grantId,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "userCode-index",
      "KeySchema": [{"AttributeName": "userCode", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "uid-index",
      "KeySchema": [{"AttributeName": "uid", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "grantId-index",
      "KeySchema": [{"AttributeName": "grantId", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]'

echo "Waiting for table creation to complete..."
aws dynamodb wait table-exists --table-name "$TABLE_NAME"

echo "Enabling TTL on attribute 'ttl'..."
aws dynamodb update-time-to-live \
  --table-name "$TABLE_NAME" \
  --time-to-live-specification Enabled=true,AttributeName=ttl

LOCAL_TABLE_NAME="local-oidc-stub-data"

echo "Creating DynamoDB table '$LOCAL_TABLE_NAME'..."
aws dynamodb create-table \
  --table-name "$LOCAL_TABLE_NAME" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=userCode,AttributeType=S \
    AttributeName=uid,AttributeType=S \
    AttributeName=grantId,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "userCode-index",
      "KeySchema": [{"AttributeName": "userCode", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "uid-index",
      "KeySchema": [{"AttributeName": "uid", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "grantId-index",
      "KeySchema": [{"AttributeName": "grantId", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]'

echo "Waiting for table creation to complete..."
aws dynamodb wait table-exists --table-name "$LOCAL_TABLE_NAME"

echo "Enabling TTL on attribute 'ttl'..."
aws dynamodb update-time-to-live \
  --table-name "$LOCAL_TABLE_NAME" \
  --time-to-live-specification Enabled=true,AttributeName=ttl
