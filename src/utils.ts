export function slugify(text: string, maxLen = 50): string {
	let slug = text.trim().replace(/\s+/g, "-");
	// Keep word chars, Korean, and hyphens
	slug = slug.replace(/[^\w\u3131-\uD79D-]/g, "");
	return slug.slice(0, maxLen) || "untitled";
}

export function escapeYaml(text: string): string {
	return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function sanitizeFeedName(name: string): string {
	return (
		name
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^\w\u3131-\uD79D-]/g, "") || "unknown"
	);
}

export function formatDate(dateStr: string | null): string {
	if (!dateStr) return "unknown";
	return dateStr.slice(0, 10);
}
