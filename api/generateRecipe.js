export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key missing' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `食材：${ingredients.join('、')}\n\nこれらの食材を使ったレシピをJSON形式で返してください。\n{\"title\":\"...\",\"servings\":\"...\",\"cookTime\":\"...\",\"ingredients\":[...],\"instructions\":[...],\"tips\":\"...\"}`
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error:', data);
      return res.status(500).json({ error: data.error?.message || 'API failed' });
    }

    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const recipe = JSON.parse(jsonMatch[0]);

    res.status(200).json(recipe);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
