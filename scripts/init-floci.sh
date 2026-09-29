#!/usr/bin/env bash
set -euo pipefail


declare -a envs=("local" "sam-local")

for i in "${envs[@]}"
do
   env="$i"
   config_secret_name="${env}-oidc-stub-client-config"
   key_secret_name="${env}-oidc-provider-ec-signing-key"
   table_name="${env}-oidc-stub-data"

  # magic awk command to pull in the key from mounted .env
   LOCAL_PROVIDER_EC_SIGNING_KEY=$(awk '/^LOCAL_PROVIDER_EC_SIGNING_KEY="/ { f=1; sub(/^LOCAL_PROVIDER_EC_SIGNING_KEY="/, "") } f { if (/"$/) { sub(/"$/, ""); print; f=0 } else { print } }' /etc/floci/init/data/.env)

   echo "${LOCAL_PROVIDER_EC_SIGNING_KEY}"

  aws secretsmanager create-secret --name "${config_secret_name}" \
    --secret-string "file:///etc/floci/init/data/config.local.json"

  aws secretsmanager create-secret --name "${key_secret_name}" \
    --secret-string "${LOCAL_PROVIDER_EC_SIGNING_KEY}"

  echo "Creating DynamoDB table '$table_name'..."
  aws dynamodb create-table \
    --table-name "$table_name" \
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
  aws dynamodb wait table-exists --table-name "$table_name"

  echo "Enabling TTL on attribute 'ttl'..."
  aws dynamodb update-time-to-live \
    --table-name "$table_name" \
    --time-to-live-specification Enabled=true,AttributeName=ttl
done
