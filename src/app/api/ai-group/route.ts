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

// Curated list of revered Catholic & Filipino Catholic patron saints for CFC groups
const CATHOLIC_PATRON_NAMES = [
  'St. Joseph & Mary Group',
  'Holy Family Group',
  'St. Lorenzo Ruiz Group',
  'St. Pedro Calungsod Group',
  'St. Vincent Ferrer Group',
  'St. Isidore the Farmer Group',
  'St. Anne & St. Joachim Group',
  'St. Therese of Lisieux Group',
  'St. Francis of Assisi Group',
  'St. Anthony of Padua Group',
  'St. Padre Pio Group',
  'St. Jude Thaddeus Group',
  'Archangel Michael Group',
  'Archangel Gabriel Group',
  'Archangel Raphael Group',
  'Immaculate Conception Group',
  'Sacred Heart of Jesus Group',
  'St. John the Baptist Group',
  'St. Augustine & St. Monica Group',
  'St. Benedict & St. Scholastica Group',
  'St. Ignatius of Loyola Group',
  'St. Dominic Savio Group',
  'St. Paul the Apostle Group',
  'Our Lady of Peace and Good Voyage Group',
  'Our Lady of the Rosary Group',
];

// Priority-ordered list of Gemini models to try.
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

/**
 * Intelligent helper to extract target group count and size per group from user instructions.
 * e.g. "Group with 5 members each and groupd by age and barangay proximity."
 *      -> targetSize = 5, targetGroupCount = 8 (for 40 couples).
 */
export function parseGroupingParameters(userPrompt: string, totalCouples: number) {
  // Check for explicit size per group: '5 members each', '5 member each', '5 couples each', 'groups of 5', '5 per group', '5 each'
  const sizeMatch = userPrompt.match(
    /(?:groups?\s+(?:of|with)\s+(\d+)|(\d+)\s*(?:members?|couples?|pax)?\s*(?:each|per\s+group)|(?:each|every)\s+group\s*(?:has|with|of)?\s*(\d+))/i
  );

  // Check for explicit group count: '4 groups', '8 groups', 'create 4 balanced discussion circles'
  const countMatch = userPrompt.match(/(\d+)\s*(?:balanced\s+|discussion\s+)*(?:groups?|circles?|cells?)/i);

  let targetSize: number | null = null;
  if (sizeMatch) {
    const raw = sizeMatch[1] || sizeMatch[2] || sizeMatch[3];
    if (raw) targetSize = parseInt(raw, 10);
  }

  let targetGroupCount: number | null = null;
  if (sizeMatch && targetSize && targetSize > 0) {
    targetGroupCount = Math.max(1, Math.ceil(totalCouples / targetSize));
  } else if (countMatch) {
    targetGroupCount = Math.max(1, parseInt(countMatch[1], 10));
    targetSize = Math.max(1, Math.round(totalCouples / targetGroupCount));
  } else {
    // Default sensible group size in CLP is ~5 couples per group
    targetSize = 5;
    targetGroupCount = Math.max(1, Math.ceil(totalCouples / targetSize));
  }

  if (!targetSize || targetSize <= 0) {
    targetSize = Math.max(1, Math.round(totalCouples / targetGroupCount));
  }

  return { targetGroupCount, targetSize };
}

/**
 * Heuristic pastoral clustering to ensure 100% of participants are grouped.
 * Used to complete partial AI responses or as graceful fallback on API downtime.
 */
