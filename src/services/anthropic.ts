import { requestUrl } from "obsidian";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface AnthropicMessage {
	content: Array<{ type: string; text: string }>;
}

export async function callAnthropic(opts: {
	apiKey: string;
	model: string;
	prompt: string;
	maxTokens?: number;
}): Promise<string> {
	const { apiKey, model, prompt, maxTokens = 4096 } = opts;

	if (!apiKey) {
		throw new Error("Anthropic API key not configured");
	}

	const response = await requestUrl({
		url: ANTHROPIC_API_URL,
		method: "POST",
		headers: {
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model,
			max_tokens: maxTokens,
			messages: [{ role: "user", content: prompt }],
		}),
	});

	if (response.status !== 200) {
		throw new Error(
			`Anthropic API error: ${response.status} ${response.text}`,
		);
	}

	const data = response.json as AnthropicMessage;
	if (data.content && data.content.length > 0) {
		return data.content[0].text.trim();
	}

	throw new Error("Empty response from Anthropic API");
}
