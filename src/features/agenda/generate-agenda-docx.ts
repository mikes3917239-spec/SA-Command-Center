import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  BorderStyle,
  Footer,
  ShadingType,
} from 'docx';
import type { Agenda, TeamMember } from '@/types';
import { fetchLogoAsArrayBuffer } from '@/utils/logo';
import { downloadBlob, makeFileName } from '@/utils/download';

const EMERALD = '10B981';
const EMERALD_RGB = { red: 16, green: 185, blue: 129 };

function cellBorder() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  return { top: border, bottom: border, left: border, right: border };
}

function headerCell(text: string, width?: number) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorder(),
    shading: {
      type: ShadingType.SOLID,
      color: EMERALD,
      fill: EMERALD,
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: true, size: 20, font: 'Calibri', color: 'FFFFFF' }),
        ],
      }),
    ],
  });
}

function dataCell(text: string, width?: number) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorder(),
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, font: 'Calibri' })],
      }),
    ],
  });
}

function buildTeamTable(members: TeamMember[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell('Name', 30),
          headerCell('Role', 35),
          headerCell('Email', 35),
        ],
      }),
      ...members.map(
        (m) =>
          new TableRow({
            children: [dataCell(m.name, 30), dataCell(m.role, 35), dataCell(m.email, 35)],
          })
      ),
    ],
  });
}

export async function generateAgendaDocx(agenda: Agenda) {
  const logoBuffer = await fetchLogoAsArrayBuffer();
  const title = agenda.title || `NetSuite Software Demonstration for ${agenda.customerName}`;

  let dateDisplay = '';
  if (agenda.dateTime) {
    const dateStr = new Date(agenda.dateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const tzLabel = agenda.timezone.replace('America/', '').replace('Pacific/', '').replace('_', ' ');
    dateDisplay = `${dateStr} (${tzLabel})`;
  }

  const children: Paragraph[] | (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: title, bold: true, size: 36, font: 'Calibri' }),
      ],
    })
  );

  // Date
  if (dateDisplay) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({ text: dateDisplay, size: 22, font: 'Calibri', color: '6B7280' }),
        ],
      })
    );
  }

  // Customer Team
  if (agenda.customerTeam.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: `${agenda.customerName} Team`,
            bold: true,
            size: 24,
            font: 'Calibri',
            color: EMERALD,
          }),
        ],
      })
    );
    children.push(buildTeamTable(agenda.customerTeam) as unknown as Paragraph);
  }

  // NetSuite Team
  if (agenda.netsuiteTeam.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: 'NetSuite Team',
            bold: true,
            size: 24,
            font: 'Calibri',
            color: EMERALD,
          }),
        ],
      })
    );
    children.push(buildTeamTable(agenda.netsuiteTeam) as unknown as Paragraph);
  }

  // Agenda sections
  const enabledSections = agenda.sections.filter((s) => s.enabled);
  if (enabledSections.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: 'Agenda',
            bold: true,
            size: 24,
            font: 'Calibri',
            color: EMERALD,
          }),
        ],
      })
    );

    const agendaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [headerCell('Time', 20), headerCell('Topic', 80)],
        }),
        ...enabledSections.map((section) => {
          const topicChildren: TextRun[] = [
            new TextRun({ text: section.title, bold: true, size: 20, font: 'Calibri' }),
          ];
          const subItems = section.subItems.filter((s) => s.trim());
          for (const item of subItems) {
            topicChildren.push(
              new TextRun({ text: `\n    \u2022 ${item}`, size: 20, font: 'Calibri' })
            );
          }

          return new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                borders: cellBorder(),
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: section.timeSlot || `${section.duration} min`,
                        size: 20,
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                borders: cellBorder(),
                children: [
                  new Paragraph({
                    children: topicChildren,
                  }),
                ],
              }),
            ],
          });
        }),
      ],
    });

    children.push(agendaTable as unknown as Paragraph);
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
        children: children as Paragraph[],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const slug = agenda.customerName || 'Agenda';
  downloadBlob(blob, makeFileName('Agenda', slug, 'docx'));
}
