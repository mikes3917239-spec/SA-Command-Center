import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  BorderStyle,
  Footer,
  ShadingType,
} from 'docx';
import type { Note } from '@/types';
import { NOTE_TYPES } from '@/types';
import { fetchLogoAsArrayBuffer } from '@/utils/logo';
import { downloadBlob, makeFileName } from '@/utils/download';

const EMERALD = '10B981';

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: none, bottom: none, left: none, right: none };
}

export async function generateNoteDocx(note: Note) {
  const logoBuffer = await fetchLogoAsArrayBuffer();

  // Metadata table rows
  const typeLabel = NOTE_TYPES.find((t) => t.value === note.type)?.label || note.type;
  const metaRows: [string, string][] = [
    ['Type', typeLabel],
  ];
  if (note.customer) metaRows.push(['Customer', note.customer]);
  if (note.opportunity) metaRows.push(['Opportunity', note.opportunity]);
  if (note.tags.length > 0) metaRows.push(['Tags', note.tags.join(', ')]);

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: metaRows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: noBorders(),
              shading: { type: ShadingType.SOLID, color: 'F3F4F6', fill: 'F3F4F6' },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, size: 20, font: 'Calibri' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              borders: noBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value, size: 20, font: 'Calibri' })],
                }),
              ],
            }),
          ],
        })
    ),
  });

  // Build section content
  const sectionParagraphs: Paragraph[] = [];
  for (const section of note.sections) {
    // Section heading
    sectionParagraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 26,
            font: 'Calibri',
            color: EMERALD,
          }),
        ],
      })
    );

    // Bullets
    for (const bullet of section.bullets) {
      if (!bullet.text.trim()) continue;
      sectionParagraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `\u2022  ${bullet.text}`, bold: true, size: 20, font: 'Calibri' }),
          ],
        })
      );
      if (bullet.notes.trim()) {
        sectionParagraphs.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: bullet.notes, size: 18, font: 'Calibri', color: '6B7280' }),
            ],
          })
        );
      }
    }

    // Freeform content
    if (section.content.trim()) {
      for (const line of section.content.split('\n')) {
        sectionParagraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: line, size: 20, font: 'Calibri' })],
          })
        );
      }
    }
  }

  // Attachments list
  const attachmentParagraphs: Paragraph[] = [];
  if (note.attachments && note.attachments.length > 0) {
    attachmentParagraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: 'Attachments',
            bold: true,
            size: 26,
            font: 'Calibri',
            color: EMERALD,
          }),
        ],
      })
    );
    for (const att of note.attachments) {
      attachmentParagraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `\u2022  ${att.name}`, size: 20, font: 'Calibri' }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        headers: {
          default: {
            options: {
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new ImageRun({
                      data: logoBuffer,
                      transformation: { width: 28, height: 28 },
                      type: 'png',
                    }),
                    new TextRun({ text: '   SA Command Center', size: 18, font: 'Calibri', color: '9CA3AF' }),
                  ],
                }),
              ],
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                    size: 16,
                    font: 'Calibri',
                    color: '9CA3AF',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: note.title || 'Untitled Note',
                bold: true,
                size: 36,
                font: 'Calibri',
              }),
            ],
          }),
          // Metadata
          metaTable,
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          // Sections
          ...sectionParagraphs,
          // Attachments
          ...attachmentParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, makeFileName('Note', note.title || 'untitled', 'docx'));
}
