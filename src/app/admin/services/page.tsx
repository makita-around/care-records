"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ServiceType = { id: number; name: string; defaultMinutes: number; active: boolean };

export default function ServicesAdminPage() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [newName, setNewName] = useState("");
  const [newMinutes, setNewMinutes] = useState(40);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMinutes, setEditMinutes] = useState(40);

  const fetchServices = async () => {
    const res = await fetch("/api/service-types");
    setServices(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const addService = async () => {
    if (!newName.trim()) return;
    await fetch("/api/service-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), defaultMinutes: newMinutes }),
    });
    setNewName("");
    setNewMinutes(40);
    fetchServices();
  };

  const startEdit = (s: ServiceType) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditMinutes(s.defaultMinutes);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await fetch("/api/service-types", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, name: editName.trim(), defaultMinutes: editMinutes }),
    });
    setEditingId(null);
    fetchServices();
  };

  const deleteService = async (s: ServiceType) => {
    if (!confirm(`「${s.name}」を削除しますか？\n※過去の記録や週間設定で使用中の場合は無効化されます。`)) return;
    const res = await fetch(`/api/service-types?id=${s.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.deactivated) {
      alert(`「${s.name}」は使用中のため無効化しました。`);
    }
    fetchServices();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">読み込み中...</p></div>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">サービス種別管理</h1>
        <Link href="/admin" className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">← 管理者画面</Link>
      </div>

      {/* 注意書き */}
      <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4 text-sm text-red-700">
        <span className="font-bold">【注意】</span> サービス種別の名称を変更すると、過去に入力した記録も新しい名称で表示されます。再出力したPDFにも反映されます。
      </div>

      {/* 新規追加 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="font-bold text-gray-700 mb-3">新規サービス種別を追加</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="サービス名"
            className="flex-1 border border-gray-300 rounded-lg p-3"
          />
          <input
            type="number"
            value={newMinutes}
            onChange={(e) => setNewMinutes(parseInt(e.target.value) || 0)}
            className="w-20 border border-gray-300 rounded-lg p-3 text-center"
          />
          <span className="self-center text-gray-500">分</span>
        </div>
        <button
          onClick={addService}
          className="w-full mt-3 bg-blue-600 text-white rounded-lg p-3 font-bold hover:bg-blue-700"
        >
          追加
        </button>
      </div>

      {/* 一覧 */}
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-4">
            {editingId === s.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border border-blue-300 rounded-lg p-2"
                    autoFocus
                  />
                  <input
                    type="number"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(parseInt(e.target.value) || 0)}
                    className="w-20 border border-blue-300 rounded-lg p-2 text-center"
                  />
                  <span className="self-center text-gray-500">分</span>
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
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-gray-800">{s.name}</span>
                  <span className="ml-3 text-sm text-gray-500">{s.defaultMinutes}分</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg px-3 py-1 hover:bg-yellow-100"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteService(s)}
                    className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
