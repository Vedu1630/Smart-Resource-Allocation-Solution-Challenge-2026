const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1000;

export async function callClaude(systemPrompt, userPrompt, apiKey) {
    if (!apiKey) {
        // Return mock response when no API key
        return getMockResponse(systemPrompt);
    }

    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: ANTHROPIC_MODEL,
                max_tokens: MAX_TOKENS,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        return data.content[0].text;
    } catch (err) {
        console.error('Claude API error:', err);
        return getMockResponse(systemPrompt);
    }
}

function getMockResponse(systemPrompt) {
    const lower = systemPrompt.toLowerCase();

    if (lower.includes('daily brief') || lower.includes('dashboard')) {
        return JSON.stringify({
            summary: "Today's priority: 3 critical needs remain unmatched in North District and East Sector. Water contamination in Zone 2 requires immediate deployment of purification units. Medical response at flood shelter is the longest-pending critical need (6 hrs). Recommend redirecting volunteers v3 (Medical) and v19 (CPR/First Aid) to n1 immediately. South Ward shelter construction is on track — 8 of 15 units completed.",
            priorities: [
                "Deploy water purification team to East Sector (n5)",
                "Assign medical volunteers to flood shelter (n1)",
                "Scale evening meal prep — current capacity insufficient (n12)"
            ],
            riskFlags: [
                "Zone 2 water supply critical — affects 500+ residents",
                "Elderly medication backlog growing — 23 unserved",
                "South Ward road blockage impeding supply routes"
            ]
        });
    }

    if (lower.includes('match') || lower.includes('volunteer ranking')) {
        return JSON.stringify({
            matches: [
                { volunteerId: 'v3', name: 'Yuki Tanaka', confidence: 94, rationale: 'Medical + CPR certified. Available today. Same zone. 203 hours experience with 4 prior matches.' },
                { volunteerId: 'v19', name: 'Hana Kim', confidence: 89, rationale: 'Medical + First Aid skills. Available Thursday. Same zone. 145 hours logged.' },
                { volunteerId: 'v9', name: 'Jin Wei', confidence: 81, rationale: 'Medical + First Aid + Logistics. Different zone but available. Experienced with 167 hours.' },
                { volunteerId: 'v13', name: 'Nalini Reddy', confidence: 76, rationale: 'Medical + Counseling. Available today. Zone z4 — would need cross-zone deployment.' },
            ]
        });
    }

    if (lower.includes('extract') || lower.includes('report')) {
        return JSON.stringify({
            extractedNeeds: [
                { title: 'Roof repair for community hall', category: 'Infrastructure', severity: 6, zone: 'z3', description: 'Partial roof collapse after heavy rains. Hall serves as meeting point for 80 families.' },
                { title: 'Drinking water shortage in Block C', category: 'Water & Sanitation', severity: 8, description: 'Municipal water supply cut off for 3 days. 120 households affected.' },
            ],
            confidence: 0.87,
            warnings: ['Zone could not be determined for second need — manual assignment recommended']
        });
    }

    if (lower.includes('skill gap') || lower.includes('gap analysis')) {
        return JSON.stringify({
            gaps: [
                { skill: 'Water & Sanitation', demand: 3, supply: 0, severity: 'critical', recommendation: 'Urgent: recruit WASH-trained volunteers or partner with water NGOs' },
                { skill: 'Electrical', demand: 2, supply: 1, severity: 'high', recommendation: 'Cross-train construction volunteers in basic electrical safety' },
                { skill: 'Counseling', demand: 3, supply: 3, severity: 'adequate', recommendation: 'Current capacity meets demand. Monitor for burnout.' },
                { skill: 'Medical', demand: 4, supply: 4, severity: 'adequate', recommendation: 'Adequate coverage but all medical volunteers are heavily loaded.' },
                { skill: 'Construction', demand: 3, supply: 4, severity: 'surplus', recommendation: 'Slight surplus. Consider retraining 1 volunteer for plumbing.' },
            ],
            overallScore: 62,
            criticalFlags: ['No WASH specialists available despite 3 open water/sanitation needs', '2 medical volunteers showing 150+ hours — burnout risk'],
            trainingPrograms: [
                { name: 'WASH Emergency Response', duration: '3 days', priority: 'critical', targetVolunteers: ['v5', 'v14'] },
                { name: 'Basic Electrical Safety', duration: '1 day', priority: 'high', targetVolunteers: ['v2', 'v18'] },
                { name: 'Psychological First Aid', duration: '2 days', priority: 'medium', targetVolunteers: ['v1', 'v4'] },
            ]
        });
    }

    if (lower.includes('categoriz')) {
        return JSON.stringify({
            category: 'Infrastructure',
            severity: 6,
            confidence: 0.82,
            reasoning: 'Description mentions structural damage and repair needs. Classified as Infrastructure based on key terms.'
        });
    }

    return JSON.stringify({ message: 'AI analysis complete. Configure API key in Settings for live responses.' });
}

