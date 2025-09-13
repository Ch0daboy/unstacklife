#!/usr/bin/env bash
set -euo pipefail

# Create least-privileged IAM policy, user, and optional role for Amazon Bedrock
# and output access keys safely to a file.
#
# Requirements:
# - AWS CLI v2 configured with an admin or IAM user that can create IAM resources
# - jq
#
# Usage:
#   scripts/create-bedrock-iam.sh \
#     --region us-west-2 \
#     --models "anthropic.claude-3-5-haiku-20241022-v1:0,amazon.titan-image-generator-v2:0" \
#     --user-name bedrock-unstack-user \
#     --role-name bedrock-unstack-role \
#     --policy-name BedrockInvokeMinimal \
#     --profile default \
#     --out ./.env.local
#
# Notes:
# - The generated policy limits permissions to the specified model IDs in the given region.
# - Access keys are written to the file you provide with permissions 600.
# - By default we DO NOT print the secret access key to stdout.

REGION="us-west-2"
MODELS="anthropic.claude-3-5-haiku-20241022-v1:0,amazon.titan-image-generator-v2:0"
USER_NAME="bedrock-unstack-user"
ROLE_NAME="bedrock-unstack-role"
POLICY_NAME="BedrockInvokeMinimal"
PROFILE=""
OUTFILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"; shift 2;;
    --models)
      MODELS="$2"; shift 2;;
    --user-name)
      USER_NAME="$2"; shift 2;;
    --role-name)
      ROLE_NAME="$2"; shift 2;;
    --policy-name)
      POLICY_NAME="$2"; shift 2;;
    --profile)
      PROFILE="--profile $2"; shift 2;;
    --out)
      OUTFILE="$2"; shift 2;;
    -h|--help)
      grep "^#" "$0" | sed "s/^# //"; exit 0;;
    *)
      echo "Unknown argument: $1" >&2; exit 1;;
  esac
done

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI not found. Please install AWS CLI v2." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Please install jq." >&2
  exit 1
fi

echo "Region: $REGION"
echo "Models: $MODELS"
echo "User:   $USER_NAME"
echo "Role:   $ROLE_NAME"
echo "Policy: $POLICY_NAME"

# Build resource ARNs for Bedrock foundation models
IFS=',' read -r -a MODEL_ARRAY <<< "$MODELS"
RESOURCE_ARNS=()
for MID in "${MODEL_ARRAY[@]}"; do
  # Bedrock model ARN format has an empty account segment
  RESOURCE_ARNS+=("arn:aws:bedrock:${REGION}::foundation-model/${MID}")
done

POLICY_DOC=$(jq -n \
  --argjson resources "$(printf '%s\n' "${RESOURCE_ARNS[@]}" | jq -R . | jq -s .)" \
  '{
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel",
           "bedrock:InvokeModelWithResponseStream",
           "bedrock:Converse",
           "bedrock:ConverseStream"
         ],
         "Resource": $resources
       }
     ]
   }')

echo "Ensuring IAM policy exists..."
POLICY_ARN=""
set +e
EXISTING=$(aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity $PROFILE --query Account --output text):policy/${POLICY_NAME}" $PROFILE 2>/dev/null)
STATUS=$?
set -e

if [[ $STATUS -eq 0 ]]; then
  ACCOUNT_ID=$(echo "$EXISTING" | jq -r '.Policy.Arn' | cut -d: -f5)
  POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
  echo "Policy already exists: $POLICY_ARN"
  echo "Creating a new policy version and setting it as default..."
  aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document "$POLICY_DOC" \
    --set-as-default $PROFILE >/dev/null
else
  ACCOUNT_ID=$(aws sts get-caller-identity $PROFILE --query Account --output text)
  CREATE_OUT=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOC" $PROFILE)
  POLICY_ARN=$(echo "$CREATE_OUT" | jq -r '.Policy.Arn')
  echo "Created policy: $POLICY_ARN"
fi

