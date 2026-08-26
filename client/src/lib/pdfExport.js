import { jsPDF } from 'jspdf';

const MARGIN = 15;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const STAGE_LABELS = { cat1: 'CAT-1', cat2: 'CAT-2', fat: 'FAT' };

function newDoc() {
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

function addHeader(doc, title, subject) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, MARGIN, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(subject, MARGIN, 27);
  doc.setTextColor(0);
  doc.setDrawColor(220);
  doc.line(MARGIN, 31, PAGE_WIDTH - MARGIN, 31);
  return 40;
}

// Writes wrapped text starting at (x, y), returns the new y, adding pages as needed.
function writeWrapped(doc, text, x, y, options = {}) {
  const { fontSize = 11, bold = false, maxWidth = CONTENT_WIDTH, lineHeight = 5.2 } = options;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export function exportModelPaperPdf(session) {
  const doc = newDoc();
  let y = addHeader(doc, 'Model Paper', session.subject);

  const stages = ['cat1', 'cat2', 'fat'].filter((s) => session.modelPaper?.[s]?.length);

  if (stages.length === 0) return;

  stages.forEach((stage, stageIdx) => {
    if (stageIdx > 0) {
      doc.addPage();
      y = 20;
    }
    y = writeWrapped(doc, STAGE_LABELS[stage], MARGIN, y, { fontSize: 14, bold: true });
    y += 3;

    session.modelPaper[stage].forEach((q) => {
      y = writeWrapped(doc, `${q.number}. ${q.question}`, MARGIN, y, { fontSize: 11 });
      y = writeWrapped(doc, `[${q.marks} marks]`, MARGIN, y, { fontSize: 9 });
      y += 4;
    });
  });

  doc.save(`${session.subject.replace(/\s+/g, '_')}_model_paper.pdf`);
}

export function exportImportantTopicsPdf(session) {
  const doc = newDoc();
  let y = addHeader(doc, 'Important Topics & Model Answers', session.subject);

  (session.importantTopics || []).forEach((t, i) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    y = writeWrapped(doc, `${i + 1}. ${t.topic}  (${t.importance} priority)`, MARGIN, y, {
      fontSize: 12,
      bold: true,
    });
    if (t.summary) {
      y = writeWrapped(doc, t.summary, MARGIN, y, { fontSize: 9 });
    }
    y += 1;
    y = writeWrapped(doc, t.modelAnswer, MARGIN, y, { fontSize: 10.5 });
    y += 6;
  });

  doc.save(`${session.subject.replace(/\s+/g, '_')}_important_topics.pdf`);
}

export function exportPredictionsPdf(session) {
  const doc = newDoc();
  let y = addHeader(doc, 'Predicted Questions', session.subject);

  const stages = ['cat1', 'cat2', 'fat'].filter((s) => session.predictions?.[s]?.length);
  if (stages.length === 0) return;

  stages.forEach((stage) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    y = writeWrapped(doc, STAGE_LABELS[stage], MARGIN, y, { fontSize: 14, bold: true });
    y += 2;

    session.predictions[stage].forEach((q, i) => {
      y = writeWrapped(doc, `${i + 1}. ${q.question}`, MARGIN, y, { fontSize: 11 });
      y = writeWrapped(doc, `Topic: ${q.topic} · Likelihood: ${q.likelihood}`, MARGIN, y, {
        fontSize: 9,
      });
      if (q.reasoning) {
        y = writeWrapped(doc, q.reasoning, MARGIN, y, { fontSize: 9 });
      }
      y += 4;
    });
  });

  doc.save(`${session.subject.replace(/\s+/g, '_')}_predicted_questions.pdf`);
}
