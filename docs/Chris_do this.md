Hello Chris,

To connect to the Vercel Postgres database and the Google Gemini API, please add the following environment variables to a `.env` file in the project root:

```
# Vercel Edge Config Connection String
EDGE_CONFIG="your-connection-string-here"

# Google Gemini API Key
GEMINI_API_KEY="your-api-key-here"
```

You can find the `EDGE_CONFIG` connection string in your Vercel project's storage settings after creating the Edge Config store. The `GEMINI_API_KEY` can be obtained from Google AI Studio.

Thanks!
Gemini
