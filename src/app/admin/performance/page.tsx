"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadPdf } from "@/lib/downloadPdf";

type Client = { id: number; lastName: string; firstName: string };

type DefaultService = {
  clientId: number;
  serviceTypeId: number;
  serviceTypeName: string;
  dayOfWeek: number;
  startTime: string;
};

type RecordItem = {
  id: number;
  date: string;
  startTime: string;
  serviceType: { id: number; name: string };
};

type Group = {
  key: string;
  serviceTypeName: string;
  startTime: string;
  yoDays: number[];
  jitsuDays: number[];
};

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

function buildGroups(
  defaults: DefaultService[],
  records: RecordItem[],
  year: number,
  month: number
): Group[] {
  const groupMap = new Map<string, Group>();
  const daysInMonth = getDaysInMonth(year, month);

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = getDayOfWeek(year, month, d);
    for (const def of defaults.filter((x) => x.dayOfWeek === dow)) {
      const key = `${def.serviceTypeId}_${def.startTime}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, { key, serviceTypeName: def.serviceTypeName, startTime: def.startTime, yoDays: [], jitsuDays: [] });
      }
      groupMap.get(key)!.yoDays.push(d);
    }
  }

  for (const rec of records) {
    const d = parseInt(rec.date.split("-")[2]);
    const key = `${rec.serviceType.id}_${rec.startTime}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, serviceTypeName: rec.serviceType.name, startTime: rec.startTime, yoDays: [], jitsuDays: [] });
    }
    groupMap.get(key)!.jitsuDays.push(d);
  }

  return Array.from(groupMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

const PERFORMANCE_CSS = `
  @page { size: A4 landscape; margin: 8mm 6mm; }
  * { box-sizing: border-box; }
  body { font-family: "Yu Gothic","Meiryo",sans-serif; font-size:9px; margin:0; color:#111; }
  .perf-page-break { page-break-before: always; }
  .page-title { font-size:15px; font-weight:bold; text-align:center; letter-spacing:4px; margin-bottom:6px; border-bottom:2px solid #333; padding-bottom:4px; }
  .info-row { display:flex; gap:20px; margin-bottom:6px; font-size:9px; }
  .info-item { display:flex; gap:4px; align-items:flex-end; }
  .info-label { font-weight:bold; color:#444; white-space:nowrap; }
  .info-val { border-bottom:1px solid #777; min-width:80px; padding-bottom:1px; }
  table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:8px; }
  thead th { background:#2c5f8a; color:#fff; padding:3px 2px; border:1px solid #1a4060; text-align:center; vertical-align:middle; line-height:1.2; }
  tbody td { border:1px solid #bbb; padding:2px 1px; text-align:center; vertical-align:middle; }
  .svc-name { font-size:8px; font-weight:bold; text-align:center; background:#f5f5f5; width:80px; }
  .time-cell { font-size:8px; width:38px; }
  .count-cell { font-size:8px; font-weight:bold; width:22px; }
  .yo-jitsu { font-size:8px; font-weight:bold; width:18px; }
  .yo { background:#e8f0ff; color:#334; }
  .jitsu { background:#fff8e0; color:#553; }
  .day-cell { font-size:8px; width:18px; }
  .hi { font-weight:bold; background:#fffacc; }
  .summary { margin-top:6px; font-size:9px; display:flex; justify-content:flex-end; gap:20px; }
  .summary span { border:1px solid #aaa; border-radius:3px; padding:3px 10px; background:#f9f9f9; font-weight:bold; }
`;

function buildClientSection(
  groups: Group[],
  year: number,
  month: number,
  clientName: string,
  officeName: string,
  coordinator: string,
  isFirst: boolean
): string {
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dayHeaders = days
    .map((d) => {
      const dow = getDayOfWeek(year, month, d);
      const color = dow === 0 ? "color:#c00;" : dow === 6 ? "color:#06c;" : "";
      return `<th style="width:18px;padding:1px;font-size:8px;${color}">${d}<br><span style="font-size:7px">${DOW_LABELS[dow]}</span></th>`;
    })
    .join("");

  let rows = "";
  for (const group of groups) {
    const yoTotal = group.yoDays.length;
    const jitsuTotal = group.jitsuDays.length;
    const yoCells = days.map((d) => group.yoDays.includes(d) ? `<td class="day-cell hi">1</td>` : `<td class="day-cell"></td>`).join("");
    const jitsuCells = days.map((d) => group.jitsuDays.includes(d) ? `<td class="day-cell hi">1</td>` : `<td class="day-cell"></td>`).join("");

    rows += `
      <tr>
        <td rowspan="2" class="svc-name">${group.serviceTypeName}</td>
        <td class="time-cell">${group.startTime}</td>
        <td class="count-cell">${yoTotal}</td>
        <td class="yo-jitsu yo">予</td>
        ${yoCells}
      </tr>
      <tr>
        <td class="time-cell">${group.startTime}</td>
        <td class="count-cell">${jitsuTotal}</td>
        <td class="yo-jitsu jitsu">実</td>
        ${jitsuCells}
      </tr>`;
  }

  const yoTotal = groups.reduce((s, g) => s + g.yoDays.length, 0);
  const jitsuTotal = groups.reduce((s, g) => s + g.jitsuDays.length, 0);

  return `
  <div${isFirst ? "" : ' class="perf-page-break"'}>
    <div class="page-title">訪問介護　サービス提供実績</div>
    <div class="info-row">
      <div class="info-item"><span class="info-label">事業所名</span><span class="info-val">${officeName}</span></div>
      <div class="info-item"><span class="info-label">提供年月</span><span class="info-val">${year}年${month}月分</span></div>
      <div class="info-item"><span class="info-label">利用者氏名</span><span class="info-val">${clientName}　様</span></div>
      <div class="info-item"><span class="info-label">サービス提供責任者</span><span class="info-val">${coordinator}</span></div>
    </div>
    <table>
      <colgroup>
        <col style="width:80px"><col style="width:38px"><col style="width:22px"><col style="width:18px">
      </colgroup>
      <thead>
        <tr>
          <th rowspan="2">サービス内容</th>
          <th rowspan="2">時間帯</th>
          <th rowspan="2">回数</th>
          <th rowspan="2">予/実</th>
          ${dayHeaders}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary">
      <span>予定回数：${yoTotal}回</span>
      <span>実績回数：${jitsuTotal}回</span>
    </div>
  </div>`;
}

function wrapInDocument(bodyContent: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>${PERFORMANCE_CSS}</style>
</head><body>${bodyContent}</body></html>`;
}

export default function PerformancePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => {
        setClients(data);
        setLoading(false);
      });
  }, []);

  const buildHtml = async (): Promise<{ html: string; fileName: string }> => {
    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = getDaysInMonth(year, month);
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const settings = await fetch("/api/settings").then((r) => r.json());
    const officeName: string = settings.officeName || "";
    const coordinator: string = settings.coordinator || "";

    const targetClients = selectedClientId === "all" ? clients : clients.filter((c) => c.id === selectedClientId);

    const sections = await Promise.all(
      targetClients.map(async (client, idx) => {
        const [recordsAll, defaults] = await Promise.all([
          fetch(`/api/records?clientId=${client.id}`).then((r) => r.json()),
          fetch(`/api/default-services?clientId=${client.id}`).then((r) => r.json()),
        ]);
        const records: RecordItem[] = (recordsAll as RecordItem[]).filter(
          (r) => r.date >= startDate && r.date <= endDate
        );
        const groups = buildGroups(defaults as DefaultService[], records, year, month);
        const clientName = `${client.lastName}${client.firstName}`;
        return buildClientSection(groups, year, month, clientName, officeName, coordinator, idx === 0);
      })
    );

    const clientLabel = selectedClientId === "all" ? "全員" : (() => {
      const c = clients.find((x) => x.id === selectedClientId);
      return c ? `${c.lastName}${c.firstName}` : "";
    })();
    const fileName = `サービス提供実績_${year}年${month}月_${clientLabel}`;
    const html = wrapInDocument(sections.join(""), fileName);
    return { html, fileName };
  };

  const handlePDF = async () => {
    setGenerating(true);
    try {
      const { html, fileName } = await buildHtml();
      await downloadPdf(html, fileName, "landscape");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    setGenerating(true);
    try {
      const { html } = await buildHtml();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );

  const yearOptions = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">実績出力</h1>
        <Link href="/admin" className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
          ← 管理者画面
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        {/* 年月選択 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">年</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-3"
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">月</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-3"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        </div>

        {/* 利用者選択 */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">利用者</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-3"
          >
            <option value="all">全員（利用者ごとにページ分割）</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.lastName}{c.firstName}</option>
            ))}
          </select>
        </div>

        {/* 出力ボタン */}
        <div className="flex gap-3">
          <button
            onClick={handlePDF}
            disabled={generating}
            className="flex-1 bg-red-600 text-white rounded-lg p-4 font-bold hover:bg-red-700 disabled:bg-gray-300 transition-colors"
          >
            {generating ? "生成中..." : "PDF出力"}
          </button>
          <button
            onClick={handlePrint}
            disabled={generating}
            className="flex-1 bg-blue-600 text-white rounded-lg p-4 font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {generating ? "生成中..." : "印刷"}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          PDF出力：ファイル名「サービス提供実績_年月_利用者名.pdf」でダウンロードされます
        </p>
      </div>
    </div>
  );
}
