import pdfParse from 'pdf-parse';

// Extracts plain text (and page count) from a PDF buffer.
// Kept deliberately simple for the demo — no OCR, no layout awareness.
export async function extractPdfText(buffer) {
  const result = await pdfParse(buffer);
  return {
    text: result.text?.trim() || '',
    pages: result.numpages || 0,
  };
}
