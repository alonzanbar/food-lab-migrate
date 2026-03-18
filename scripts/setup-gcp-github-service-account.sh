#!/usr/bin/env bash
#
# Creates a GCP service account for Firebase Hosting deployment via GitHub Actions.
# Run: ./scripts/setup-gcp-github-service-account.sh [PROJECT_ID] [SERVICE_ACCOUNT_NAME]
#
# Prerequisites: gcloud CLI installed and authenticated (gcloud auth login)

set -euo pipefail

# Config (override via args or env)
PROJECT_ID="${1:-${GCP_PROJECT_ID:-food-lab-489907}}"
SA_NAME="${2:-${SA_NAME:-github-actions-firebase}}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE=".github/firebase-sa-key.json"

echo "=== GCP Service Account Setup for Firebase Hosting ==="
echo "Project:      $PROJECT_ID"
echo "Service Acct: $SA_EMAIL"
echo ""

# 1. Create service account (idempotent)
echo "1. Creating service account..."
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  echo "   Service account already exists."
else
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions - Firebase Hosting Deploy" \
    --description="Used by GitHub Actions to deploy to Firebase Hosting"
  echo "   Created."
fi

# 2. Grant IAM roles
echo ""
echo "2. Granting IAM roles..."

ROLES=(
  "roles/firebasehosting.admin"
  "roles/firebase.admin"
  "roles/storage.admin"
)

for ROLE in "${ROLES[@]}"; do
  echo "   Binding $ROLE..."
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --condition=None \
    --quiet
done

echo "   Done."

# 3. Create key
echo ""
echo "3. Creating JSON key..."

mkdir -p "$(dirname "$KEY_FILE")"

# Remove old key file if present
rm -f "$KEY_FILE"

gcloud iam service-accounts keys create "$KEY_FILE" \
  --project="$PROJECT_ID" \
  --iam-account="$SA_EMAIL"

echo "   Key saved to $KEY_FILE"

# 4. Instructions
echo ""
echo "=== Next steps ==="
echo ""
echo "1. Add the key to GitHub Secrets:"
echo "   - Repo → Settings → Secrets and variables → Actions"
echo "   - New repository secret"
echo "   - Name:  FIREBASE_SERVICE_ACCOUNT"
echo "   - Value: (paste contents of $KEY_FILE)"
echo ""
echo "2. Add $KEY_FILE to .gitignore (IMPORTANT - never commit keys!):"
echo "   echo '$KEY_FILE' >> .gitignore"
echo ""
echo "3. Delete the local key after adding to GitHub:"
echo "   rm $KEY_FILE"
echo ""