function completeMissingCouples(
  existingGroups: AIGroup[],
  allCouples: CoupleForGrouping[],
  targetGroupCount: number,
  targetSize: number,
  userPrompt: string
): AIGroup[] {
  const assignedIds = new Set<string>();
  for (const g of existingGroups) {
    for (const c of g.couples) {
      assignedIds.add(c.id);
    }
  }

  const unassigned = allCouples.filter((c) => !assignedIds.has(c.id));
  if (unassigned.length === 0) {
    return existingGroups;
  }

  console.log(`[ai-group] Completing missing groups: ${unassigned.length} unassigned couples out of ${allCouples.length}`);

  // Sort unassigned primarily by barangay for geographical proximity, secondarily by name
  unassigned.sort((a, b) => (a.barangay || '').localeCompare(b.barangay || '') || a.name.localeCompare(b.name));

  const existingNames = new Set(existingGroups.map((g) => g.groupName.toLowerCase()));
  let availableNames = CATHOLIC_PATRON_NAMES.filter((n) => !existingNames.has(n.toLowerCase()));
  if (availableNames.length === 0) availableNames = CATHOLIC_PATRON_NAMES;

  const newGroups: AIGroup[] = [];
  let currentChunk: CoupleForGrouping[] = [];

  for (let i = 0; i < unassigned.length; i++) {
    currentChunk.push(unassigned[i]);
    const isLast = i === unassigned.length - 1;

    // Trigger new group when chunk reaches targetSize or if reaching the end with 3+ members
    if (currentChunk.length >= targetSize || (isLast && currentChunk.length >= 3)) {
      const gNum = existingGroups.length + newGroups.length + 1;
      const gName = availableNames[newGroups.length % availableNames.length] || `Pastoral Circle ${gNum}`;

      const bgs = [...new Set(currentChunk.map((c) => c.barangay).filter(Boolean))];
      const bgText = bgs.length > 0 ? `Barangay ${bgs.slice(0, 2).join(' & ')}` : 'Tuy community';

      newGroups.push({
        groupNumber: gNum,
        groupName: gName,
        rationale: `Couples residing primarily in ${bgText} grouped for geographic proximity, pastoral encouragement, and spiritual accompaniment.`,
        couples: currentChunk,
      });
      currentChunk = [];
    } else if (isLast && currentChunk.length > 0) {
      // If 1 or 2 leftover, distribute to existing or newest group
      if (newGroups.length > 0) {
        newGroups[newGroups.length - 1].couples.push(...currentChunk);
      } else if (existingGroups.length > 0) {
        existingGroups[existingGroups.length - 1].couples.push(...currentChunk);
      } else {
        newGroups.push({
          groupNumber: 1,
          groupName: availableNames[0] || 'Holy Family Group',
          rationale: 'Pastoral discussion circle for fellowship and shared prayer.',
          couples: currentChunk,
        });
      }
      currentChunk = [];
    }
  }

  const combined = [...existingGroups, ...newGroups];
  combined.forEach((g, idx) => {
    g.groupNumber = idx + 1;
  });

  return combined;
}

