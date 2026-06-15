import { API_BASE_URL } from '../config';

export async function getDailyBrief(needs, volunteers) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/brief`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ needs, volunteers })
        });
        if (!response.ok) throw new Error('Failed to generate brief');
        return await response.json();
    } catch (err) {
        console.error('Error fetching daily brief:', err);
        return {
            summary: "Unable to load dynamic daily brief. Please ensure backend is running with a valid Gemini API key.",
            priorities: ["Verify backend connectivity", "Check GEMINI_API_KEY environment variable"],
            riskFlags: ["AI service connectivity issue"]
        };
    }
}
