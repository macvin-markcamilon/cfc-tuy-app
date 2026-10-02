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

// Priority-ordered list of Gemini models to try
const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-1.0-pro',
  'gemini-pro',
];

/**
 * Discover the first available generateContent-capable model for this API key.
 * Falls back to the candidate list if ListModels fails.
 */
async function resolveModel(apiKey: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (resp.ok) {
      const data = await resp.json();
      const models: { name: string; supportedGenerationMethods?: string[] }[] =
        data.models || [];
      // Prefer our priority list if available
      for (const candidate of CANDIDATE_MODELS) {
        const found = models.find(
          (m) =>
            (m.name === `models/${candidate}` || m.name === candidate) &&
            m.supportedGenerationMethods?.includes('generateContent')
        );
        if (found) {
          const modelId = found.name.replace('models/', '');
          console.log(`[ai-group] Using model from ListModels: ${modelId}`);
          return modelId;
        }
      }
      // Pick any model that supports generateContent
      const any = models.find((m) =>
        m.supportedGenerationMethods?.includes('generateContent')
      );
      if (any) {
        const modelId = any.name.replace('models/', '');
        console.log(`[ai-group] Using fallback model from ListModels: ${modelId}`);
        return modelId;
      }
    }
  } catch (e) {
    console.warn('[ai-group] ListModels failed, using default candidate list:', e);
  }
  // Hard fallback — first in our priority list
  console.log(`[ai-group] Defaulting to candidate model: ${CANDIDATE_MODELS[0]}`);
  return CANDIDATE_MODELS[0];
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
    console.log(`[ai-group] Calling model: ${model}`);
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt + '\n\n' + userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

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
    let parsed: { groups: { groupNumber: number; groupName: string; rationale: string; coupleIds: string[] }[]; summary: string };
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      parsed = JSON.parse(cleaned);
      if (!parsed?.groups || !Array.isArray(parsed.groups)) {
        throw new Error('Missing "groups" array in AI response');
      }
    } catch (e: any) {
      console.error('[ai-group] Failed to parse Gemini JSON output:', rawText, e?.message);
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
