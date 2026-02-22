"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: number;
  lastName: string;
  firstName: string;
  gender: string;
};

type RecordType = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  note: string;
  confirmed: boolean;
  helper: { id: number; lastName: string; firstName: string };
  serviceType: { id: number; name: string };
  client: { id: number; lastName: string; firstName: string };
  checkToilet: boolean;
  checkDiaper: boolean;
  checkMeal: boolean;
  checkBath: boolean;
  checkOral: boolean;
  checkMedicine: boolean;
  checkTransfer: boolean;
  checkOuting: boolean;
  checkDressing: boolean;
  checkJointCleaning: boolean;
  checkCleaning: boolean;
  checkLaundry: boolean;
  checkClothes: boolean;
  checkSheets: boolean;
  checkBathPrep: boolean;
  checkLifeOther: boolean;
};

const DEFAULT_CHECK_ITEMS_BODY = [
  { key: "checkToilet", label: "排泄介助" },
  { key: "checkDiaper", label: "おむつ交換" },
  { key: "checkMeal", label: "食事介助" },
  { key: "checkBath", label: "入浴介助・清拭" },
  { key: "checkOral", label: "口腔ケア(整容)" },
  { key: "checkMedicine", label: "服薬介助" },
  { key: "checkTransfer", label: "移乗・移動介助" },
  { key: "checkOuting", label: "外出介助" },
  { key: "checkDressing", label: "更衣介助" },
  { key: "checkJointCleaning", label: "共同実践掃除" },
];

const DEFAULT_CHECK_ITEMS_LIFE = [
  { key: "checkCleaning", label: "掃除" },
  { key: "checkLaundry", label: "洗濯" },
  { key: "checkClothes", label: "衣服整理" },
  { key: "checkSheets", label: "シーツ交換" },
  { key: "checkBathPrep", label: "入浴準備" },
  { key: "checkLifeOther", label: "その他" },
];

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DailyRecordsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [helperName, setHelperName] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkLabels, setCheckLabels] = useState<Record<string, string>>({});

  const checkItemsAll = [...DEFAULT_CHECK_ITEMS_BODY, ...DEFAULT_CHECK_ITEMS_LIFE].map((item) => ({
    key: item.key,
    label: checkLabels[item.key] || item.label,
  }));

  useEffect(() => {
    const hName = sessionStorage.getItem("helperName");
    if (!hName) {
      router.push("/");
      return;
    }
    setHelperName(hName);
  }, [router]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch(`/api/records?date=${selectedDate}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([clientsData, recordsData, settings]) => {
      setClients(clientsData);
      setRecords(recordsData);
      const labels: Record<string, string> = {};
      for (const item of [...DEFAULT_CHECK_ITEMS_BODY, ...DEFAULT_CHECK_ITEMS_LIFE]) {
        if (settings[`checkLabel_${item.key}`]) labels[item.key] = settings[`checkLabel_${item.key}`];
      }
      setCheckLabels(labels);
      setLoading(false);
    });
  }, [selectedDate]);

  // 利用者ごとにグループ化
  const recordsByClient = new Map<number, RecordType[]>();
  for (const r of records) {
    const cId = r.client.id;
    if (!recordsByClient.has(cId)) recordsByClient.set(cId, []);
    recordsByClient.get(cId)!.push(r);
  }

  const isToday = selectedDate === getToday();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/clients")}
          className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          ← 利用者一覧
        </button>
        <span className="text-sm text-gray-500">
          担当: <span className="font-bold">{helperName}</span>
        </span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">記録一覧</h1>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          {!isToday && (
            <button
              onClick={() => setSelectedDate(getToday())}
              className="text-xs text-blue-600 underline"
            >
              今日に戻す
            </button>
          )}
        </div>
      </div>

      {/* 集計 */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{recordsByClient.size}</p>
          <p className="text-xs text-blue-500">記録あり</p>
        </div>
        <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{clients.length - recordsByClient.size}</p>
          <p className="text-xs text-orange-500">記録なし</p>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{records.length}</p>
          <p className="text-xs text-gray-500">総件数</p>
        </div>
      </div>

      {/* 記録なしの利用者（入力漏れ） */}
      {clients.filter((c) => !recordsByClient.has(c.id)).length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-orange-600 mb-2">記録なし（入力漏れの可能性）</h2>
          <div className="space-y-2">
            {clients
              .filter((c) => !recordsByClient.has(c.id))
              .map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/records/${client.id}`)}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">{client.lastName}{client.firstName}</span>
                    <span className="text-xs text-orange-500">タップして記録を入力 →</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 記録ありの利用者 */}
      {clients
        .filter((c) => recordsByClient.has(c.id))
        .map((client) => {
          const clientRecords = recordsByClient.get(client.id)!;
          return (
            <div key={client.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-700">{client.lastName}{client.firstName}</h2>
                <button
                  onClick={() => router.push(`/records/${client.id}`)}
                  className="text-xs text-blue-600 underline"
                >
                  記録を追加・編集
                </button>
              </div>
              <div className="space-y-2">
                {clientRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-800">
                        {record.startTime}〜{record.endTime}
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {record.serviceType.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {checkItemsAll
                        .filter((item) => (record as unknown as Record<string, boolean>)[item.key])
                        .map((item) => (
                          <span
                            key={item.key}
                            className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded"
                          >
                            {item.label}
                          </span>
                        ))}
                    </div>
                    {record.note && (
                      <p className="text-sm text-gray-600 mt-1">{record.note}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>担当: {record.helper.lastName}{record.helper.firstName}</span>
                      {record.confirmed && (
                        <span className="text-red-500 font-bold">確認済 ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">利用者が登録されていません</p>
        </div>
      )}
    </div>
  );
}
