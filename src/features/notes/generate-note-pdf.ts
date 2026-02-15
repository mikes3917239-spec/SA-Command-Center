import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Note } from '@/types';
import { NOTE_TYPES } from '@/types';
import { fetchLogoAsBase64 } from '@/utils/logo';

export async function generateNotePdf(note: Note) {
  const doc = new jsPDF({ format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo + header
  try {
    const logoBase64 = await fetchLogoAsBase64();
    doc.addImage(logoBase64, 'PNG', 14, 8, 12, 12);
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('SA Command Center', 28, 16);
  } catch {
    // logo fetch failed — skip
  }

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(note.title || 'Untitled Note', 14, 32);

  // Metadata table
  const typeLabel = NOTE_TYPES.find((t) => t.value === note.type)?.label || note.type;
  const metaRows: string[][] = [['Type', typeLabel]];
  if (note.customer) metaRows.push(['Customer', note.customer]);
  if (note.opportunity) metaRows.push(['Opportunity', note.opportunity]);
  if (note.tags.length > 0) metaRows.push(['Tags', note.tags.join(', ')]);

  autoTable(doc, {
    startY: 38,
    body: metaRows,
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', textColor: [107, 114, 128] },
      1: { cellWidth: 'auto' },
    },
    styles: { fontSize: 9, cellPadding: 2 },
    theme: 'plain',
  });

  let startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Sections
  for (const section of note.sections) {
    // Check if we need a new page
    if (startY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      startY = 20;
    }

    // Section heading
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(section.title, 14, startY);
    startY += 6;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Bullets
    for (const bullet of section.bullets) {
      if (!bullet.text.trim()) continue;

      if (startY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        startY = 20;
      }

      // Bullet text (bold)
      doc.setFont('helvetica', 'bold');
      const bulletLines = doc.splitTextToSize(`\u2022  ${bullet.text}`, pageWidth - 32);
      doc.text(bulletLines, 18, startY);
      startY += bulletLines.length * 5;

      // Bullet notes (indented, gray)
      if (bullet.notes.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const noteLines = doc.splitTextToSize(bullet.notes, pageWidth - 42);
        doc.text(noteLines, 24, startY);
        startY += noteLines.length * 4.5;
        doc.setTextColor(0, 0, 0);
      }
      startY += 2;
    }

    // Freeform content
    if (section.content.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(section.content, pageWidth - 32);
      for (const line of lines) {
        if (startY > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          startY = 20;
        }
        doc.text(line, 18, startY);
        startY += 5;
      }
    }

    startY += 6;
  }

  // Attachments
  if (note.attachments && note.attachments.length > 0) {
    if (startY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Attachments', 14, startY);
    startY += 6;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const att of note.attachments) {
      if (startY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        startY = 20;
      }
      doc.text(`\u2022  ${att.name}`, 18, startY);
      startY += 5;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const slug = (note.title || 'untitled').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Note-${slug}.pdf`);
}
