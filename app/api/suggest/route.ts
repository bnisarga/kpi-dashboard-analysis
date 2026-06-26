import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { columns, sampleData, columnTypes, clientApiKey } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || clientApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your server environment variables or provide a key in the UI.' },
        { status: 400 }
      );
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: 'Columns are required to generate KPI suggestions.' },
        { status: 400 }
      );
    }

    // Structure the prompt with column names, types, and sample data
    const prompt = `You are a professional business intelligence analyst and data scientist.
Given the following dataset summary, analyze the data patterns and suggest up to 6 of the most valuable, context-aware business KPIs to track on a dashboard.

### Columns and Types:
${columns.map((col) => `- ${col}: Type predicted as "${columnTypes[col] || 'unknown'}"`).join('\n')}

### Sample Data Rows (first few rows):
${JSON.stringify(sampleData, null, 2)}

Provide suggestions that capture:
1. Volumetric trends over time (if date/time columns are present).
2. Category distributions (e.g. Pie or Bar chart comparing numeric metrics across distinct categories).
3. Correlations or scatters between related numeric values.
4. Strategic/business metrics rather than basic counts (e.g., average or sum of key values where appropriate).

Ensure you recommend only valid combinations:
- 'dimension' must be an existing column name.
- 'metric' must be an existing column name.
- 'aggregation' must be one of: 'sum', 'average', 'count', 'min', 'max'.
- 'chartType' must be one of: 'bar', 'line', 'pie', 'area', 'scatter', 'radar'.
`;

    // Direct HTTP call to Google Gemini API
    const modelName = 'gemini-2.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              suggestions: {
                type: 'ARRAY',
                description: 'List of suggested KPIs',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING', description: 'Clear and descriptive KPI name, e.g., "Monthly Sales Trend"' },
                    dimension: { type: 'STRING', description: 'Existing column name to group by' },
                    metric: { type: 'STRING', description: 'Existing column name to aggregate' },
                    aggregation: { type: 'STRING', enum: ['sum', 'average', 'count', 'min', 'max'] },
                    chartType: { type: 'STRING', enum: ['bar', 'line', 'pie', 'area', 'scatter', 'radar'] },
                    color: { type: 'STRING', description: 'A Hex color code, e.g., "#3b82f6"' },
                    reason: { type: 'STRING', description: 'Business reason why this KPI is recommended based on data patterns' },
                  },
                  required: ['name', 'dimension', 'metric', 'aggregation', 'chartType', 'reason'],
                },
              },
            },
            required: ['suggestions'],
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gemini API call failed: ${errorText || response.statusText}` },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      return NextResponse.json(
        { error: 'No response suggestions returned from Gemini.' },
        { status: 500 }
      );
    }

    const suggestionsJson = JSON.parse(textResult);
    return NextResponse.json(suggestionsJson);
  } catch (error: any) {
    console.error('AI suggestion generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'An internal error occurred during suggestion generation.' },
      { status: 500 }
    );
  }
}
