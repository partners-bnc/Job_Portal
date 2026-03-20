import urllib.request, json, os
url = "https://api.groq.com/openai/v1/chat/completions"
data = {
  "model": "llama3-70b-8192",
  "messages": [
    {"role":"system", "content": "return json"},
    {"role":"user", "content":"hello"}
  ],
  "response_format": {"type": "json_object"}
}
api_key = os.environ.get("GROQ_API_KEY", "")
req = urllib.request.Request(url, json.dumps(data).encode(), {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
try:
  res = urllib.request.urlopen(req)
  print(res.read().decode())
except Exception as e:
  print(e)
  print(e.read().decode())
