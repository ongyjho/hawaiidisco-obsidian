import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import type HawaiiDiscoPlugin from "../main";
import { Article, ArticleFilter } from "../types";
import { formatDate } from "../utils";

export const VIEW_TYPE_ARTICLE_LIST = "hawaiidisco-article-list";

export class ArticleListView extends ItemView {
	private plugin: HawaiiDiscoPlugin;
	private articles: Article[] = [];
	private currentFilter: ArticleFilter = "all";
	private currentFeed = "";
	private searchQuery = "";
	private listEl: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: HawaiiDiscoPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_ARTICLE_LIST;
	}

	getDisplayText(): string {
		return "Hawaii Disco";
	}

	getIcon(): string {
		return "rss";
	}

	async onOpen(): Promise<void> {
		await Promise.resolve();
		this.renderView();
	}

	async onClose(): Promise<void> {
		// cleanup
	}

	private renderView(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass("hd-container");

		// Header with stats
		const header = container.createDiv({ cls: "hd-header" });
		this.renderStats(header);

		// Toolbar
		const toolbar = container.createDiv({ cls: "hd-toolbar" });
		this.renderToolbar(toolbar);

		// Article list
		this.listEl = container.createDiv({ cls: "hd-article-list" });
		this.loadArticles();
	}

	private renderStats(container: HTMLElement): void {
		const db = this.plugin.db;
		if (!db?.isOpen) {
			container.createDiv({
				text: "Database not connected",
				cls: "hd-status-error",
			});
			return;
		}

		const total = db.getArticleCount();
		const unread = db.getUnreadCount();
		const bookmarked = db.getBookmarkedCount();

		const stats = container.createDiv({ cls: "hd-stats" });
		stats.createSpan({ text: `${total} articles`, cls: "hd-stat" });
		stats.createSpan({ text: " \u00b7 " });
		stats.createSpan({ text: `${unread} unread`, cls: "hd-stat" });
		stats.createSpan({ text: " \u00b7 " });
		stats.createSpan({
			text: `${bookmarked} bookmarked`,
			cls: "hd-stat",
		});
	}

	private renderToolbar(toolbar: HTMLElement): void {
		// Filter buttons
		const filterBar = toolbar.createDiv({ cls: "hd-filter-bar" });
		const filters: { label: string; value: ArticleFilter }[] = [
			{ label: "All", value: "all" },
			{ label: "Bookmarked", value: "bookmarked" },
			{ label: "Unread", value: "unread" },
		];

		for (const f of filters) {
			const btn = filterBar.createEl("button", {
				text: f.label,
				cls: `hd-filter-btn${f.value === this.currentFilter ? " hd-filter-active" : ""}`,
			});
			btn.addEventListener("click", () => {
				this.currentFilter = f.value;
				this.renderView();
			});
		}

		// Feed dropdown
		const feedRow = toolbar.createDiv({ cls: "hd-feed-row" });
		const feedSelect = feedRow.createEl("select", {
			cls: "hd-feed-select",
		});
		feedSelect.createEl("option", { text: "All feeds", value: "" });
		const feedNames = this.plugin.db?.getFeedNames() ?? [];
		for (const name of feedNames) {
			const opt = feedSelect.createEl("option", {
				text: name,
				value: name,
			});
			if (name === this.currentFeed) opt.selected = true;
		}
		feedSelect.addEventListener("change", () => {
			this.currentFeed = feedSelect.value;
			this.loadArticles();
		});

		// Refresh button
		const refreshBtn = feedRow.createEl("button", {
			cls: "hd-refresh-btn",
			attr: { "aria-label": "Refresh database" },
		});
		refreshBtn.textContent = "\u21bb";
		refreshBtn.addEventListener("click", () => {
			void this.plugin.refreshDb().then(() => {
				this.renderView();
			});
		});

		// Search
		const searchInput = toolbar.createEl("input", {
			type: "search",
			placeholder: "Search articles...",
			cls: "hd-search-input",
			value: this.searchQuery,
		});
		let debounceTimer: ReturnType<typeof setTimeout>;
		searchInput.addEventListener("input", () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.searchQuery = searchInput.value;
				this.loadArticles();
			}, 300);
		});
	}

	private loadArticles(): void {
		if (!this.listEl) return;
		this.listEl.empty();

		if (!this.plugin.db?.isOpen) {
			this.listEl.createDiv({
				text: "Open settings to configure database path",
				cls: "hd-empty",
			});
			return;
		}

		this.articles = this.plugin.db.getArticles({
			filter: this.currentFilter,
			feedName: this.currentFeed || undefined,
			search: this.searchQuery || undefined,
			limit: 200,
		});

		if (this.articles.length === 0) {
			this.listEl.createDiv({
				text: "No articles found",
				cls: "hd-empty",
			});
			return;
		}

		for (const article of this.articles) {
			this.renderArticleItem(this.listEl, article);
		}
	}

	private renderArticleItem(
		container: HTMLElement,
		article: Article,
	): void {
		const item = container.createDiv({ cls: "hd-article-item" });

		if (!article.is_read) {
			item.addClass("hd-unread");
		}

		// Title row
		const titleRow = item.createDiv({ cls: "hd-article-title-row" });
		if (article.is_bookmarked) {
			titleRow.createSpan({
				text: "\u2605 ",
				cls: "hd-bookmark-icon",
			});
		}
		titleRow.createSpan({
			text: article.title,
			cls: "hd-article-title",
		});

		// Meta row
		item.createDiv({
			cls: "hd-article-meta",
			text: `${article.feed_name} \u00b7 ${formatDate(article.published_at)}`,
		});

		// Description preview
		if (article.description) {
			const desc =
				article.description.length > 120
					? article.description.slice(0, 120) + "..."
					: article.description;
			item.createDiv({ cls: "hd-article-desc", text: desc });
		}

		// Insight badge
		if (article.insight) {
			item.createDiv({ cls: "hd-insight-badge", text: "AI" });
		}

		// Click to open note
		item.addEventListener("click", () => {
			void this.openArticleNote(article);
		});
	}

	private async openArticleNote(article: Article): Promise<void> {
		try {
			const bookmarkTags =
				this.plugin.db?.getBookmarkTags(article.id) ?? [];
			const bookmark = this.plugin.db?.getBookmarkData(article.id);
			const filePath =
				await this.plugin.noteCreator.createOrOpenArticleNote(
					article,
					bookmarkTags.length > 0 ? bookmarkTags : undefined,
					bookmark?.memo,
				);

			if (filePath) {
				const file =
					this.app.vault.getAbstractFileByPath(filePath);
				if (file instanceof TFile) {
					await this.app.workspace
						.getLeaf(false)
						.openFile(file);
				}
			}
		} catch (e) {
			new Notice(`Failed to open article: ${e}`);
		}
	}

	refreshArticles(): void {
		if (this.listEl) {
			this.loadArticles();
		}
	}
}
