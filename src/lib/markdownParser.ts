import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import type { HeadingItem } from '@/types/editor'; // Import type definition

// Type definition for the return value of the parser function
interface ParseResult {
  html: string;
  headings: HeadingItem[];
}

/**
 * Generates a URL-friendly slug from a text string.
 * Basic implementation: converts to lowercase, replaces spaces with hyphens,
 * removes non-alphanumeric characters (except hyphens).
 * @param text - The input text.
 * @returns The generated slug.
 */
const slugify = (text: string): string => {
  // Remove HTML tags before slugifying
  const plainText = text.replace(/<[^>]*>/g, '').trim();
  return plainText
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, '') // Remove non-letter/number/mark/hyphen chars (Unicode aware)
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
};

/**
 * Configures and returns a Markdown parsing function using 'marked'.
 * This function parses Markdown to HTML, sanitizes the HTML,
 * applies syntax highlighting to code blocks, adds IDs to headings,
 * and extracts a list of headings for TOC generation.
 * @returns A function that takes Markdown string and returns ParseResult { html, headings }.
 */
export const configureMarkdownParser = (): ((
  markdown: string
) => ParseResult) => {
  // Array to store extracted headings during parsing
  const headings: HeadingItem[] = [];
  // Counter to prevent duplicate heading IDs
  let headingIdCounts: Record<string, number> = {};

  // Configure marked options
  marked.setOptions({
    // Syntax highlighting function using highlight.js
    highlight: (code: string, lang: string | undefined): string => {
      try {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language, ignoreIllegals: true }).value;
      } catch (e) {
        console.error('Highlight.js error:', e);
        return code; // Return original code on error
      }
    },
    pedantic: false, // Don't be strict about Markdown syntax
    gfm: true, // Enable GitHub Flavored Markdown (tables, strikethrough, etc.)
    breaks: true, // Convert single line breaks to <br>
    smartLists: true, // Use smart list behavior
    smartypants: true, // Use smart quotes, dashes, etc.
    xhtml: false, // Don't output XHTML tags
  });

  // Create a new marked Renderer instance to customize output
  const renderer = new Renderer();

  // --- Customize Heading Rendering ---
  // Override the default heading renderer to add IDs and collect heading info
  renderer.heading = (
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string
  ): string => {
    // Generate a slug for the ID
    const plainText = text.replace(/<[^>]*>/g, '').trim(); // Use plain text for ID
    let slug = slugify(plainText || `heading-${level}`); // Fallback ID if text is empty

    // Handle duplicate slugs by appending a counter
    if (headingIdCounts[slug] !== undefined) {
      headingIdCounts[slug]++;
      slug = `${slug}-${headingIdCounts[slug]}`;
    } else {
      headingIdCounts[slug] = 0; // Initialize counter for this slug
    }

    // Store heading information for TOC
    const headingItem: HeadingItem = {
      id: slug,
      text: plainText || raw,
      level,
    };
    headings.push(headingItem);

    // Return the heading HTML with the generated ID
    // Use raw text for display to preserve inline formatting if any
    return `<h${level} id="${slug}">${text}</h${level}>\n`;
  };

  // --- Customize Other Elements (Optional but Recommended) ---
  // Image rendering with classes and lazy loading
  renderer.image = (href, title, text): string => {
    const cleanHref = DOMPurify.sanitize(href || '');
    const cleanTitle = title ? DOMPurify.sanitize(title) : '';
    const cleanText = DOMPurify.sanitize(text);
    return `<img src="${cleanHref}" alt="${cleanText}" title="${cleanTitle}" class="max-w-full h-auto rounded my-2" loading="lazy" />`;
  };

  // Link rendering with target="_blank" for external links
  renderer.link = (href, title, text): string => {
    const cleanHref = DOMPurify.sanitize(href || '');
    const cleanTitle = title ? DOMPurify.sanitize(title) : '';
    // Text can contain inline elements, sanitize later with DOMPurify on the whole HTML
    const target = /^https?:\/\//.test(cleanHref)
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';
    return `<a href="${cleanHref}" title="${cleanTitle}"${target} class="text-primary hover:underline">${text}</a>`; // Use theme color
  };

  // Table rendering with Tailwind classes
  renderer.table = (header: string, body: string): string => {
    return `<div class="overflow-x-auto my-4 border rounded-md"><table class="min-w-full divide-y divide-border">
            <thead class="bg-muted/50">${header}</thead>
            <tbody class="divide-y divide-border bg-background">${body}</tbody>
        </table></div>`;
  };
  renderer.tablerow = (content: string): string => {
    return `<tr class="hover:bg-muted/50 data-[state=selected]:bg-muted">${content}</tr>`; // Shadcn table row style
  };
  renderer.tablecell = (
    content: string,
    flags: { header: boolean; align: 'center' | 'left' | 'right' | null }
  ): string => {
    const alignClass = flags.align ? `text-${flags.align}` : 'text-left';
    const tag = flags.header ? 'th' : 'td';
    const padding = flags.header ? 'px-4 py-3' : 'px-4 py-2';
    const font = flags.header ? 'font-medium text-muted-foreground' : '';
    return `<${tag} class="${padding} ${alignClass} ${font}">${content}</${tag}>`;
  };

  // Code block rendering (highlight.js handles the content)
  renderer.code = (code: string, language: string | undefined): string => {
    const cleanLanguage = language ? DOMPurify.sanitize(language) : 'plaintext';
    // marked.options.highlight is called internally by marked if set
    // We just provide the structure and language class
    return `<pre><code class="hljs language-${cleanLanguage}">${code}</code></pre>\n`;
  };

  // Use the customized renderer
  marked.use({ renderer });

  // --- Return the Parsing Function ---
  return (markdown: string): ParseResult => {
    // Reset headings and ID counts for each parse
    headings.length = 0;
    headingIdCounts = {};
    try {
      // Parse the Markdown to raw HTML
      const rawHtml = marked.parse(markdown || '');
      // Sanitize the generated HTML using DOMPurify
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true }, // Use standard HTML profile
        ADD_ATTR: ['id', 'target', 'rel', 'loading'], // Allow specific attributes needed
        // ADD_TAGS: [], // Allow specific tags if needed
      });

      return {
        html: typeof sanitizedHtml === 'string' ? sanitizedHtml : '',
        headings: [...headings], // Return a copy of the collected headings
      };
    } catch (e) {
      console.error('Markdown parsing error:', e);
      // Return safe defaults on error
      return {
        html: '<p class="text-destructive">エラー: マークダウンの変換に失敗しました</p>',
        headings: [],
      };
    }
  };
};

// Export the configured parsing function
export const parseMarkdown = configureMarkdownParser();
