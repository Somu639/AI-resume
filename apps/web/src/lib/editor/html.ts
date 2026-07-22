/** Convert TipTap/HTML content to plain text for ATS scoring. */
export function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h1|h2|h3|li)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.innerText || el.textContent || "").trim();
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
