import { NextRequest, NextResponse } from 'next/server';

export interface CoupleForGrouping {
  id: string;
  name: string;
  barangay: string;
  husbandOccupation: string;
  wifeOccupation: string;
  address: string;
  weddingAnniversary?: string;
}

export interface AIGroup {
  groupName: string;
  groupNumber: number;
  rationale: string;
  couples: CoupleForGrouping[];
}

export interface AIGroupingResult {
  groups: AIGroup[];
  summary: string;
  prompt: string;
  generatedAt: string;
}

// Priority-ordered list of Gemini models to try.
// The API itself has been recommending gemini-3.5-flash for Tier 1 keys.
const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'gemini-pro',
];

/**
 * Find the first model that actually responds to generateContent with this key.
 * We probe each candidate with a minimal request to skip deprecated/unavailable ones.
 */
async function resolveModel(apiKey: string): Promise<string> {
  const probe = JSON.stringify({
    contents: [{ parts: [{ text: 'hi' }] }],
    generationConfig: { maxOutputTokens: 1 },
  });

  for (const model of CANDIDATE_MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: probe }
      );
      if (resp.ok) {
        console.log(`[ai-group] Using model: ${model}`);
        return model;
      }
      const err = await resp.text().catch(() => '');
      console.warn(`[ai-group] Model ${model} rejected (${resp.status}):`, err.slice(0, 120));
    } catch (e) {
      console.warn(`[ai-group] Model ${model} probe failed:`, e);
    }
  }

  // Absolute last resort — return gemini-3.5-flash and let the real call surface any error
  console.error('[ai-group] All model probes failed, falling back to gemini-3.5-flash');
  return 'gemini-3.5-flash';
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { couples, userPrompt, programName } = body as {
      couples: CoupleForGrouping[];
      userPrompt: string;
      programName: string;
    };

    if (!couples || couples.length === 0) {
      return NextResponse.json({ error: 'No couples provided for grouping.' }, { status: 400 });
    }

    if (!userPrompt || userPrompt.trim().length < 3) {
      return NextResponse.json({ error: 'Please provide a grouping instruction prompt.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Resolve which model is available for this key
    const model = await resolveModel(apiKey);

    // Build the structured prompt for Gemini
    const couplesData = couples
      .map(
        (c, i) =>
          `${i + 1}. ${c.name} | Barangay: ${c.barangay} | Husband Job: ${c.husbandOccupation || 'N/A'} | Wife Job: ${c.wifeOccupation || 'N/A'} | Address: ${c.address}${c.weddingAnniversary ? ` | Anniversary: ${c.weddingAnniversary}` : ''}`
      )
      .join('\n');

    const systemPrompt = `You are a pastoral organizer for Couples for Christ (CFC) Tuy Chapter in Batangas, Philippines. Your job is to intelligently group invited couples for a Christian Life Program (CLP) called "${programName}".

You will receive:
1. A list of invited couples with their details
2. A grouping instruction from the pastoral team leader

Your task is to create meaningful groups based on the instruction and return a structured JSON response.

IMPORTANT RULES:
- Each group should have a meaningful spiritual/pastoral name (e.g., "St. Joseph & Mary Group", "Holy Family Group", etc.)
- Groups should generally be 3-8 couples each for effective small-group dynamics
- Return ONLY valid JSON, no markdown code blocks, no extra text
- The rationale for each group should be specific to the grouping criteria
- Distribute all couples into groups (no couple left ungrouped)

Return this exact JSON structure:
{
  "groups": [
    {
      "groupNumber": 1,
      "groupName": "Group name",
      "rationale": "Why these couples are grouped together",
      "coupleIds": ["id1", "id2", "id3"]
    }
  ],
  "summary": "Brief overview of the grouping strategy and reasoning"
}`;

    const userMessage = `GROUPING INSTRUCTION: "${userPrompt}"

INVITED COUPLES LIST (${couples.length} couples):
${couplesData}

Please group these couples according to the instruction above. Remember to use their IDs (the format before the | separator in the list below):

${couples.map((c, i) => `${i + 1}. ID: ${c.id} | ${c.name}`).join('\n')}`;

    // Call Gemini API with the resolved model
    // Try with JSON mode enforced first; fall back to plain if unsupported.
    console.log(`[ai-group] Calling model: ${model}`);

    const makeGeminiCall = async (enforceJson: boolean) => {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.4,
        maxOutputTokens: 4096,
      };
      if (enforceJson) {
        generationConfig.responseMimeType = 'application/json';
        generationConfig.responseSchema = {
          type: 'object',
          properties: {
            groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  groupNumber: { type: 'integer' },
                  groupName: { type: 'string' },
                  rationale: { type: 'string' },
                  coupleIds: { type: 'array', items: { type: 'string' } },
                },
                required: ['groupNumber', 'groupName', 'rationale', 'coupleIds'],
              },
            },
            summary: { type: 'string' },
          },
          required: ['groups', 'summary'],
        };
      }
      return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + userMessage }] }],
            generationConfig,
          }),
        }
      );
    };

    let geminiResponse = await makeGeminiCall(true);
    // If model doesn't support JSON mode (400), retry without it
    if (geminiResponse.status === 400 || geminiResponse.status === 404) {
      console.warn(`[ai-group] JSON mode rejected (${geminiResponse.status}), retrying without it`);
      geminiResponse = await makeGeminiCall(false);
    }


    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`[ai-group] Gemini API error (model=${model}):`, errorText);
      let detail = geminiResponse.statusText;
      try {
        const errJson = JSON.parse(errorText);
        detail = errJson?.error?.message || detail;
      } catch {}
      return NextResponse.json(
        { error: `Gemini API error ${geminiResponse.status}: ${detail}` },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      console.error('[ai-group] Empty Gemini response:', JSON.stringify(geminiData));
      return NextResponse.json(
        { error: 'The AI returned an empty response. Please try again.' },
        { status: 500 }
      );
    }

    // Parse the JSON from Gemini's response
    // Strategy: find the first '{' and last '}' in the raw text — more robust
    // than stripping markdown fences alone, since some models add prose around the JSON.
    let parsed: { groups: { groupNumber: number; groupName: string; rationale: string; coupleIds: string[] }[]; summary: string };
    try {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error('No JSON object found in AI response');
      }
      const jsonSlice = rawText.slice(firstBrace, lastBrace + 1);
      parsed = JSON.parse(jsonSlice);
      if (!parsed?.groups || !Array.isArray(parsed.groups)) {
        throw new Error('Missing "groups" array in AI response');
      }
    } catch (e: any) {
      console.error('[ai-group] Failed to parse Gemini JSON output:', rawText.slice(0, 500), e?.message);
      return NextResponse.json(
        { error: `The AI returned an unexpected format: ${e?.message || 'parse error'}. Please try again.` },
        { status: 500 }
      );
    }

    // Reconstruct groups with full couple objects
    const coupleMap = new Map(couples.map((c) => [c.id, c]));

    const fullGroups: AIGroup[] = parsed.groups.map((g) => ({
      groupNumber: g.groupNumber,
      groupName: g.groupName,
      rationale: g.rationale,
      couples: (g.coupleIds || []).map((id) => coupleMap.get(id)).filter(Boolean) as CoupleForGrouping[],
    }));

    const result: AIGroupingResult = {
      groups: fullGroups,
      summary: parsed.summary || '',
      prompt: userPrompt,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[ai-group] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
