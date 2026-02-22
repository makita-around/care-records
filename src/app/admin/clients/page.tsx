"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ServiceType = { id: number; name: string; defaultMinutes: number };
type Client = {
  id: number;
  lastName: string;
  firstName: string;
  gender: string;
  defaultServiceId: number | null;
  defaultService: ServiceType | null;
  signatureMode: string;
  active: boolean;
};
type DefaultWeeklyService = {
  id: number;
  clientId: number;
  serviceTypeId: number;
  serviceTypeName: string;
  defaultMinutes: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const SIG_LABELS: Record<string, string> = {
  stamp: "電子印（タップ押印）",
  handwritten: "手書きサイン",
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export default function ClientsAdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [newLastName, setNewLastName] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newGender, setNewGender] = useState("女");
  const [newServiceId, setNewServiceId] = useState<number | "">("");
  const [newSignatureMode, setNewSignatureMode] = useState("stamp");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLastName, setEditLastName] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editGender, setEditGender] = useState("女");
  const [editServiceId, setEditServiceId] = useState<number | "">("");
  const [editSignatureMode, setEditSignatureMode] = useState("stamp");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // 週間デフォルト関連
  const [expandedDefaultsId, setExpandedDefaultsId] = useState<number | null>(null);
  const [defaultsMap, setDefaultsMap] = useState<Record<number, DefaultWeeklyService[]>>({});
  const [newDow, setNewDow] = useState<number[]>([]);
  const [newDowServiceId, setNewDowServiceId] = useState<number | "">("");
  const [newDowStart, setNewDowStart] = useState("");
  const [newDowEnd, setNewDowEnd] = useState("");
  const [dowSaving, setDowSaving] = useState(false);

  const fetchData = async () => {
    const [c, s] = await Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/service-types").then((r) => r.json()),
    ]);
    setClients(c);
    setServiceTypes(s);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchDefaults = async (clientId: number) => {
    const data = await fetch(`/api/default-services?clientId=${clientId}`).then((r) => r.json());
    setDefaultsMap((prev) => ({ ...prev, [clientId]: data }));
  };

  const toggleExpandDefaults = async (clientId: number) => {
    if (expandedDefaultsId === clientId) {
      setExpandedDefaultsId(null);
    } else {
      setExpandedDefaultsId(clientId);
      setNewDow([]);
      setNewDowServiceId(serviceTypes.length > 0 ? serviceTypes[0].id : "");
      setNewDowStart("");
      setNewDowEnd("");
      if (!defaultsMap[clientId]) {
        await fetchDefaults(clientId);
      }
    }
  };

  const handleDowServiceChange = (id: number) => {
    setNewDowServiceId(id);
    const st = serviceTypes.find((s) => s.id === id);
    if (st && newDowStart) {
      setNewDowEnd(addMinutes(newDowStart, st.defaultMinutes));
    }
  };

  const handleDowStartChange = (time: string) => {
    setNewDowStart(time);
    const st = serviceTypes.find((s) => s.id === newDowServiceId);
    if (st) {
      setNewDowEnd(addMinutes(time, st.defaultMinutes));
    }
  };

  const toggleDay = (day: number) => {
    setNewDow((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectAllDays = () => {
    setNewDow([0, 1, 2, 3, 4, 5, 6]);
  };

  const addDefaultService = async (clientId: number) => {
    if (newDow.length === 0 || !newDowServiceId || !newDowStart || !newDowEnd) return;
    setDowSaving(true);
    for (const day of newDow) {
      await fetch("/api/default-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          serviceTypeId: newDowServiceId,
          dayOfWeek: day,
          startTime: newDowStart,
          endTime: newDowEnd,
        }),
      });
    }
    setNewDow([]);
    setNewDowStart("");
    setNewDowEnd("");
    await fetchDefaults(clientId);
    setDowSaving(false);
  };

  const deleteDefaultService = async (id: number, clientId: number) => {
    if (!confirm("このデフォルトサービスを削除しますか？")) return;
    await fetch(`/api/default-services?id=${id}`, { method: "DELETE" });
    await fetchDefaults(clientId);
  };

  const addClient = async () => {
    if (!newLastName.trim() || !newFirstName.trim()) return;
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastName: newLastName.trim(),
        firstName: newFirstName.trim(),
        gender: newGender,
        defaultServiceId: newServiceId || null,
        signatureMode: newSignatureMode,
      }),
    });
    setNewLastName("");
    setNewFirstName("");
    setNewSignatureMode("stamp");
    fetchData();
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id);
    setEditLastName(c.lastName);
    setEditFirstName(c.firstName);
    setEditGender(c.gender);
    setEditServiceId(c.defaultServiceId ?? "");
    setEditSignatureMode(c.signatureMode ?? "stamp");
    setErrorMsg("");
    setExpandedDefaultsId(null);
  };

  const saveEdit = async () => {
    if (!editLastName.trim() || !editFirstName.trim()) return;
    await fetch("/api/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        lastName: editLastName.trim(),
        firstName: editFirstName.trim(),
        gender: editGender,
        defaultServiceId: editServiceId || null,
        signatureMode: editSignatureMode,
      }),
    });
    setEditingId(null);
    fetchData();
  };

  const deleteClient = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除してよいですか？`)) return;
    setErrorMsg("");
    const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error);
    } else {
      fetchData();
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">読み込み中...</p></div>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">利用者管理</h1>
        <Link href="/admin" className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">← 管理者画面</Link>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {errorMsg}
        </div>
      )}

      {/* 新規追加 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="font-bold text-gray-700 mb-3">新規利用者を追加</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              placeholder="姓（名字）"
              className="flex-1 border border-gray-300 rounded-lg p-3"
            />
            <input
              type="text"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              placeholder="名（名前）"
              className="flex-1 border border-gray-300 rounded-lg p-3"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={newGender}
              onChange={(e) => setNewGender(e.target.value)}
              className="border border-gray-300 rounded-lg p-3"
            >
              <option value="女">女</option>
              <option value="男">男</option>
            </select>
            <select
              value={newServiceId}
              onChange={(e) => setNewServiceId(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="flex-1 border border-gray-300 rounded-lg p-3"
            >
              <option value="">デフォルトサービスなし</option>
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}（{st.defaultMinutes}分）
                </option>
              ))}
            </select>
          </div>
          {/* 確認方法 */}
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">ご利用者確認方法</label>
            <div className="flex gap-2">
              {["stamp", "handwritten"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setNewSignatureMode(mode)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    newSignatureMode === mode
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {mode === "stamp" ? "電子印" : "手書きサイン"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={addClient}
            className="w-full bg-blue-600 text-white rounded-lg p-3 font-bold hover:bg-blue-700"
          >
            追加
          </button>
        </div>
      </div>

      {/* 一覧 */}
      <div className="space-y-2">
        {clients.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {editingId === c.id ? (
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    placeholder="姓"
                    className="flex-1 border border-blue-300 rounded-lg p-2"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder="名"
                    className="flex-1 border border-blue-300 rounded-lg p-2"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2"
                  >
                    <option value="女">女</option>
                    <option value="男">男</option>
                  </select>
                  <select
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value === "" ? "" : parseInt(e.target.value))}
                    className="flex-1 border border-gray-300 rounded-lg p-2"
                  >
                    <option value="">デフォルトサービスなし</option>
                    {serviceTypes.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}（{st.defaultMinutes}分）
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">ご利用者確認方法</label>
                  <div className="flex gap-2">
                    {["stamp", "handwritten"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setEditSignatureMode(mode)}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          editSignatureMode === mode
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {mode === "stamp" ? "電子印" : "手書きサイン"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-2 font-bold text-sm"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold text-sm hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 基本情報 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-gray-800">{c.lastName}{c.firstName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{c.gender}</span>
                      <button
                        onClick={() => startEdit(c)}
                        className="text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg px-3 py-1 hover:bg-yellow-100"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteClient(c.id, c.lastName + c.firstName)}
                        className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {c.defaultService && (
                      <span>通常: {c.defaultService.name}（{c.defaultService.defaultMinutes}分）</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full border ${
                      c.signatureMode === "handwritten"
                        ? "bg-purple-50 text-purple-600 border-purple-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {SIG_LABELS[c.signatureMode] ?? "電子印"}
                    </span>
                  </div>

                  {/* 週間デフォルト設定ボタン */}
                  <button
                    onClick={() => toggleExpandDefaults(c.id)}
                    className={`mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      expandedDefaultsId === c.id
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    <span>週間デフォルトサービス設定</span>
                    <span>{expandedDefaultsId === c.id ? "▲ 閉じる" : "▼ 開く・編集"}</span>
                  </button>
                </div>

                {/* 週間デフォルト展開エリア */}
                {expandedDefaultsId === c.id && (
                  <div className="border-t border-green-200 bg-green-50 p-4">
                    <h3 className="text-sm font-bold text-green-800 mb-3">週間デフォルトサービス</h3>

                    {/* 既存デフォルト一覧 */}
                    {!defaultsMap[c.id] ? (
                      <p className="text-sm text-gray-400 mb-3">読み込み中...</p>
                    ) : defaultsMap[c.id].length === 0 ? (
                      <p className="text-sm text-gray-400 mb-3">デフォルトサービスが登録されていません</p>
                    ) : (
                      <div className="space-y-1 mb-4">
                        {DAY_LABELS.map((dayLabel, dayIdx) => {
                          const items = defaultsMap[c.id].filter((d) => d.dayOfWeek === dayIdx);
                          if (items.length === 0) return null;
                          return (
                            <div key={dayIdx} className="flex items-start gap-2">
                              <span className="text-xs font-bold text-green-700 w-4 mt-1">{dayLabel}</span>
                              <div className="flex-1 flex flex-wrap gap-1">
                                {items.map((item) => (
                                  <div key={item.id} className="flex items-center gap-1 bg-white border border-green-200 rounded-lg px-2 py-1 text-xs">
                                    <span className="text-gray-700 font-medium">{item.serviceTypeName}</span>
                                    <span className="text-gray-500">{item.startTime}〜{item.endTime}</span>
                                    <button
                                      onClick={() => deleteDefaultService(item.id, c.id)}
                                      className="text-red-400 hover:text-red-600 ml-1 font-bold"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 新規追加フォーム */}
                    <div className="bg-white border border-green-200 rounded-lg p-3 space-y-3">
                      <p className="text-xs font-bold text-gray-600">デフォルトサービスを追加</p>

                      {/* 曜日選択 */}
                      <div>
                        <div className="flex gap-1 flex-wrap mb-1">
                          <button
                            onClick={selectAllDays}
                            className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                              newDow.length === 7
                                ? "bg-green-500 text-white border-green-500"
                                : "bg-white text-green-700 border-green-300 hover:bg-green-50"
                            }`}
                          >
                            毎日
                          </button>
                          {DAY_LABELS.map((label, idx) => (
                            <button
                              key={idx}
                              onClick={() => toggleDay(idx)}
                              className={`w-8 h-8 rounded text-xs font-bold border transition-colors ${
                                newDow.includes(idx)
                                  ? "bg-green-500 text-white border-green-500"
                                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {newDow.length > 0 && (
                          <p className="text-xs text-green-600">
                            選択中: {newDow.sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join("・")}
                          </p>
                        )}
                      </div>

                      {/* サービス種別 */}
                      <select
                        value={newDowServiceId}
                        onChange={(e) => handleDowServiceChange(parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      >
                        {serviceTypes.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}（{st.defaultMinutes}分）
                          </option>
                        ))}
                      </select>

                      {/* 時間 */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={newDowStart}
                          onChange={(e) => handleDowStartChange(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                        />
                        <span className="text-gray-400">〜</span>
                        <input
                          type="time"
                          value={newDowEnd}
                          onChange={(e) => setNewDowEnd(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <button
                        onClick={() => addDefaultService(c.id)}
                        disabled={dowSaving || newDow.length === 0 || !newDowServiceId || !newDowStart || !newDowEnd}
                        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
                      >
                        {dowSaving ? "追加中..." : "追加"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {clients.length === 0 && (
          <p className="text-gray-400 text-center py-8">利用者が登録されていません</p>
        )}
      </div>
    </div>
  );
}
