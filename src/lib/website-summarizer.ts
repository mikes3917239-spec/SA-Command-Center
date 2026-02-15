const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export interface WebsiteSummary {
  title: string;
  description: string;
  headings: string[];
  textContent: string;
}

export async function fetchWebsiteSummary(url: string): Promise<WebsiteSummary> {
  // Ensure URL has protocol
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  const response = await fetch(`${CORS_PROXY}${encodeURIComponent(fullUrl)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.statusText}`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract title
  const title =
    doc.querySelector('title')?.textContent?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
    '';

  // Extract meta description
  const description =
    doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
    '';

  // Extract headings (h1-h3) for structure
  const headings: string[] = [];
  doc.querySelectorAll('h1, h2, h3').forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && text.length < 200) {
      headings.push(text);
    }
  });

  // Extract main text content
  // Remove scripts, styles, navs, footers
  doc.querySelectorAll('script, style, nav, footer, header, aside, iframe, noscript').forEach((el) => el.remove());

  const body = doc.querySelector('main') || doc.querySelector('article') || doc.body;
  const rawText = body?.textContent || '';

  // Clean up whitespace and limit length
  const textContent = rawText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  return {
    title,
    description,
    headings: headings.slice(0, 15),
    textContent,
  };
}

export function formatSummaryAsBlocks(summary: WebsiteSummary) {
  const blocks: Array<{
    id: string;
    type: string;
    props: Record<string, unknown>;
    content: Array<{ type: string; text: string; styles: Record<string, never> }>;
    children: never[];
  }> = [];

  const defaultProps = { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' };

  // Website title
  if (summary.title) {
    blocks.push({
      id: `ws-title-${Date.now()}`,
      type: 'paragraph',
      props: defaultProps,
      content: [{ type: 'text', text: `Company: ${summary.title}`, styles: {} }],
      children: [],
    });
  }

  // Description
  if (summary.description) {
    blocks.push({
      id: `ws-desc-${Date.now()}`,
      type: 'paragraph',
      props: defaultProps,
      content: [{ type: 'text', text: summary.description, styles: {} }],
      children: [],
    });
  }

  // Key sections from headings
  if (summary.headings.length > 0) {
    blocks.push({
      id: `ws-sections-heading-${Date.now()}`,
      type: 'paragraph',
      props: defaultProps,
      content: [{ type: 'text', text: '', styles: {} }],
      children: [],
    });

    blocks.push({
      id: `ws-sections-label-${Date.now()}`,
      type: 'paragraph',
      props: defaultProps,
      content: [{ type: 'text', text: 'Key Sections:', styles: {} }],
      children: [],
    });

    summary.headings.forEach((heading, i) => {
      blocks.push({
        id: `ws-heading-${i}-${Date.now()}`,
        type: 'bulletListItem',
        props: defaultProps,
        content: [{ type: 'text', text: heading, styles: {} }],
        children: [],
      });
    });
  }

  // Excerpt
  if (summary.textContent) {
    const excerpt = summary.textContent.slice(0, 1000);
    blocks.push({
      id: `ws-excerpt-spacer-${Date.now()}`,
      type: 'paragraph',
      props: defaultProps,
      content: [{ type: 'text', text: '', styles: {} }],
      children: [],
    });
    blocks.push({
      id: `ws-excerpt-label-${Date.now()}`,
      type: 'paragraph',
      props: defaultProps,
      content: [{ type: 'text', text: 'Content Excerpt:', styles: {} }],
      children: [],
    });
    blocks.push({
      id: `ws-excerpt-${Date.now()}`,
      type: 'paragraph',
      props: defaultProps,
      content: [{ type: 'text', text: excerpt + (summary.textContent.length > 1000 ? '...' : ''), styles: {} }],
      children: [],
    });
  }

  return blocks;
}
