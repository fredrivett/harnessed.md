// Company entries are filed with a numeric sort prefix (e.g. "01-openai");
// the public slug is the id with that prefix stripped.
export function slugFromId(id: string): string {
	return id.replace(/^\d+-/, '');
}
