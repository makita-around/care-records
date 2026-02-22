"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ServiceType = { id: number; name: string; defaultMinutes: number };
type Helper = { id: number; lastName: string; firstName: string };
type Client = { id: number; lastName: string; firstName: string };

type RecordType = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  note: string;
  confirmed: boolean;
  helperId: number;
  serviceTypeId: number;
  checkToilet: boolean; checkDiaper: boolean; checkMeal: boolean; checkBath: boolean;
  checkOral: boolean; checkMedicine: boolean; checkTransfer: boolean; checkOuting: boolean;
  checkDressing: boolean; checkJointCleaning: boolean; checkCleaning: boolean;
  checkLaundry: boolean; checkClothes: boolean; checkSheets: boolean; checkBathPrep: boolean; checkLifeOther: boolean;
  client: Client;
  helper: Helper;
  serviceType: ServiceType;
};

const DEFAULT_CHECK_ITEMS_BODY = [
  { key: "checkToilet", label: "排泄介助" }, { key: "checkDiaper", label: "おむつ交換" },
  { key: "checkMeal", label: "食事介助" }, { key: "checkBath", label: "入浴介助・清拭" },
  { key: "checkOral", label: "口腔ケア(整容)" }, { key: "checkMedicine", label: "服薬介助" },
  { key: "checkTransfer", label: "移乗・移動介助" }, { key: "checkOuting", label: "外出介助" },
  { key: "checkDressing", label: "更衣介助" }, { key: "checkJointCleaning", label: "共同実践掃除" },
];
const DEFAULT_CHECK_ITEMS_LIFE = [
  { key: "checkCleaning", label: "掃除" }, { key: "checkLaundry", label: "洗濯" },
  { key: "checkClothes", label: "衣服整理" }, { key: "checkSheets", label: "シーツ交換" },
  { key: "checkBathPrep", label: "入浴準備" }, { key: "checkLifeOther", label: "その他" },
];

function calcMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function EditModal({ record, helpers, serviceTypes, checkItemsBody, checkItemsLife, onSave, onClose }: {
  record: RecordType;
  helpers: Helper[];
  serviceTypes: ServiceType[];
  checkItemsBody: { key: string; label: string }[];
  checkItemsLife: { key: string; label: string }[];
  onSave: (updated: RecordType) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(record.date);
  const [helperId, setHelperId] = useState(record.helperId);
  const [serviceTypeId, setServiceTypeId] = useState(record.serviceTypeId);
  const [startTime, setStartTime] = useState(record.startTime);
  const [endTime, setEndTime] = useState(record.endTime);
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries([...checkItemsBody, ...checkItemsLife].map(
      (item) => [item.key, (record as unknown as Record<string, boolean>)[item.key]]
    ))
  );
  const [note, setNote] = useState(record.note);
  const [confirmed, setConfirmed] = useState(record.confirmed);
  const [saving, setSaving] = useState(false);

  const toggleCheck = (key: string) => setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    const totalMinutes = calcMinutes(startTime, endTime);
    const st = serviceTypes.find((s) => s.id === serviceTypeId);
    const isBody = st ? st.name.includes("身体") || st.name.includes("身1") || st.name.includes("新身") : false;
    const isLife = st ? st.name.includes("生活") || st.name.includes("生1") || st.name.includes("独自") : false;

    const res = await fetch("/api/records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: record.id,
        date,
        helperId,
        serviceTypeId,
        startTime,
        endTime,
        totalMinutes,
        bodycare: isBody,
        lifeSupport: isLife,
        ...checks,
        note,
        confirmed,
        signatureData: record.confirmed === confirmed ? (record as unknown as Record<string, string>).signatureData : "",
      }),
    });
    const updated = await res.json();
    onSave(updated);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">記録を編集</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-4 space-y-4">

          {/* 利用者（変更不可） */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">利用者</label>
            <p className="text-gray-800 font-bold">{record.client.lastName}{record.client.firstName}</p>
          </div>

          {/* 日付 */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full" />
          </div>

          {/* ヘルパー */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">担当ヘルパー</label>
            <select value={helperId} onChange={(e) => setHelperId(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2">
              {helpers.map((h) => (
                <option key={h.id} value={h.id}>{h.lastName}{h.firstName}</option>
              ))}
            </select>
          </div>

          {/* サービス種別 */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">サービス種別</label>
            <select value={serviceTypeId} onChange={(e) => setServiceTypeId(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2">
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* 時間 */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-600 mb-1">開始</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2" />
            </div>
            <span className="text-gray-400 mt-5">〜</span>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-600 mb-1">終了</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2" />
            </div>
            {startTime && endTime && (
              <span className="text-sm text-gray-500 mt-5">{calcMinutes(startTime, endTime)}分</span>
            )}
          </div>

          {/* チェック項目 */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">身体介護</label>
            <div className="grid grid-cols-2 gap-1.5">
              {checkItemsBody.map((item) => (
                <button key={item.key} onClick={() => toggleCheck(item.key)}
                  className={`p-2 rounded-lg border text-sm transition-colors ${checks[item.key] ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300"}`}>
                  {checks[item.key] ? "✓ " : ""}{item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">生活援助</label>
            <div className="grid grid-cols-2 gap-1.5">
              {checkItemsLife.map((item) => (
                <button key={item.key} onClick={() => toggleCheck(item.key)}
                  className={`p-2 rounded-lg border text-sm transition-colors ${checks[item.key] ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-700 border-gray-300"}`}>
                  {checks[item.key] ? "✓ " : ""}{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 特記事項 */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">特記事項</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg p-2" />
          </div>

          {/* 確認 */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="confirmed" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4" />
            <label htmlFor="confirmed" className="text-sm font-bold text-gray-600">ご利用者確認済み</label>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-3 font-bold">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-bold hover:bg-blue-700 disabled:bg-gray-300">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordsContent() {
  const searchParams = useSearchParams();
  const helperIdParam = searchParams.get("helperId");
  const helperNameParam = searchParams.get("helperName");
  const readonly = searchParams.get("readonly") === "1";

  const [records, setRecords] = useState<RecordType[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [dateFilter, setDateFilter] = useState(helperIdParam ? "" : getToday());
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null);
  const [checkLabels, setCheckLabels] = useState<Record<string, string>>({});

  const checkItemsBody = DEFAULT_CHECK_ITEMS_BODY.map((item) => ({
    key: item.key,
    label: checkLabels[item.key] || item.label,
  }));
  const checkItemsLife = DEFAULT_CHECK_ITEMS_LIFE.map((item) => ({
    key: item.key,
    label: checkLabels[item.key] || item.label,
  }));

  const fetchRecords = async (date: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (helperIdParam) params.set("helperId", helperIdParam);
    const res = await fetch(`/api/records?${params.toString()}`);
    setRecords(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/helpers").then((r) => r.json()),
      fetch("/api/service-types").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([h, s, settings]) => {
      setHelpers(h);
      setServiceTypes(s);
      const labels: Record<string, string> = {};
      for (const item of [...DEFAULT_CHECK_ITEMS_BODY, ...DEFAULT_CHECK_ITEMS_LIFE]) {
        if (settings[`checkLabel_${item.key}`]) labels[item.key] = settings[`checkLabel_${item.key}`];
      }
      setCheckLabels(labels);
    });
  }, []);

  useEffect(() => { fetchRecords(dateFilter); }, [dateFilter]);

  const deleteRecord = async (id: number) => {
    if (!confirm("この記録を削除してよいですか？")) return;
    await fetch(`/api/records?id=${id}`, { method: "DELETE" });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const getCheckedItems = (record: RecordType) =>
    [...checkItemsBody, ...checkItemsLife]
      .filter((item) => (record as unknown as Record<string, boolean>)[item.key])
      .map((item) => item.label);

  const title = helperNameParam ? `${helperNameParam} の記録` : "記録一覧";

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <Link href={helperIdParam ? "/admin/helpers" : readonly ? "/" : "/admin"} className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
          {helperIdParam ? "← ヘルパー管理" : readonly ? "← ヘルパー選択" : "← 管理者画面"}
        </Link>
      </div>

      {/* フィルタ */}
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-bold text-gray-600">日付:</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2" />
        </div>
        {dateFilter && (
          <button onClick={() => setDateFilter("")} className="text-sm text-gray-500 underline">
            日付指定を外す（全件表示）
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto">{records.length}件</span>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-center py-8">記録がありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-gray-200 rounded-lg text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-2 text-left">日付</th>
                <th className="p-2 text-left">利用者</th>
                <th className="p-2 text-left">時間</th>
                <th className="p-2 text-left">種別</th>
                <th className="p-2 text-left">チェック項目</th>
                <th className="p-2 text-left">特記</th>
                {!helperIdParam && <th className="p-2 text-left">ヘルパー</th>}
                <th className="p-2 text-center">確認</th>
                {!readonly && <th className="p-2 text-center">操作</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 whitespace-nowrap">{r.date}</td>
                  <td className="p-2 font-bold">{r.client.lastName}{r.client.firstName}</td>
                  <td className="p-2 whitespace-nowrap">{r.startTime}〜{r.endTime}</td>
                  <td className="p-2">{r.serviceType.name}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {getCheckedItems(r).map((label) => (
                        <span key={label} className="text-xs bg-blue-100 text-blue-700 px-1 rounded">{label}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 max-w-32 truncate">{r.note || "-"}</td>
                  {!helperIdParam && <td className="p-2">{r.helper.lastName}{r.helper.firstName}</td>}
                  <td className="p-2 text-center">
                    {r.confirmed ? <span className="text-red-500 font-bold">済</span> : <span className="text-gray-300">-</span>}
                  </td>
                  {!readonly && (
                    <td className="p-2 text-center whitespace-nowrap">
                      <button onClick={() => setEditingRecord(r)}
                        className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-100 mr-1">
                        編集
                      </button>
                      <button onClick={() => deleteRecord(r.id)}
                        className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-100">
                        削除
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingRecord && (
        <EditModal
          record={editingRecord}
          helpers={helpers}
          serviceTypes={serviceTypes}
          checkItemsBody={checkItemsBody}
          checkItemsLife={checkItemsLife}
          onSave={(updated) => {
            setRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r));
            setEditingRecord(null);
          }}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}

export default function RecordsAdminPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">読み込み中...</p></div>}>
      <RecordsContent />
    </Suspense>
  );
}
