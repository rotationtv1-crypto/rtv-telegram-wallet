#!/bin/bash
# Venice Ecosystem Sync — sends RTV ecosystem data to Venice AI memory
API_KEY="${VENICE_API_KEY:-${VENICE_API_KEY_2:-${VENICE_API_KEY_3}}}"
VENICE_URL="https://api.venice.ai/api/v1/chat/completions"
ECOSYSTEM_FILE="rtv_ecosystem_context_for_venice.json"

# Test credits
TEST=$(curl -s "$VENICE_URL" -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" -d '{"model":"venice-uncensored","messages":[{"role":"user","content":"hi"}],"max_tokens":1}' 2>/dev/null)

if echo "$TEST" | grep -q "Insufficient"; then
    echo "NO_CREDITS"
    exit 1
fi

if echo "$TEST" | grep -q "choices"; then
    PAYLOAD=$(python3 -c "
import json
eco = json.load(open('${ECOSYSTEM_FILE}'))
payload = {'model':'venice-uncensored','messages':[{'role':'system','content':'You are the Venice AI node for RotationTV Network. Store all ecosystem info.'},{'role':'user','content':'STORE THIS IN MEMORY:\n\n'+json.dumps(eco,indent=2)+'\n\nConfirm by summarizing key points.'}],'temperature':0.3,'max_tokens':2048}
print(json.dumps(payload))
")
    echo "$PAYLOAD" | curl -s "$VENICE_URL" -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" -d @- 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
if 'choices' in d: print('SENT_OK'); print(d['choices'][0]['message']['content'][:300])
elif 'error' in d: print('ERROR:'+d['error'])
"
    exit 0
fi
echo "UNKNOWN"
exit 1
