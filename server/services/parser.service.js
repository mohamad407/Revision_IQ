// Import the library file directly: pdf-parse's index.js runs a debug routine
// (reads ./test/data/*.pdf) when loaded under some ESM/bundler setups, which
// crashes the server on boot.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const MAX_PAGES = 150; // stops decompression-bomb / huge-document DoS
const MAX_TEXT_CHARS = 400_000; // keeps Mongo documents far below the 16MB limit

// Extracts plain text (and page count) from a PDF buffer.
export async function extractPdfText(buffer) {
  const result = await pdfParse(buffer, { max: MAX_PAGES });
  const text = (result.text || '').trim().slice(0, MAX_TEXT_CHARS);
  return { text, pages: result.numpages || 0 };
}
