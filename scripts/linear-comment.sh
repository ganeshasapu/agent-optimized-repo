#!/usr/bin/env bash
# linear-comment.sh — Add a comment to a Linear ticket
# Usage: ./scripts/linear-comment.sh <identifier> <comment>
# Example: ./scripts/linear-comment.sh AGE-5 "Found a related issue while working on AGE-17"
#
# Requires LINEAR_API_KEY environment variable

set -euo pipefail

IDENTIFIER="${1:-}"
COMMENT="${2:-}"

if [[ -z "$IDENTIFIER" || -z "$COMMENT" ]]; then
  echo "Usage: $0 <ticket-identifier> <comment>" >&2
  echo "Example: $0 AGE-5 'Found related issue while working on AGE-17'" >&2
  exit 1
fi

if [[ -z "${LINEAR_API_KEY:-}" ]]; then
  echo "LINEAR_API_KEY is not set" >&2
  exit 1
fi

# Escape the comment for GraphQL
ESCAPED_COMMENT=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$COMMENT")
ESCAPED_ID=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1])[1:-1])" "$IDENTIFIER")

# Use issueUpdate with identifier to find by AGE-XX style ID
PAYLOAD=$(python3 -c "
import json
query = '''
mutation {
  commentCreate(input: {
    issueId: \"LOOKUP\"
    body: \"$ESCAPED_COMMENT\"
  }) {
    success
  }
}
'''
# First we need to look up the issue ID from the identifier
lookup_query = 'query { issueVcsBranchSearch(branchName: \"unused\") { id } }'
# Actually, use issue search by identifier
lookup_query = '''query { issues(filter: { identifier: { eq: \"$ESCAPED_ID\" } }) { nodes { id } } }'''
print(json.dumps({'query': lookup_query}))
")

# Step 1: Look up the issue UUID from the identifier
LOOKUP_PAYLOAD=$(python3 -c "import json; print(json.dumps({'query': 'query { issues(filter: { identifier: { eq: \"${IDENTIFIER}\" } }) { nodes { id } } }'}))")

RESPONSE=$(curl -s -S -X POST "https://api.linear.app/graphql" \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$LOOKUP_PAYLOAD")

ISSUE_ID=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
nodes = data.get('data', {}).get('issues', {}).get('nodes', [])
if nodes:
    print(nodes[0]['id'])
else:
    print('')
" 2>/dev/null)

if [[ -z "$ISSUE_ID" ]]; then
  echo "Could not find issue $IDENTIFIER" >&2
  exit 1
fi

# Step 2: Add the comment
COMMENT_PAYLOAD=$(python3 -c "import json; print(json.dumps({'query': 'mutation { commentCreate(input: { issueId: \"${ISSUE_ID}\", body: \"${ESCAPED_COMMENT}\" }) { success } }'}))")

curl -s -S -X POST "https://api.linear.app/graphql" \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$COMMENT_PAYLOAD" > /dev/null

echo "Comment added to $IDENTIFIER"
