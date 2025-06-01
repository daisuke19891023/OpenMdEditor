import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../markdownParser';

describe('parseMarkdown', () => {
  it('should correctly parse and allow data: URI images', () => {
    const imageName = "My Test Image";
    const imageBase64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const imageDataUri = `data:image/png;base64,${imageBase64Data}`;

    const markdownInput = `![${imageName}](${imageDataUri})`;

    const { html } = parseMarkdown(markdownInput);

    // Expected HTML output for the image
    // <p><img src="data:image/png;base64,..." alt="My Test Image" class="max-w-full h-auto rounded my-2" loading="lazy"></p>
    // Note: marked typically wraps lone images in <p> tags.

    // 1. Check if the img tag is present with the correct src and alt attributes
    expect(html).toContain(`<img src="${imageDataUri}" alt="${imageName}"`);

    // 2. Check for the custom classes and attributes added by our renderer
    expect(html).toContain('class="max-w-full h-auto rounded my-2"');
    expect(html).toContain('loading="lazy"');

    // 3. A more precise check for the whole image tag structure if needed
    const expectedImgTag = `<img src="${imageDataUri}" alt="${imageName}" class="max-w-full h-auto rounded my-2" loading="lazy">`;
    expect(html).toContain(expectedImgTag);

    // 4. Check that the image is wrapped in a paragraph tag as is typical for markdown
    expect(html).toMatch(/<p>.*<\/p>/);
  });

  it('should correctly parse and allow data: URI images with titles', () => {
    const imageName = "Image With Title";
    const imageTitle = "Test Title";
    const imageBase64Data = 'R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='; // 1x1 blue gif
    const imageDataUri = `data:image/gif;base64,${imageBase64Data}`;

    const markdownInput = `![${imageName}](${imageDataUri} "${imageTitle}")`;

    const { html } = parseMarkdown(markdownInput);

    // Expected HTML: <p><img src="data:image/gif;base64,..." alt="Image With Title" title="Test Title" class="..." loading="lazy"></p>
    const expectedImgTag = `<img src="${imageDataUri}" alt="${imageName}" title="${imageTitle}" class="max-w-full h-auto rounded my-2" loading="lazy">`;
    expect(html).toContain(expectedImgTag);
    expect(html).toMatch(/<p>.*<\/p>/);
  });

  // Test to ensure that non-data URI images are still handled correctly
  it('should correctly parse standard http/https URI images', () => {
    const imageName = "HTTP Image";
    const imageUrl = "http://example.com/image.png";

    const markdownInput = `![${imageName}](${imageUrl})`;

    const { html } = parseMarkdown(markdownInput);
    const expectedImgTag = `<img src="${imageUrl}" alt="${imageName}" class="max-w-full h-auto rounded my-2" loading="lazy">`;
    expect(html).toContain(expectedImgTag);
    expect(html).toMatch(/<p>.*<\/p>/);
  });
});
