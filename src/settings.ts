import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type HawaiiDiscoPlugin from "./main";

export class HawaiiDiscoSettingTab extends PluginSettingTab {
	plugin: HawaiiDiscoPlugin;

	constructor(app: App, plugin: HawaiiDiscoPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Database ---
		new Setting(containerEl).setName("Database").setHeading();

		new Setting(containerEl)
			.setName("Database path")
			.setDesc("Path to Hawaii Disco SQLite database")
			.addText((text) =>
				text
					.setPlaceholder(
						"~/.local/share/hawaiidisco/hawaiidisco.db",
					)
					.setValue(this.plugin.settings.dbPath)
					.onChange(async (value) => {
						this.plugin.settings.dbPath = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Test connection")
			.setDesc("Verify the database can be read")
			.addButton((button) =>
				button.setButtonText("Test").onClick(async () => {
					try {
						await this.plugin.refreshDb();
						const count =
							this.plugin.db?.getArticleCount() ?? 0;
						new Notice(
							`Connected! ${count} articles found.`,
						);
					} catch (e) {
						new Notice(`Database error: ${e}`);
					}
				}),
			);

		// --- AI / Digest ---
		new Setting(containerEl).setName("AI / digest generation").setHeading();

		new Setting(containerEl)
			.setName("Anthropic API key")
			.setDesc("Required for generating new digests")
			.addText((text) => {
				text.setPlaceholder("sk-ant-...")
					.setValue(this.plugin.settings.anthropicApiKey)
					.onChange(async (value) => {
						this.plugin.settings.anthropicApiKey = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.type = "password";
			});

		new Setting(containerEl)
			.setName("AI model")
			.setDesc("Anthropic model for digest generation")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(
						"claude-sonnet-4-5-20250929",
						"Claude Sonnet 4.5",
					)
					.addOption(
						"claude-haiku-4-5-20251001",
						"Claude Haiku 4.5",
					)
					.setValue(this.plugin.settings.aiModel)
					.onChange(async (value) => {
						this.plugin.settings.aiModel = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Period days")
			.setDesc("Number of days to include in digest")
			.addText((text) =>
				text
					.setPlaceholder("7")
					.setValue(String(this.plugin.settings.periodDays))
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						if (!isNaN(num) && num > 0) {
							this.plugin.settings.periodDays = num;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName("Max articles")
			.setDesc("Maximum articles to include in digest prompt")
			.addText((text) =>
				text
					.setPlaceholder("20")
					.setValue(String(this.plugin.settings.maxArticles))
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						if (!isNaN(num) && num > 0) {
							this.plugin.settings.maxArticles = num;
							await this.plugin.saveSettings();
						}
					}),
			);

		// --- Notes ---
		new Setting(containerEl).setName("Notes").setHeading();

		new Setting(containerEl)
			.setName("Notes folder")
			.setDesc("Folder in vault for Hawaii Disco notes")
			.addText((text) =>
				text
					.setPlaceholder("hawaii-disco")
					.setValue(this.plugin.settings.notesFolder)
					.onChange(async (value) => {
						this.plugin.settings.notesFolder = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Tags prefix")
			.setDesc("Prefix for tags on created notes")
			.addText((text) =>
				text
					.setPlaceholder("hawaiidisco")
					.setValue(this.plugin.settings.tagsPrefix)
					.onChange(async (value) => {
						this.plugin.settings.tagsPrefix = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Include AI insight")
			.setDesc("Include AI insight section in article notes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeInsight)
					.onChange(async (value) => {
						this.plugin.settings.includeInsight = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Include translation")
			.setDesc("Include translation section in article notes")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeTranslation)
					.onChange(async (value) => {
						this.plugin.settings.includeTranslation = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
