import { Notice, Plugin } from "obsidian";
import { DatabaseReader } from "./db";
import { NoteCreator } from "./services/note-creator";
import { HawaiiDiscoSettingTab } from "./settings";
import { DEFAULT_SETTINGS, HawaiiDiscoSettings } from "./types";
import {
	ArticleListView,
	VIEW_TYPE_ARTICLE_LIST,
} from "./views/article-list-view";
import { DigestView, VIEW_TYPE_DIGEST } from "./views/digest-view";

export default class HawaiiDiscoPlugin extends Plugin {
	settings: HawaiiDiscoSettings = DEFAULT_SETTINGS;
	db: DatabaseReader | null = null;
	noteCreator!: NoteCreator;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.noteCreator = new NoteCreator(this.app, this.settings);

		// Resolve WASM path inside plugin directory
		const adapter = this.app.vault.adapter as any;
		const basePath: string = adapter.getBasePath?.() ?? "";
		const pluginDir = require("path").join(
			basePath,
			".obsidian",
			"plugins",
			"hawaiidisco",
		);
		const wasmPath = require("path").join(pluginDir, "sql-wasm.wasm");

		this.db = new DatabaseReader(wasmPath);

		// Register views
		this.registerView(
			VIEW_TYPE_ARTICLE_LIST,
			(leaf) => new ArticleListView(leaf, this),
		);
		this.registerView(
			VIEW_TYPE_DIGEST,
			(leaf) => new DigestView(leaf, this),
		);

		// Ribbon icon
		this.addRibbonIcon("rss", "Hawaii Disco", () =>
			this.activateArticleList(),
		);

		// Commands
		this.addCommand({
			id: "open-article-list",
			name: "Open article list",
			callback: () => this.activateArticleList(),
		});

		this.addCommand({
			id: "open-digest",
			name: "Open digest view",
			callback: () => this.activateDigest(),
		});

		this.addCommand({
			id: "refresh-database",
			name: "Refresh database",
			callback: () => this.refreshDb(),
		});

		// Settings tab
		this.addSettingTab(new HawaiiDiscoSettingTab(this.app, this));

		// Initial DB load
		try {
			await this.db.open(this.settings.dbPath);
		} catch (e) {
			console.warn("Hawaii Disco: Could not open DB on startup:", e);
		}
	}

	async onunload(): Promise<void> {
		this.db?.close();
	}

	async refreshDb(): Promise<void> {
		if (!this.db) return;
		await this.db.reload(this.settings.dbPath);

		for (const leaf of this.app.workspace.getLeavesOfType(
			VIEW_TYPE_ARTICLE_LIST,
		)) {
			(leaf.view as ArticleListView).refreshArticles();
		}

		new Notice("Hawaii Disco: Database refreshed");
	}

	async activateArticleList(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_ARTICLE_LIST)[0];
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_ARTICLE_LIST,
					active: true,
				});
				leaf = rightLeaf;
			}
		}
		if (leaf) workspace.revealLeaf(leaf);
	}

	async activateDigest(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_DIGEST)[0];
		if (!leaf) {
			const newLeaf = workspace.getLeaf(true);
			await newLeaf.setViewState({
				type: VIEW_TYPE_DIGEST,
				active: true,
			});
			leaf = newLeaf;
		}
		if (leaf) workspace.revealLeaf(leaf);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.noteCreator.updateSettings(this.settings);
	}
}
