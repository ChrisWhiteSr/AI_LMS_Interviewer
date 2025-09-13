async function updateEdgeConfig(key: string, value: any) {
  // First, try to create the item. This works for new sessions.
  let response = await fetch(API_URL, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
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