export default async function handler(req, res) {
  console.log('API called');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log('API Key length:', apiKey ? apiKey.length : 0);

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: 'No ingredients provided' });
  }

  try {
    const ingredientsList = ingredients.join('、');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `以下の食材を使ったレシピを提案してください。JSON形式で返してください。

食材：${ingredientsList}

以下の形式で JSON を返してください：
{
  "title": "レシピのタイトル",
  "servings": "人数",
  "cookTime": "調理時間",
  "ingredients": ["食材1", "食材2"],
  "instructions": ["手順1", "手順2"],
  "tips": "調理のコツ"
}

日本語で、実際に作れるレシピを提案してください。`
          }
        ]
      })
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({ error: 'Failed to generate recipe' });
    }

    const data = await response.json();
    const content = data.content[0].text;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Invalid response format' });
    }

    const recipe = JSON.parse(jsonMatch[0]);
    return res.status(200).json(recipe);

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Failed to generate recipe' });
  }
}
