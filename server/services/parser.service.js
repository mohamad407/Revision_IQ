// Import the library file directly: pdf-parse's index.js runs a debug routine
// (reads ./test/data/*.pdf) when loaded under some ESM/bundler setups, which
// crashes the server on boot.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { ocrPdf } from './ai.service.js';
import { HttpError } from '../utils/errors.js';

const MAX_PAGES = 150; // stops decompression-bomb / huge-document DoS
const MAX_TEXT_CHARS = 400_000; // keeps Mongo documents far below the 16MB limit

// Extracts plain text (and page count) from a PDF buffer.
export async function extractPdfText(buffer) {
  const result = await pdfParse(buffer, { max: MAX_PAGES });
  const text = (result.text || '').trim().slice(0, MAX_TEXT_CHARS);
  return { text, pages: result.numpages || 0 };
}

const MIN_TEXT_CHARS = 150; // below this a PDF is treated as scanned (images, no text layer)

/**
 * Reads a PDF. If it has no real text layer (a scan), falls back to AI vision (OCR)
 * for the first pages. Returns { text, pages, ocr }.
 */
export async function extractPdfWithOcr(buffer) {
  let text = '';
  let pages = 0;
  try {
    ({ text, pages } = await extractPdfText(buffer));
  } catch {
    // The text parser choked (common with scans / odd encoders). Try AI vision instead.
  }
  if (text.length >= MIN_TEXT_CHARS) return { text, pages, ocr: false };

  const ocrText = (await ocrPdf(buffer, pages)).slice(0, MAX_TEXT_CHARS);
  if (ocrText.length < 50) {
    throw new HttpError(422, 'No readable text was found in this PDF.');
  }
  return { text: ocrText, pages, ocr: true };
}
