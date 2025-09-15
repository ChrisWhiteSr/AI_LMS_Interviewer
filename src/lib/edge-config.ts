const API_BASE = 'https://api.vercel.com/v1/edge-config';

function buildApiUrl() {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  if (!edgeConfigId) {
    throw new Error('EDGE_CONFIG_ID is not set. Add it to your environment variables.');
  }

  const url = `${API_BASE}/${edgeConfigId}/items`;
  const params = new URLSearchParams();

  // Optionally scope to a team or project if provided
  if (process.env.VERCEL_TEAM_ID) params.set('teamId', process.env.VERCEL_TEAM_ID);
  if (process.env.VERCEL_PROJECT_ID) params.set('projectId', process.env.VERCEL_PROJECT_ID);

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function updateEdgeConfig(key: string, value: unknown) {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    throw new Error('VERCEL_API_TOKEN is not set. Add it to your environment variables.');
  }

  const API_URL = buildApiUrl();

  // First, try to create the item. This works for new sessions.
  let response = await fetch(API_URL, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          operation: 'create',
          key,
          value,
        },
      ],
    }),
  });

  // If it fails because the item already exists (409 Conflict), then update it.
  if (response.status === 409) {
    console.log(`Item ${key} already exists. Switching to update.`);
    response = await fetch(API_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'update',
            key,
            value,
          },
        ],
      }),
    });
  }

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to update Edge Config. Status:', response.status);
    console.error('Vercel API Response:', errorData);
    throw new Error(`Failed to update Edge Config: ${errorData}`);
  }

  return await response.json();
}

export { updateEdgeConfig };
