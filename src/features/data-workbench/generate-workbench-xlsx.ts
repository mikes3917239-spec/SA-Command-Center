import ExcelJS from 'exceljs';
import type { ColumnProfile, FieldMapping, NetSuiteRecordType, ValidationIssue } from '@/types';
import { downloadBlob, makeFileName } from '@/utils/download';
import { buildExportData } from './export-generator';

const EMERALD_HEX = '10B981';
const AMBER_HEX = 'F59E0B';
const RED_HEX = 'EF4444';

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${EMERALD_HEX}` },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
  });
}

export async function generateWorkbenchXlsx(
  rows: Record<string, string>[],
  mappings: FieldMapping[],
  recordType: NetSuiteRecordType,
  profiles: ColumnProfile[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SA Command Center';
  workbook.created = new Date();

  const { outputHeaders, outputRows, issues } = buildExportData(rows, mappings, recordType);

  // ── Sheet 1: Data Profile ──
  const profileSheet = workbook.addWorksheet('Data Profile');
  profileSheet.columns = [
    { header: 'Column', key: 'name', width: 22 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Non-Null', key: 'nonNull', width: 12 },
    { header: 'Null', key: 'null', width: 10 },
    { header: 'Unique', key: 'unique', width: 10 },
    { header: 'Min', key: 'min', width: 18 },
    { header: 'Max', key: 'max', width: 18 },
    { header: 'Top Values', key: 'topValues', width: 40 },
  ];
  applyHeaderStyle(profileSheet.getRow(1));

  for (const p of profiles) {
    const topVals = p.topValues.slice(0, 3).map((v) => `${v.value} (${v.count})`).join(', ');
    profileSheet.addRow({
      name: p.name,
      type: p.detectedType,
      nonNull: p.nonNullCount,
      null: p.nullCount,
      unique: p.uniqueCount,
      min: p.min ?? '',
      max: p.max ?? '',
      topValues: topVals,
    });
  }

  // ── Sheet 2: Field Mappings ──
  const mappingSheet = workbook.addWorksheet('Field Mappings');
  mappingSheet.columns = [
    { header: 'Source Column', key: 'source', width: 25 },
    { header: 'Target Field', key: 'target', width: 25 },
    { header: 'Transform', key: 'transform', width: 20 },
  ];
  applyHeaderStyle(mappingSheet.getRow(1));

  for (const m of mappings) {
    const row = mappingSheet.addRow({
      source: m.sourceColumn,
      target: m.targetField || '(unmapped)',
      transform: m.transform || 'none',
    });
    // Highlight unmapped rows in amber
    if (!m.targetField) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `33${AMBER_HEX}` },
        };
        cell.font = { color: { argb: `FF${AMBER_HEX}` } };
      });
    }
  }

  // ── Sheet 3: Cleaned Data ──
  const dataSheet = workbook.addWorksheet('Cleaned Data');
  dataSheet.columns = outputHeaders.map((h) => ({
    header: h,
    key: h,
    width: Math.max(h.length + 4, 14),
  }));
  applyHeaderStyle(dataSheet.getRow(1));

  for (const row of outputRows) {
    const rowObj: Record<string, string> = {};
    outputHeaders.forEach((h, i) => {
      rowObj[h] = row[i];
    });
    dataSheet.addRow(rowObj);
  }

  // ── Sheet 4: Validation Issues ──
  const issueSheet = workbook.addWorksheet('Validation Issues');
  issueSheet.columns = [
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Message', key: 'message', width: 60 },
  ];
  applyHeaderStyle(issueSheet.getRow(1));

  if (issues.length === 0) {
    issueSheet.addRow({ severity: 'Info', message: 'No validation issues found.' });
  } else {
    for (const issue of issues) {
      const row = issueSheet.addRow({
        severity: issue.type === 'error' ? 'Error' : 'Warning',
        message: issue.message,
      });
      const color = issue.type === 'error' ? RED_HEX : AMBER_HEX;
      row.getCell(1).font = { bold: true, color: { argb: `FF${color}` } };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const label = recordType.replace(/([A-Z])/g, '-$1').toLowerCase();
  downloadBlob(blob, makeFileName('workbench', label, 'xlsx'));
}