/**
 * Find the first model that actually responds to generateContent with this key.
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

  return 'gemini-2.5-flash';
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

    // Calculate exact target group count and size per group based on user instruction and couple count
    const { targetGroupCount, targetSize } = parseGroupingParameters(userPrompt, couples.length);
    console.log(`[ai-group] Grouping ${couples.length} couples: targetGroupCount=${targetGroupCount}, targetSize=${targetSize}`);

    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is not present, use pastoral grouping engine directly
    if (!apiKey) {
      console.warn('[ai-group] No GEMINI_API_KEY found, using pastoral clustering engine');
      const fallbackGroups = completeMissingCouples([], couples, targetGroupCount, targetSize, userPrompt);
      return NextResponse.json({
        groups: fallbackGroups,
        summary: `Organized all ${couples.length} couples into ${fallbackGroups.length} pastoral circles (~${targetSize} couples each) based on barangay proximity and pastoral care.`,
        prompt: userPrompt,
        generatedAt: new Date().toISOString(),
      });
    }

    // Resolve which model is available for this key
    const model = await resolveModel(apiKey);

    // Build the structured prompt for Gemini
    const couplesData = couples
      .map(
        (c, i) =>
          `${i + 1}. ID: "${c.id}" | ${c.name} | Barangay: ${c.barangay} | Husband Job: ${c.husbandOccupation || 'N/A'} | Wife Job: ${c.wifeOccupation || 'N/A'} | Address: ${c.address}${c.weddingAnniversary ? ` | Anniversary: ${c.weddingAnniversary}` : ''}`
      )
      .join('\n');

    const systemPrompt = `You are a pastoral organizer for Couples for Christ (CFC) Tuy Chapter in Batangas, Philippines. Your job is to intelligently group invited couples for a Christian Life Program (CLP) called "${programName}".

You are given ${couples.length} total couples.

CRITICAL MATHEMATICAL MANDATES:
1. TOTAL PARTICIPATION (NO COUPLER LEFT BEHIND):
   - You MUST assign ALL ${couples.length} couples into groups.
   - Every single couple ID must appear in exactly one group in the output array.
   - Total number of couples summed across all groups MUST equal exactly ${couples.length}.
2. EXACT NUMBER OF GROUPS:
   - You MUST output EXACTLY ${targetGroupCount} groups in the "groups" array (Group 1 through Group ${targetGroupCount}).
   - DO NOT STOP AFTER 1 OR 2 GROUPS! Outputting only 1 group when there are ${couples.length} couples is strictly forbidden.
   - Each group should contain approximately ${targetSize} couples (e.g. ${Math.max(3, targetSize - 1)} to ${targetSize + 1} couples).
3. SPIRITUAL NAMES & RATIONALE:
   - Give each group a meaningful Catholic saint or Holy Family patron name (e.g., "St. Joseph & Mary Group", "Holy Family Group", "St. Lorenzo Ruiz Group", "St. Pedro Calungsod Group", "St. Vincent Ferrer Group", "St. Isidore the Farmer Group", "St. Anne & St. Joachim Group", "Archangel Gabriel Group").
   - Provide a specific pastoral rationale explaining how barangay proximity, age harmony, or vocations were considered.

Return this exact JSON structure containing all ${targetGroupCount} groups:
{
  "groups": [
    {
      "groupNumber": 1,
      "groupName": "St. Isidore Group",
      "rationale": "Couples residing in Barangay Magahis grouped for geographic proximity and fellowship",
      "coupleIds": ["id1", "id2", "id3", "id4", "id5"]
    },
    {
      "groupNumber": 2,
      "groupName": "St. Joseph Group",
      "rationale": "Couples from Barangay Luntal grouped for mutual encouragement",
      "coupleIds": ["id6", "id7", "id8", "id9", "id10"]
    }
  ],
  "summary": "Distributed all ${couples.length} couples into ${targetGroupCount} balanced pastoral discussion groups based on ${userPrompt}."
}`;

    const userMessage = `GROUPING INSTRUCTION: "${userPrompt}"

MATHEMATICAL TARGETS:
- Total Couples: ${couples.length}
- Target Group Size: ~${targetSize} couples each
- Required Number of Groups to Output: EXACTLY ${targetGroupCount} groups (Group 1 through Group ${targetGroupCount})
- Every single couple ID below must be placed in one of the ${targetGroupCount} groups.

INVITED COUPLES LIST (${couples.length} total couples):
${couplesData}

Please output all ${targetGroupCount} groups containing ALL ${couples.length} couples now in valid JSON format.`;

    const makeGeminiCall = async (enforceJson: boolean) => {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.4,
        maxOutputTokens: 8192,
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

    /**
     * Resilient JSON extraction and repair function
     */
    const cleanAndParseJSON = (rawText: string) => {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error('No JSON object found in AI response');
      }
      const jsonSlice = rawText.slice(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(jsonSlice);
      } catch (initialErr) {
        try {
          const cleaned = jsonSlice
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/,\s*([\]}])/g, '$1')
            .replace(/"\s*\n\s*"/g, '",\n"')
            .replace(/}\s*\n\s*{/g, '},\n{');
          return JSON.parse(cleaned);
        } catch {
          try {
            let fixed = jsonSlice.replace(/,\s*([\]}])/g, '$1');
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;

            for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';

            return JSON.parse(fixed);
          } catch {
            throw initialErr;
          }
        }
      }
    };

    // Execute call with fallback to pastoral engine if API errors occur
    let parsed: { groups: { groupNumber: number; groupName: string; rationale: string; coupleIds: string[] }[]; summary: string } | null = null;
    let rawText = '';

    try {
      let geminiResponse = await makeGeminiCall(true);
      if (geminiResponse.status === 400 || geminiResponse.status === 404) {
        console.warn(`[ai-group] JSON mode rejected (${geminiResponse.status}), retrying without schema`);
        geminiResponse = await makeGeminiCall(false);
      }

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) {
          parsed = cleanAndParseJSON(rawText);
        }
      } else {
        console.warn(`[ai-group] Gemini API returned status ${geminiResponse.status}. Triggering pastoral clustering engine.`);
      }
    } catch (apiErr: any) {
      console.warn('[ai-group] Error invoking Gemini API:', apiErr?.message);
    }

    const coupleMap = new Map(couples.map((c) => [c.id, c]));
    let mappedGroups: AIGroup[] = [];

    if (parsed && Array.isArray(parsed.groups)) {
      const usedIds = new Set<string>();
      mappedGroups = parsed.groups.map((g, idx) => {
        const validCouples: CoupleForGrouping[] = [];
        for (const cid of g.coupleIds || []) {
          if (!usedIds.has(cid) && coupleMap.has(cid)) {
            usedIds.add(cid);
            validCouples.push(coupleMap.get(cid)!);
          }
        }
        return {
          groupNumber: g.groupNumber || idx + 1,
          groupName: g.groupName || `Discussion Circle ${idx + 1}`,
          rationale: g.rationale || '',
          couples: validCouples,
        };
      }).filter((g) => g.couples.length > 0);
    }

    // GUARANTEE: If any couples were omitted by the AI (or if AI output fewer groups than needed),
    // automatically complete the remaining groups so ALL couples are distributed into target groups!
    const finalGroups = completeMissingCouples(mappedGroups, couples, targetGroupCount, targetSize, userPrompt);

    const result: AIGroupingResult = {
      groups: finalGroups,
      summary:
        parsed?.summary ||
        `All ${couples.length} couples successfully organized into ${finalGroups.length} pastoral discussion circles (~${targetSize} couples each) based on ${userPrompt}.`,
      prompt: userPrompt,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[ai-group] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
