"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: number;
  lastName: string;
  firstName: string;
  gender: string;
  defaultService?: { name: string } | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [helperName, setHelperName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const name = sessionStorage.getItem("helperName");
    if (!name) {
      router.push("/");
      return;
    }
    setHelperName(name);

    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/")}
          className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          ← ヘルパー選択
        </button>
        <span className="text-sm text-gray-500">
          担当: <span className="font-bold text-gray-800">{helperName}</span>
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">利用者一覧</h1>
        <button
          onClick={() => router.push("/daily-records")}
          className="bg-orange-500 text-white text-sm px-3 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors"
        >
          本日の記録一覧
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">利用者が登録されていません</p>
          <a href="/admin/clients" className="text-blue-600 underline">
            管理者画面で利用者を登録する
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => router.push(`/records/${client.id}`)}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800">
                  {client.lastName}{client.firstName}
                </span>
                <span className="text-sm text-gray-400">
                  {client.gender}
                </span>
              </div>
              {client.defaultService && (
                <span className="text-xs text-gray-500 mt-1 block">
                  通常: {client.defaultService.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
