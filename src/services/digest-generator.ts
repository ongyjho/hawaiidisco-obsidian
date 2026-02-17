import { Article, HawaiiDiscoSettings } from "../types";
import { formatDate } from "../utils";
import { callAnthropic } from "./anthropic";

// Ported from hawaiidisco/ai/prompts.py
const DIGEST_PROMPT =
	"You are a senior tech editor creating a weekly digest of notable articles.\n" +
	"Below are the articles from the past {period_days} days.\n\n" +
	"<articles>\n{articles}\n</articles>\n\n" +
	"Please create a concise, well-structured digest in English:\n" +
	"1. **Key Themes**: Identify 2-4 major themes or trends across these articles\n" +
	"2. **Top Highlights**: Summarize the 3-5 most important articles with why they matter\n" +
	"3. **What to Watch**: Briefly note emerging topics or implications for engineers\n\n" +
	"Keep the digest focused and actionable. Use markdown formatting.";

function formatArticleItem(a: Article): string {
	const date = formatDate(a.published_at ?? a.fetched_at);
	return [
		`- Title: ${a.title}`,
		`  Feed: ${a.feed_name}`,
		`  Date: ${date}`,
		`  Description: ${a.description ?? "(none)"}`,
		`  Insight: ${a.insight ?? "(none)"}`,
	].join("\n");
}

export async function generateDigest(
	articles: Article[],
	settings: HawaiiDiscoSettings,
	periodDays?: number,
): Promise<string> {
	if (articles.length === 0) {
		throw new Error("No articles to generate digest from");
	}

	const days = periodDays ?? settings.periodDays;
	const articlesText = articles.map(formatArticleItem).join("\n");
	const prompt = DIGEST_PROMPT.replace("{period_days}", String(days)).replace(
		"{articles}",
		articlesText,
	);

	return callAnthropic({
		apiKey: settings.anthropicApiKey,
		model: settings.aiModel,
		prompt,
		maxTokens: 4096,
	});
}
