export interface Article {
	id: string;
	feed_name: string;
	title: string;
	link: string;
	description: string | null;
	published_at: string | null;
	fetched_at: string;
	is_read: number; // 0 or 1
	is_bookmarked: number; // 0 or 1
	insight: string | null;
	translated_title: string | null;
	translated_desc: string | null;
	translated_body: string | null;
}

export interface BookmarkRow {
	id: number;
	article_id: string;
	bookmarked_at: string;
	tags: string | null;
	memo: string | null;
}

export interface Digest {
	id: number;
	created_at: string;
	period_days: number;
	article_count: number;
	content: string;
}

export type ArticleFilter = "all" | "bookmarked" | "unread";

export interface HawaiiDiscoSettings {
	dbPath: string;
	anthropicApiKey: string;
	aiModel: string;
	notesFolder: string;
	tagsPrefix: string;
	periodDays: number;
	includeInsight: boolean;
	includeTranslation: boolean;
	maxArticles: number;
}

export const DEFAULT_SETTINGS: HawaiiDiscoSettings = {
	dbPath: "~/.local/share/hawaiidisco/hawaiidisco.db",
	anthropicApiKey: "",
	aiModel: "claude-sonnet-4-5-20250929",
	notesFolder: "hawaii-disco",
	tagsPrefix: "hawaiidisco",
	periodDays: 7,
	includeInsight: true,
	includeTranslation: true,
	maxArticles: 20,
};
