import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote",
    "ul", "ol", "li", "pre", "code", "em", "strong", "del", "s", "sub", "sup",
    "a", "img", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "details", "summary", "kbd",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["align"],
    td: ["align"],
    ol: ["start"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }, true),
  },
};

export function sanitizeBodyHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
