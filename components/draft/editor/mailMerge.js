// Real mail-merge substitution over a TipTap contentJson tree — {{Field}}
// tokens already present in the document (or the accompanying message) are
// replaced per-recipient using real Case Diary/team data, never fabricated
// values. Unmatched fields are left as-is rather than silently blanked, so
// a typo in a field name is visible instead of disappearing.
export function detectMergeFields(text) {
  const found = new Set();
  const re = /\{\{(\w+)\}\}/g;
  let match = re.exec(text);
  while (match) {
    found.add(match[1]);
    match = re.exec(text);
  }
  return Array.from(found);
}

export function mergeText(text, values) {
  return (text || "").replace(/\{\{(\w+)\}\}/g, (whole, key) => (values[key] !== undefined ? values[key] : whole));
}

export function mergeContentJson(node, values) {
  if (!node) return node;
  const clone = { ...node };
  if (node.type === "text") clone.text = mergeText(node.text, values);
  if (node.content) clone.content = node.content.map((child) => mergeContentJson(child, values));
  return clone;
}

export function valuesForTeamMember(member) {
  return { Name: member.name, Role: member.role };
}

export function valuesForClient(client) {
  return { ClientName: client.name, Name: client.name, ClientPhone: client.phone || "", ClientAddress: client.address || "" };
}
