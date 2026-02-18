import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { Article, ArticleFilter, BookmarkRow, Digest } from "./types";

export class DatabaseReader {
	private db: SqlJsDatabase | null = null;

	constructor(private wasmPath: string) {}

	private resolveDbPath(dbPath: string): string {
		if (dbPath.startsWith("~")) {
			return path.join(os.homedir(), dbPath.slice(1));
		}
		return dbPath;
	}

	async open(dbPath: string): Promise<void> {
		const resolvedPath = this.resolveDbPath(dbPath);

		if (!fs.existsSync(resolvedPath)) {
			throw new Error(`Database not found: ${resolvedPath}`);
		}

		const wasmBinary = fs.readFileSync(this.wasmPath);
		const SQL = await initSqlJs({
			wasmBinary: wasmBinary.buffer.slice(0) as ArrayBuffer,
		});

		const fileBuffer = fs.readFileSync(resolvedPath);
		this.db = new SQL.Database(new Uint8Array(fileBuffer));
	}

	async reload(dbPath: string): Promise<void> {
		this.close();
		await this.open(dbPath);
	}

	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	get isOpen(): boolean {
		return this.db !== null;
	}

	getArticles(opts: {
		filter?: ArticleFilter;
		feedName?: string;
		search?: string;
		limit?: number;
	}): Article[] {
		if (!this.db) return [];

		let query = "SELECT * FROM articles WHERE 1=1";
		const params: (string | number)[] = [];

		if (opts.filter === "bookmarked") {
			query += " AND is_bookmarked = 1";
		} else if (opts.filter === "unread") {
			query += " AND is_read = 0";
		}

		if (opts.feedName) {
			query += " AND feed_name = ?";
			params.push(opts.feedName);
		}

		if (opts.search) {
			const escaped = opts.search
				.replace(/\\/g, "\\\\")
				.replace(/%/g, "\\%")
				.replace(/_/g, "\\_");
			const pattern = `%${escaped}%`;
			query +=
				" AND (title LIKE ? ESCAPE '\\'" +
				" OR description LIKE ? ESCAPE '\\'" +
				" OR insight LIKE ? ESCAPE '\\'" +
				" OR translated_title LIKE ? ESCAPE '\\'" +
				" OR translated_desc LIKE ? ESCAPE '\\')";
			params.push(pattern, pattern, pattern, pattern, pattern);
		}

		query += " ORDER BY published_at DESC, fetched_at DESC LIMIT ?";
		params.push(opts.limit ?? 200);

		return this.runQuery<Article>(query, params);
	}

	getArticle(articleId: string): Article | null {
		if (!this.db) return null;
		const results = this.runQuery<Article>(
			"SELECT * FROM articles WHERE id = ?",
			[articleId],
		);
		return results[0] ?? null;
	}

	getFeedNames(): string[] {
		if (!this.db) return [];
		const results = this.runQuery<{ feed_name: string }>(
			"SELECT DISTINCT feed_name FROM articles ORDER BY feed_name",
			[],
		);
		return results.map((r) => r.feed_name);
	}

	getBookmarkData(articleId: string): BookmarkRow | null {
		if (!this.db) return null;
		const results = this.runQuery<BookmarkRow>(
			"SELECT * FROM bookmarks WHERE article_id = ?",
			[articleId],
		);
		return results[0] ?? null;
	}

	getBookmarkTags(articleId: string): string[] {
		const bm = this.getBookmarkData(articleId);
		if (!bm || !bm.tags) return [];
		return bm.tags
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
	}

	getDigests(periodDays?: number): Digest[] {
		if (!this.db) return [];
		if (periodDays !== undefined) {
			return this.runQuery<Digest>(
				"SELECT * FROM digests WHERE period_days = ? ORDER BY created_at DESC",
				[periodDays],
			);
		}
		return this.runQuery<Digest>(
			"SELECT * FROM digests ORDER BY created_at DESC",
			[],
		);
	}

	getLatestDigest(periodDays: number): Digest | null {
		if (!this.db) return null;
		const results = this.runQuery<Digest>(
			"SELECT * FROM digests WHERE period_days = ? ORDER BY created_at DESC LIMIT 1",
			[periodDays],
		);
		return results[0] ?? null;
	}

	getRecentArticles(days: number, limit: number): Article[] {
		if (!this.db) return [];
		return this.runQuery<Article>(
			"SELECT * FROM articles " +
				"WHERE published_at >= datetime('now', ?) OR fetched_at >= datetime('now', ?) " +
				"ORDER BY published_at DESC, fetched_at DESC LIMIT ?",
			[`-${days} days`, `-${days} days`, limit],
		);
	}

	getArticleCount(): number {
		if (!this.db) return 0;
		const results = this.runQuery<{ cnt: number }>(
			"SELECT COUNT(*) as cnt FROM articles",
			[],
		);
		return results[0]?.cnt ?? 0;
	}

	getUnreadCount(): number {
		if (!this.db) return 0;
		const results = this.runQuery<{ cnt: number }>(
			"SELECT COUNT(*) as cnt FROM articles WHERE is_read = 0",
			[],
		);
		return results[0]?.cnt ?? 0;
	}

	getBookmarkedCount(): number {
		if (!this.db) return 0;
		const results = this.runQuery<{ cnt: number }>(
			"SELECT COUNT(*) as cnt FROM articles WHERE is_bookmarked = 1",
			[],
		);
		return results[0]?.cnt ?? 0;
	}

	private runQuery<T>(sql: string, params: (string | number)[]): T[] {
		if (!this.db) return [];
		const stmt = this.db.prepare(sql);
		stmt.bind(params);

		const results: T[] = [];
		while (stmt.step()) {
			const row = stmt.getAsObject() as T;
			results.push(row);
		}
		stmt.free();
		return results;
	}
}
