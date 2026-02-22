"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Helper = { id: number; lastName: string; firstName: string; active: boolean; isGuest: boolean };

export default function HelpersAdminPage() {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [newLastName, setNewLastName] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLastName, setEditLastName] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHelpers = async () => {
    const res = await fetch("/api/helpers?all=1");
    setHelpers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchHelpers(); }, []);

  const addHelper = async () => {
    if (!newLastName.trim() || !newFirstName.trim()) return;
    await fetch("/api/helpers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastName: newLastName.trim(), firstName: newFirstName.trim() }),
    });
    setNewLastName("");
    setNewFirstName("");
    fetchHelpers();
  };

  const startEdit = (h: Helper) => {
    setEditingId(h.id);
    setEditLastName(h.lastName);
    setEditFirstName(h.firstName);
    setErrorMsg("");
  };

  const saveEdit = async () => {
    if (!editLastName.trim() || !editFirstName.trim()) return;
    await fetch("/api/helpers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, lastName: editLastName.trim(), firstName: editFirstName.trim() }),
    });
    setEditingId(null);
    fetchHelpers();
  };

  const deleteHelper = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除してよいですか？`)) return;
    setErrorMsg("");
    const res = await fetch(`/api/helpers?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error);
    } else {
      fetchHelpers();
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">読み込み中...</p></div>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">ヘルパー管理</h1>
        <Link href="/admin" className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">← 管理者画面</Link>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {errorMsg}
        </div>
      )}

      {/* 新規追加 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="font-bold text-gray-700 mb-3">新規ヘルパーを追加</h2>
        <div className="flex gap-2 mb-3">
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
            onKeyDown={(e) => e.key === "Enter" && addHelper()}
            placeholder="名（名前）"
            className="flex-1 border border-gray-300 rounded-lg p-3"
          />
        </div>
        <button
          onClick={addHelper}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
        >
          追加
        </button>
      </div>

      {/* 一覧 */}
      <div className="space-y-2">
        {helpers.map((h) => (
          <div key={h.id} className="bg-white border border-gray-200 rounded-lg p-4">
            {editingId === h.id ? (
              /* 編集フォーム */
              <div>
                <div className="flex gap-2 mb-3">
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
              /* 通常表示 */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-800">{h.lastName}{h.firstName}</span>
                  {h.isGuest && (
                    <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                      ゲスト
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/records?helperId=${h.id}&helperName=${encodeURIComponent(h.lastName + h.firstName)}`}
                    className="text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-100"
                  >
                    記録
                  </Link>
                  <button
                    onClick={() => startEdit(h)}
                    className="text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg px-3 py-1 hover:bg-yellow-100"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteHelper(h.id, h.lastName + h.firstName)}
                    className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {helpers.length === 0 && (
          <p className="text-gray-400 text-center py-8">ヘルパーが登録されていません</p>
        )}
      </div>
    </div>
  );
}
