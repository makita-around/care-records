"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Helper = {
  id: number;
  lastName: string;
  firstName: string;
};

export default function Home() {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestLastName, setGuestLastName] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestSaving, setGuestSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/helpers")
      .then((res) => res.json())
      .then((data) => {
        setHelpers(data);
        setLoading(false);
      });
  }, []);

  const selectHelper = (helper: Helper) => {
    sessionStorage.setItem("helperId", String(helper.id));
    sessionStorage.setItem("helperName", `${helper.lastName}${helper.firstName}`);
    sessionStorage.setItem("helperLastName", helper.lastName);
    router.push("/clients");
  };

  const handleGuestLogin = async () => {
    if (!guestLastName.trim() || !guestFirstName.trim()) return;
    setGuestSaving(true);
    const res = await fetch("/api/helpers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastName: guestLastName.trim(),
        firstName: guestFirstName.trim(),
        isGuest: true,
      }),
    });
    const helper = await res.json();
    sessionStorage.setItem("helperId", String(helper.id));
    sessionStorage.setItem("helperName", `${helper.lastName}${helper.firstName}`);
    sessionStorage.setItem("helperLastName", helper.lastName);
    router.push("/clients");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        訪問介護 サービス提供記録
      </h1>
      <p className="text-gray-500 mb-8">担当ヘルパーを選択してください</p>

      {helpers.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-500 mb-4">ヘルパーが登録されていません</p>
          <a href="/admin/helpers" className="text-blue-600 underline">
            管理者画面でヘルパーを登録する
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {helpers.map((helper) => (
            <button
              key={helper.id}
              onClick={() => selectHelper(helper)}
              className="bg-white border-2 border-blue-200 rounded-xl p-6 text-center text-xl font-bold text-blue-700 hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 transition-colors shadow-sm"
            >
              {helper.lastName}{helper.firstName}
            </button>
          ))}
        </div>
      )}

      {/* ゲスト入力 */}
      <div className="mt-6 w-full max-w-md">
        {!showGuestForm ? (
          <button
            onClick={() => setShowGuestForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors text-sm"
          >
            ゲスト（臨時職員）として入力する
          </button>
        ) : (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-600 mb-3">臨時職員のお名前を入力</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                placeholder="姓（名字）"
                className="flex-1 border border-gray-300 rounded-lg p-3 text-lg"
                autoFocus
              />
              <input
                type="text"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuestLogin()}
                placeholder="名（名前）"
                className="flex-1 border border-gray-300 rounded-lg p-3 text-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowGuestForm(false); setGuestLastName(""); setGuestFirstName(""); }}
                className="flex-1 bg-gray-200 text-gray-600 rounded-lg p-3 font-bold"
              >
                キャンセル
              </button>
              <button
                onClick={handleGuestLogin}
                disabled={guestSaving || !guestLastName.trim() || !guestFirstName.trim()}
                className="flex-1 bg-green-600 text-white rounded-lg p-3 font-bold hover:bg-green-700 disabled:bg-gray-300"
              >
                {guestSaving ? "..." : "入力して開始"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <a
          href="/admin/records?readonly=1"
          className="text-sm bg-orange-50 text-orange-600 border border-orange-200 rounded-lg px-5 py-2 hover:bg-orange-100 transition-colors"
        >
          記録一覧を確認する
        </a>
        <a
          href="/admin"
          className="text-sm bg-gray-700 text-white rounded-lg px-8 py-3 font-bold hover:bg-gray-800 transition-colors shadow-sm"
        >
          管理者画面
        </a>
      </div>
    </div>
  );
}
