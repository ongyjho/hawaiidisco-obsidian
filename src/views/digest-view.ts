import { ItemView, MarkdownRenderer, Notice, WorkspaceLeaf } from "obsidian";
import type HawaiiDiscoPlugin from "../main";
import { Digest } from "../types";
import { generateDigest } from "../services/digest-generator";

export const VIEW_TYPE_DIGEST = "hawaiidisco-digest";

type DigestMode = "cached" | "generate";

export class DigestView extends ItemView {
	private plugin: HawaiiDiscoPlugin;
	private mode: DigestMode = "cached";
	private isGenerating = false;

	constructor(leaf: WorkspaceLeaf, plugin: HawaiiDiscoPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_DIGEST;
	}

	getDisplayText(): string {
		return "Hawaii Disco Digest";
	}

	getIcon(): string {
		return "newspaper";
	}

	async onOpen(): Promise<void> {
		this.renderView();
	}

	async onClose(): Promise<void> {
		// cleanup
	}

	private renderView(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass("hd-container");

		// Mode toggle
		const modeBar = container.createDiv({ cls: "hd-digest-mode-bar" });
		this.renderModeToggle(modeBar);

		// Content area
		const content = container.createDiv({ cls: "hd-digest-content" });

		if (this.mode === "cached") {
			this.renderCachedDigests(content);
		} else {
			this.renderGenerateForm(content);
		}
	}

	private renderModeToggle(container: HTMLElement): void {
		const modes: { label: string; value: DigestMode }[] = [
			{ label: "Cached Digests", value: "cached" },
			{ label: "Generate New", value: "generate" },
		];

		for (const m of modes) {
			const btn = container.createEl("button", {
				text: m.label,
				cls: `hd-mode-btn${m.value === this.mode ? " hd-mode-active" : ""}`,
			});
			btn.addEventListener("click", () => {
				this.mode = m.value;
				this.renderView();
			});
		}
	}

	private renderCachedDigests(container: HTMLElement): void {
		if (!this.plugin.db?.isOpen) {
			container.createDiv({
				text: "Database not connected",
				cls: "hd-empty",
			});
			return;
		}

		const digests = this.plugin.db.getDigests();

		if (digests.length === 0) {
			container.createDiv({
				text: "No cached digests found. Generate one or run Hawaii Disco to create a digest.",
				cls: "hd-empty",
			});
			return;
		}

		for (const digest of digests) {
			this.renderDigestCard(container, digest);
		}
	}

	private renderDigestCard(container: HTMLElement, digest: Digest): void {
		const card = container.createDiv({ cls: "hd-digest-card" });

		// Header
		const header = card.createDiv({ cls: "hd-digest-card-header" });
		const dateStr = digest.created_at?.slice(0, 10) ?? "unknown";
		header.createSpan({
			text: `${dateStr} \u00b7 ${digest.article_count} articles \u00b7 ${digest.period_days}d`,
			cls: "hd-digest-meta",
		});

		// Save button
		const saveBtn = header.createEl("button", {
			text: "Save as Note",
			cls: "hd-save-btn",
		});
		saveBtn.addEventListener("click", async () => {
			try {
				const filePath =
					await this.plugin.noteCreator.createDigestNote({
						content: digest.content,
						article_count: digest.article_count,
						period_days: digest.period_days,
					});
				new Notice(`Digest saved: ${filePath}`);
			} catch (e) {
				new Notice(`Failed to save digest: ${e}`);
			}
		});

		// Content (rendered as markdown)
		const body = card.createDiv({ cls: "hd-digest-body" });
		MarkdownRenderer.render(
			this.app,
			digest.content,
			body,
			"",
			this.plugin,
		);
	}

	private renderGenerateForm(container: HTMLElement): void {
		if (!this.plugin.settings.anthropicApiKey) {
			container.createDiv({
				text: "Configure your Anthropic API key in Settings to generate digests.",
				cls: "hd-empty",
			});
			return;
		}

		if (!this.plugin.db?.isOpen) {
			container.createDiv({
				text: "Database not connected",
				cls: "hd-empty",
			});
			return;
		}

		const form = container.createDiv({ cls: "hd-generate-form" });

		// Period days
		const periodRow = form.createDiv({ cls: "hd-form-row" });
		periodRow.createSpan({ text: "Period (days): " });
		const periodInput = periodRow.createEl("input", {
			type: "number",
			value: String(this.plugin.settings.periodDays),
			cls: "hd-form-input",
		});

		// Max articles
		const maxRow = form.createDiv({ cls: "hd-form-row" });
		maxRow.createSpan({ text: "Max articles: " });
		const maxInput = maxRow.createEl("input", {
			type: "number",
			value: String(this.plugin.settings.maxArticles),
			cls: "hd-form-input",
		});

		// Generate button
		const generateBtn = form.createEl("button", {
			text: "Generate Digest",
			cls: "hd-generate-btn",
		});

		// Result area
		const resultArea = container.createDiv({ cls: "hd-generate-result" });

		generateBtn.addEventListener("click", async () => {
			if (this.isGenerating) return;

			const periodDays = parseInt(periodInput.value, 10) || 7;
			const maxArticles = parseInt(maxInput.value, 10) || 20;

			this.isGenerating = true;
			generateBtn.textContent = "Generating...";
			generateBtn.disabled = true;
			resultArea.empty();

			try {
				const articles = this.plugin.db!.getRecentArticles(
					periodDays,
					maxArticles,
				);

				if (articles.length === 0) {
					resultArea.createDiv({
						text: `No articles found in the last ${periodDays} days`,
						cls: "hd-empty",
					});
					return;
				}

				resultArea.createDiv({
					text: `Generating digest from ${articles.length} articles...`,
					cls: "hd-loading",
				});

				const content = await generateDigest(
					articles,
					this.plugin.settings,
					periodDays,
				);

				resultArea.empty();

				// Save as Note button
				const saveRow = resultArea.createDiv({
					cls: "hd-digest-card-header",
				});
				saveRow.createSpan({
					text: `${articles.length} articles \u00b7 ${periodDays} days`,
					cls: "hd-digest-meta",
				});
				const saveBtn = saveRow.createEl("button", {
					text: "Save as Note",
					cls: "hd-save-btn",
				});
				saveBtn.addEventListener("click", async () => {
					try {
						const filePath =
							await this.plugin.noteCreator.createDigestNote({
								content,
								article_count: articles.length,
								period_days: periodDays,
							});
						new Notice(`Digest saved: ${filePath}`);
					} catch (e) {
						new Notice(`Failed to save: ${e}`);
					}
				});

				// Rendered markdown
				const body = resultArea.createDiv({
					cls: "hd-digest-body",
				});
				MarkdownRenderer.render(
					this.app,
					content,
					body,
					"",
					this.plugin,
				);
			} catch (e) {
				resultArea.empty();
				resultArea.createDiv({
					text: `Error: ${e}`,
					cls: "hd-status-error",
				});
			} finally {
				this.isGenerating = false;
				generateBtn.textContent = "Generate Digest";
				generateBtn.disabled = false;
			}
		});
	}
}