export async function getDailyBrief(needs, volunteers, apiKey) {
    const system = 'You are an AI operations analyst for disaster relief. Generate a daily brief for the dashboard. Return JSON with: summary (string), priorities (array of 3 strings), riskFlags (array of strings).';
    const user = `Current open needs: ${JSON.stringify(needs.filter(n => n.status === 'open'))}. Active volunteers: ${Math.round(volunteers.filter(v => v.status === 'active').length)}.`;
    const result = await callClaude(system, user, apiKey);
    try { return JSON.parse(result); } catch { return { summary: result, priorities: [], riskFlags: [] }; }
}

export async function getMatchRecommendations(need, volunteers, apiKey) {
    const system = 'You are a volunteer matching engine. Given a community need and available volunteers, rank the best matches. Return JSON with: matches (array of {volunteerId, name, confidence (0-100), rationale}).';
    const user = `Need: ${JSON.stringify(need)}. Available volunteers: ${JSON.stringify(volunteers.filter(v => v.status === 'active'))}`;
    const result = await callClaude(system, user, apiKey);
    try { return JSON.parse(result); } catch { return { matches: [] }; }
}

export async function extractNeedData(reportText, apiKey) {
    const system = 'You are a report data extractor for disaster relief. Extract structured need data from field reports. Return JSON with: extractedNeeds (array of {title, category, severity (1-10), zone, description}), confidence (0-1), warnings (array).';
    const user = `Field report content: ${reportText}`;
    const result = await callClaude(system, user, apiKey);
    try { return JSON.parse(result); } catch { return { extractedNeeds: [], confidence: 0, warnings: ['Parse error'] }; }
}

export async function getSkillGapAnalysis(needs, volunteers, apiKey) {
    const system = 'You are a skill gap analyst. Compare open needs against volunteer skill pool. Return JSON with: gaps (array of {skill, demand, supply, severity, recommendation}), overallScore (0-100), criticalFlags (array), trainingPrograms (array of {name, duration, priority, targetVolunteers}).';
    const user = `Open needs: ${JSON.stringify(needs.filter(n => n.status === 'open'))}. Volunteers: ${JSON.stringify(volunteers)}`;
    const result = await callClaude(system, user, apiKey);
    try { return JSON.parse(result); } catch { return { gaps: [], overallScore: 0, criticalFlags: [], trainingPrograms: [] }; }
}

export async function autoCategorize(description, apiKey) {
    const system = 'You are a need categorization AI. Given a description, determine the category and severity. Return JSON with: category (string), severity (1-10), confidence (0-1), reasoning (string).';
    const user = `Need description: ${description}`;
    const result = await callClaude(system, user, apiKey);
    try { return JSON.parse(result); } catch { return { category: 'Uncategorized', severity: 5, confidence: 0, reasoning: 'Could not parse' }; }
}
