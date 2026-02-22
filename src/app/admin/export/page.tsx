"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Client = { id: number; lastName: string; firstName: string };

const CHECK_LABELS: Record<string, string> = {
  checkToilet: "排泄介助", checkDiaper: "おむつ交換", checkMeal: "食事介助",
  checkBath: "入浴介助・清拭", checkOral: "口腔ケア", checkMedicine: "服薬介助",
  checkTransfer: "移乗・移動", checkOuting: "外出介助", checkDressing: "更衣介助",
  checkJointCleaning: "共同掃除", checkCleaning: "掃除", checkLaundry: "洗濯",
  checkClothes: "衣服整理", checkSheets: "シーツ交換", checkBathPrep: "入浴準備", checkLifeOther: "その他",
};

function getMonthRange() {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function ExportPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const range = getMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
    fetch("/api/clients").then((r) => r.json()).then((data) => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  const fetchRecordsForExport = async () => {
    const params = new URLSearchParams();
    if (selectedClientId !== "all") params.set("clientId", String(selectedClientId));

    const res = await fetch(`/api/records?${params.toString()}`);
    const allRecords = await res.json();

    return allRecords.filter(
      (r: { date: string }) => r.date >= startDate && r.date <= endDate
    );
  };

  const exportCSV = async () => {
    setExporting(true);
    const records = await fetchRecordsForExport();

    const header = "日付,利用者,開始時間,終了時間,合計(分),サービス種別,チェック項目,特記事項,ヘルパー,確認";
    const rows = records.map((r: Record<string, unknown>) => {
      const checks = Object.entries(CHECK_LABELS)
        .filter(([key]) => r[key])
        .map(([, label]) => label)
        .join("/");
      const client = r.client as { lastName: string; firstName: string };
      const serviceType = r.serviceType as { name: string };
      const helper = r.helper as { lastName: string; firstName: string };
      return [
        r.date,
        `${client.lastName}${client.firstName}`,
        r.startTime, r.endTime,
        r.totalMinutes, serviceType.name, checks,
        `"${(r.note as string || "").replace(/"/g, '""')}"`,
        `${helper.lastName}${helper.firstName}`,
        r.confirmed ? "済" : "",
      ].join(",");
    });

    const bom = "\uFEFF";
    const csv = bom + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `提供記録_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const exportPDF = async () => {
    setExporting(true);
    const [records, settings] = await Promise.all([
      fetchRecordsForExport(),
      fetch("/api/settings").then((r) => r.json()),
    ]);

    const officeName: string = settings.officeName || "";
    const coordinator: string = settings.coordinator || "";

    // グループ化: 利用者ごと
    const grouped: Record<string, {
      clientName: string;
      clientLastName: string;
      records: Record<string, unknown>[];
    }> = {};
    for (const r of records) {
      const client = r.client as { id: number; lastName: string; firstName: string };
      const key = String(client.id);
      if (!grouped[key]) {
        grouped[key] = {
          clientName: `${client.lastName}${client.firstName}`,
          clientLastName: client.lastName,
          records: [],
        };
      }
      grouped[key].records.push(r);
    }

    const year = startDate.slice(0, 4);
    const month = parseInt(startDate.slice(5, 7)).toString();

    const BODY_CHECKS: [string, string][] = [
      ["checkToilet","排泄介助"],["checkDiaper","おむつ交換"],["checkMeal","食事介助"],
      ["checkBath","入浴・清拭"],["checkOral","口腔ケア"],["checkMedicine","服薬介助"],
      ["checkTransfer","移乗・移動"],["checkOuting","外出介助"],["checkDressing","更衣介助"],
      ["checkJointCleaning","共同掃除"],
    ];
    const LIFE_CHECKS: [string, string][] = [
      ["checkCleaning","掃除"],["checkLaundry","洗濯"],["checkClothes","衣服整理"],
      ["checkSheets","シーツ交換"],["checkBathPrep","入浴準備"],["checkLifeOther","その他"],
    ];

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>訪問介護 サービス提供記録</title>
<style>
  @page { size: A4 portrait; margin: 12mm 10mm; }
  * { box-sizing: border-box; }
  body { font-family: "Yu Gothic", "Meiryo", sans-serif; font-size: 10px; margin: 0; color: #111; }
  .page-break { page-break-before: always; }

  .title {
    font-size: 17px; font-weight: bold; text-align: center;
    letter-spacing: 5px; margin-bottom: 10px;
    border-bottom: 2px solid #333; padding-bottom: 5px;
  }
  .info-box {
    border: 1px solid #aaa; border-radius: 3px;
    padding: 7px 12px; margin-bottom: 10px;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 5px 24px; font-size: 10px;
  }
  .info-row { display: flex; align-items: flex-end; gap: 5px; }
  .info-label { font-weight: bold; white-space: nowrap; color: #444; }
  .info-val { border-bottom: 1px solid #777; flex: 1; padding-bottom: 1px; min-width: 50px; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
  thead th {
    background: #2c5f8a; color: #fff; font-weight: bold;
    padding: 5px 4px; border: 1px solid #1a4060;
    text-align: center; vertical-align: middle; line-height: 1.3;
  }
  tbody td {
    border: 1px solid #bbb; padding: 5px 5px;
    text-align: center; vertical-align: middle; line-height: 1.4;
  }
  tbody tr:nth-child(even) { background: #f3f7fb; }
  tbody tr:hover { background: #e8f0f8; }
  .td-l { text-align: left; }
  .td-sm { font-size: 9px; }

  .stamp {
    display: inline-flex; flex-direction: column;
    align-items: center; justify-content: center;
    width: 28px; height: 28px;
    border: 2px solid #c00; border-radius: 50%;
    color: #c00; font-size: 7px; font-weight: bold;
    line-height: 1.1;
  }
  .summary {
    margin-top: 10px; font-size: 10px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .summary-left { color: #555; }
  .summary-right {
    border: 1px solid #aaa; border-radius: 3px;
    padding: 4px 12px; font-weight: bold;
    background: #f9f9f9;
  }
</style>
</head><body>`;

    let first = true;
    for (const key of Object.keys(grouped)) {
      const group = grouped[key];
      if (!first) html += '<div class="page-break"></div>';
      first = false;

      // スタンプは名字のみ（最大2文字）
      const stampChars = group.clientLastName.split("");
      const stampHtml = stampChars
        .map((c: string) => `<span>${c}</span>`)
        .join("");

      const totalCount = group.records.length;
      const totalMin = group.records.reduce((s, r) => s + ((r as Record<string,unknown>).totalMinutes as number), 0);
      const totalH = Math.floor(totalMin / 60);
      const totalM = totalMin % 60;

      html += `<div class="title">訪問介護　サービス提供記録</div>`;

      html += `<div class="info-box">
        <div class="info-row">
          <span class="info-label">事 業 所 名</span>
          <span class="info-val">${officeName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">提 供 年 月</span>
          <span class="info-val">${year}年${month}月分</span>
        </div>
        <div class="info-row">
          <span class="info-label">利 用 者 氏 名</span>
          <span class="info-val">${group.clientName}　様</span>
        </div>
        <div class="info-row">
          <span class="info-label">サービス提供責任者</span>
          <span class="info-val">${coordinator}</span>
        </div>
      </div>`;

      html += `<table>
        <colgroup>
          <col style="width:14%">
          <col style="width:13%">
          <col style="width:16%">
          <col style="width:8%">
          <col style="width:26%">
          <col style="width:13%">
          <col style="width:10%">
        </colgroup>
        <thead>
          <tr>
            <th>月　日</th>
            <th>サービス種別</th>
            <th>提供時間</th>
            <th>時間数<br>(分)</th>
            <th>実　施　内　容</th>
            <th>特 記 事 項</th>
            <th>担当ヘルパー</th>
            <th style="width:10%">ご利用者<br>確　認</th>
          </tr>
        </thead>
        <tbody>`;

      for (const r of group.records) {
        const rd = r as Record<string, unknown>;
        const serviceType = rd.serviceType as { name: string };
        const helper = rd.helper as { lastName: string; firstName: string };
        const [, mm, dd] = String(rd.date).split("-");
        const dateStr = `${parseInt(mm)}月${parseInt(dd)}日`;

        const bodyItems = BODY_CHECKS.filter(([k]) => rd[k]).map(([,v]) => v);
        const lifeItems = LIFE_CHECKS.filter(([k]) => rd[k]).map(([,v]) => v);
        let content = "";
        if (bodyItems.length) content += `【身体】${bodyItems.join("・")}`;
        if (bodyItems.length && lifeItems.length) content += `<br>`;
        if (lifeItems.length) content += `【生活】${lifeItems.join("・")}`;
        if (!content) content = `<span style="color:#999">－</span>`;

        html += `<tr>
          <td>${dateStr}</td>
          <td class="td-sm">${serviceType.name}</td>
          <td>${rd.startTime}&nbsp;〜&nbsp;${rd.endTime}</td>
          <td>${rd.totalMinutes}</td>
          <td class="td-l td-sm">${content}</td>
          <td class="td-l td-sm">${rd.note || ""}</td>
          <td class="td-sm">${helper.lastName}${helper.firstName}</td>
          <td><div class="stamp">${stampHtml}</div></td>
        </tr>`;
      }

      html += `</tbody></table>`;

      html += `<div class="summary">
        <span class="summary-right">提供回数：${totalCount}回　／　合計時間：${totalH}時間${totalM}分（${totalMin}分）</span>
      </div>`;

    }

    html += `</body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
    setExporting(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">読み込み中...</p></div>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">PDF / CSV出力</h1>
        <Link href="/admin" className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">← 管理者画面</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        {/* 利用者選択 */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">利用者</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-3"
          >
            <option value="all">全員</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.lastName}{c.firstName}</option>
            ))}
          </select>
        </div>

        {/* 期間 */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">開始日</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>
          <span className="mt-6 text-gray-400">〜</span>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">終了日</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>
        </div>

        {/* 出力ボタン */}
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex-1 bg-red-600 text-white rounded-lg p-4 font-bold hover:bg-red-700 disabled:bg-gray-300"
          >
            PDF出力（印刷）
          </button>
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="flex-1 bg-green-600 text-white rounded-lg p-4 font-bold hover:bg-green-700 disabled:bg-gray-300"
          >
            CSV出力
          </button>
        </div>
      </div>
    </div>
  );
}
