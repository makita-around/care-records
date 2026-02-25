"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: number;
  lastName: string;
  firstName: string;
  gender: string;
};

type DefaultService = {
  id: number;
  clientId: number;
  serviceTypeId: number;
  serviceTypeName: string;
  startTime: string;
  endTime: string;
};

type RecordType = {
  id: number;
  startTime: string;
  endTime: string;
  serviceTypeId: number;
  serviceType: { name: string };
  client: { id: number };
  helper: { lastName: string; firstName: string };
  confirmed: boolean;
};

// 一覧表示用の統合アイテム
type DisplayItem = {
  key: string;
  clientId: number;
  clientName: string;
  startTime: string;
  endTime: string;
  serviceTypeName: string;
  status: "inputted" | "pending" | "extra";
  record?: RecordType;
};

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function DailyRecordsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [todayDefaults, setTodayDefaults] = useState<DefaultService[]>([]);
  const [helperName, setHelperName] = useState("");
  const [loading, setLoading] = useState(true);

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
    const today = getToday();
    const dow = getTodayDayOfWeek();
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch(`/api/records?date=${today}`).then((r) => r.json()),
      fetch(`/api/default-services?dayOfWeek=${dow}`).then((r) => r.json()),
    ]).then(([clientsData, recordsData, defaultsData]) => {
      setClients(clientsData);
      setRecords(recordsData);
      setTodayDefaults(defaultsData);
      setLoading(false);
    });
  }, []);

  const today = getToday();
  const [year, month, day] = today.split("-");
  const dow = getTodayDayOfWeek();
  const todayLabel = `${parseInt(year)}年${parseInt(month)}月${parseInt(day)}日（${DOW_LABELS[dow]}）`;

  // 利用者マップ
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  // デフォルトと記録を統合して時間順リストを作る
  const items: DisplayItem[] = [];
  const matchedRecordIds = new Set<number>();

  for (const def of todayDefaults) {
    const client = clientMap.get(def.clientId);
    if (!client) continue;
    const clientName = `${client.lastName}${client.firstName}`;

    // 同じ利用者・同じサービス種別の記録を探す
    const matchedRecord = records.find(
      (r) => r.client.id === def.clientId && r.serviceTypeId === def.serviceTypeId && !matchedRecordIds.has(r.id)
    );

    if (matchedRecord) {
      matchedRecordIds.add(matchedRecord.id);
      items.push({
        key: `def_${def.id}`,
        clientId: def.clientId,
        clientName,
        startTime: matchedRecord.startTime,
        endTime: matchedRecord.endTime,
        serviceTypeName: def.serviceTypeName,
        status: "inputted",
        record: matchedRecord,
      });
    } else {
      items.push({
        key: `def_${def.id}`,
        clientId: def.clientId,
        clientName,
        startTime: def.startTime,
        endTime: def.endTime,
        serviceTypeName: def.serviceTypeName,
        status: "pending",
      });
    }
  }

  // デフォルトに対応しない記録（イレギュラー訪問など）を追加
  for (const rec of records) {
    if (!matchedRecordIds.has(rec.id)) {
      const client = clientMap.get(rec.client.id);
      if (!client) continue;
      items.push({
        key: `rec_${rec.id}`,
        clientId: rec.client.id,
        clientName: `${client.lastName}${client.firstName}`,
        startTime: rec.startTime,
        endTime: rec.endTime,
        serviceTypeName: rec.serviceType.name,
        status: "extra",
        record: rec,
      });
    }
  }

  // 時間順ソート
  items.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const inputtedCount = items.filter((i) => i.status === "inputted" || i.status === "extra").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;

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
        <h1 className="text-xl font-bold text-gray-800">本日の記録一覧</h1>
        <p className="text-sm text-gray-500 mt-1">{todayLabel}</p>
      </div>

      {/* 集計 */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{inputtedCount}</p>
          <p className="text-xs text-green-600">入力済み</p>
        </div>
        <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
          <p className="text-xs text-orange-500">未入力</p>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{items.length}</p>
          <p className="text-xs text-gray-500">本日件数</p>
        </div>
      </div>

      {/* 時間順リスト */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>本日の予定・記録はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.key}
              onClick={() => router.push(`/records/${item.clientId}`)}
              className={`bg-white border rounded-lg px-4 py-3 cursor-pointer transition-colors shadow-sm flex items-center gap-3 ${
                item.status === "pending"
                  ? "border-orange-200 hover:bg-orange-50"
                  : "border-green-200 hover:bg-green-50"
              }`}
            >
              {/* 時間 */}
              <div className="text-sm font-bold text-gray-700 whitespace-nowrap w-28 shrink-0">
                {item.startTime}〜{item.endTime}
              </div>

              {/* 名前・サービス */}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-gray-800 mr-2">{item.clientName}</span>
                <span className="text-xs text-gray-500">{item.serviceTypeName}</span>
                {item.status === "extra" && (
                  <span className="ml-1 text-xs text-purple-500">（追加）</span>
                )}
              </div>

              {/* ステータス */}
              {item.status === "inputted" || item.status === "extra" ? (
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                  ✓ 入力済み
                </span>
              ) : (
                <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                  未入力
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">利用者が登録されていません</p>
        </div>
      )}
    </div>
  );
}
