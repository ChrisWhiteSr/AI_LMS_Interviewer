const EDGE_CONFIG_API_URL = `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`;

async function updateEdgeConfig(key: string, value: any) {
  const response = await fetch(EDGE_CONFIG_API_URL, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
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

  if (!response.ok) {
    const errorData = await response.text(); // Get raw text for better debugging
    console.error('Failed to update Edge Config. Status:', response.status);
    console.error('Vercel API Response:', errorData);
    throw new Error(`Failed to update Edge Config: ${errorData}`);
  }

  return await response.json();
}

export { updateEdgeConfig };