echo "Ensuring IAM user exists and attaching policy..."
set +e
aws iam get-user --user-name "$USER_NAME" $PROFILE >/dev/null 2>&1
USER_EXISTS=$?
set -e

if [[ $USER_EXISTS -ne 0 ]]; then
  aws iam create-user --user-name "$USER_NAME" $PROFILE >/dev/null
  echo "Created user: $USER_NAME"
else
  echo "User already exists: $USER_NAME"
fi

# Attach policy if not already attached
ATTACHED=$(aws iam list-attached-user-policies --user-name "$USER_NAME" $PROFILE | jq -r '.AttachedPolicies[].PolicyArn')
if ! grep -q "$POLICY_ARN" <(printf '%s\n' "$ATTACHED"); then
  aws iam attach-user-policy --user-name "$USER_NAME" --policy-arn "$POLICY_ARN" $PROFILE
  echo "Attached policy to user"
else
  echo "Policy already attached to user"
fi

echo "Creating or rotating access keys for the user..."
ACCESS_KEYS=$(aws iam list-access-keys --user-name "$USER_NAME" $PROFILE | jq -r '.AccessKeyMetadata | length')
if [[ "$ACCESS_KEYS" -ge 2 ]]; then
  echo "User already has 2 access keys. Deleting the oldest one to rotate..."
  OLDEST_KEY_ID=$(aws iam list-access-keys --user-name "$USER_NAME" $PROFILE | jq -r '.AccessKeyMetadata | sort_by(.CreateDate) | .[0].AccessKeyId')
  aws iam delete-access-key --user-name "$USER_NAME" --access-key-id "$OLDEST_KEY_ID" $PROFILE
fi

CREATE_KEY_OUT=$(aws iam create-access-key --user-name "$USER_NAME" $PROFILE)
AKID=$(echo "$CREATE_KEY_OUT" | jq -r '.AccessKey.AccessKeyId')
SAK=$(echo "$CREATE_KEY_OUT" | jq -r '.AccessKey.SecretAccessKey')

echo "Creating optional role and attaching policy..."
TRUST_DOC="{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Effect\": \"Allow\",\n      \"Principal\": { \"AWS\": \"*\" },\n      \"Action\": \"sts:AssumeRole\",\n      \"Condition\": {}\n    }\n  ]\n}"

set +e
aws iam get-role --role-name "$ROLE_NAME" $PROFILE >/dev/null 2>&1
ROLE_EXISTS=$?
set -e

if [[ $ROLE_EXISTS -ne 0 ]]; then
  aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document "$TRUST_DOC" $PROFILE >/dev/null
  echo "Created role: $ROLE_NAME"
else
  echo "Role already exists: $ROLE_NAME"
fi

# Attach policy to role if not attached
RATTACHED=$(aws iam list-attached-role-policies --role-name "$ROLE_NAME" $PROFILE | jq -r '.AttachedPolicies[].PolicyArn')
if ! grep -q "$POLICY_ARN" <(printf '%s\n' "$RATTACHED"); then
  aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN" $PROFILE
  echo "Attached policy to role"
else
  echo "Policy already attached to role"
fi

if [[ -n "$OUTFILE" ]]; then
  echo "Writing credentials to $OUTFILE (mode 600)"
  umask 177
  cat > "$OUTFILE" <<EOF
# Generated by scripts/create-bedrock-iam.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ)
VITE_AWS_ACCESS_KEY_ID=$AKID
VITE_AWS_SECRET_ACCESS_KEY=$SAK
VITE_AWS_REGION=$REGION
VITE_BEDROCK_MODEL_ID=$(echo "$MODELS" | awk -F, '{print $1}')
EOF
  chmod 600 "$OUTFILE"
  echo "Credentials saved. Keep this file secret and out of version control."
else
  echo "Access key created for user $USER_NAME."
  echo "AccessKeyId: $AKID"
  echo "SecretAccessKey: (hidden; use --out to save to a secure file)"
fi

echo "Done. You can now input these keys in the app's API Settings."
