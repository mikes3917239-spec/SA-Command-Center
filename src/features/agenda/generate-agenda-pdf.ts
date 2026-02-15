import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Agenda } from '@/types';

export function generateAgendaPdf(agenda: Agenda) {
  const doc = new jsPDF({ format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = agenda.title || `NetSuite Software Demonstration for ${agenda.customerName}`;
  doc.text(title, pageWidth / 2, 25, { align: 'center' });

  // Date line
  if (agenda.dateTime) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(agenda.dateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const tzLabel = agenda.timezone.replace('America/', '').replace('Pacific/', '').replace('_', ' ');
    doc.text(`${dateStr} (${tzLabel})`, pageWidth / 2, 33, { align: 'center' });
  }

  let startY = 42;

  // Customer Team table
  if (agenda.customerTeam.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${agenda.customerName} Team`, 14, startY);
    startY += 3;

    autoTable(doc, {
      startY,
      head: [['Name', 'Role', 'Email']],
      body: agenda.customerTeam.map((m) => [m.name, m.role, m.email]),
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      theme: 'grid',
    });

    startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // NetSuite Team table
  if (agenda.netsuiteTeam.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NetSuite Team', 14, startY);
    startY += 3;

    autoTable(doc, {
      startY,
      head: [['Name', 'Role', 'Email']],
      body: agenda.netsuiteTeam.map((m) => [m.name, m.role, m.email]),
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      theme: 'grid',
    });

    startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Agenda table
  const enabledSections = agenda.sections.filter((s) => s.enabled);
  if (enabledSections.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Agenda', 14, startY);
    startY += 3;

    const rows = enabledSections.map((section) => {
      const topicLines = [section.title];
      section.subItems.forEach((item) => {
        if (item.trim()) topicLines.push(`    \u2022 ${item}`);
      });
      return [
        section.timeSlot || `${section.duration} min`,
        topicLines.join('\n'),
      ];
    });

    autoTable(doc, {
      startY,
      head: [['Time', 'Topic']],
      body: rows,
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 35, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      styles: { fontSize: 10, cellPadding: 4, overflow: 'linebreak' },
      theme: 'grid',
    });
  }

  const customerSlug = agenda.customerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Agenda';
  doc.save(`Agenda - ${customerSlug}.pdf`);
}
