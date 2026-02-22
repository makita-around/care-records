"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DEFAULT_BODY_ITEMS = [
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
const DEFAULT_LIFE_ITEMS = [
  { key: "checkCleaning", label: "掃除" },
  { key: "checkLaundry", label: "洗濯" },
  { key: "checkClothes", label: "衣服整理" },
  { key: "checkSheets", label: "シーツ交換" },
  { key: "checkBathPrep", label: "入浴準備" },
  { key: "checkLifeOther", label: "その他" },
];
const ALL_DEFAULT_ITEMS = [...DEFAULT_BODY_ITEMS, ...DEFAULT_LIFE_ITEMS];

export default function SettingsPage() {
  const [coordinator, setCoordinator] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [signatureMode, setSignatureMode] = useState<"stamp" | "handwritten">("stamp");
  const [checkLabels, setCheckLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setCoordinator(data.coordinator || "");
        setOfficeName(data.officeName || "");
        setSignatureMode(data.signatureMode === "handwritten" ? "handwritten" : "stamp");
        const labels: Record<string, string> = {};
        for (const item of ALL_DEFAULT_ITEMS) {
          labels[item.key] = data[`checkLabel_${item.key}`] || item.label;
        }
        setCheckLabels(labels);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const checkLabelSettings: Record<string, string> = {};
    for (const item of ALL_DEFAULT_ITEMS) {
      checkLabelSettings[`checkLabel_${item.key}`] = checkLabels[item.key] || item.label;
    }
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinator, officeName, signatureMode, ...checkLabelSettings }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">読み込み中...</p></div>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">設定</h1>
        <Link href="/admin" className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">← 管理者画面</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4 mb-4">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">事業所名</label>
          <input
            type="text"
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            placeholder="例：○○訪問介護事業所"
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">サービス提供責任者名</label>
          <input
            type="text"
            value={coordinator}
            onChange={(e) => setCoordinator(e.target.value)}
            placeholder="例：山田 花子"
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">ご利用者確認の方法</label>
          <div className="flex gap-3">
            <button
              onClick={() => setSignatureMode("stamp")}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold transition-colors ${
                signatureMode === "stamp"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              <div className="text-2xl mb-1">印</div>
              タップ押印
            </button>
            <button
              onClick={() => setSignatureMode("handwritten")}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold transition-colors ${
                signatureMode === "handwritten"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              <div className="text-2xl mb-1">✍️</div>
              手書きサイン
            </button>
          </div>
        </div>
      </div>

      {/* チェック項目名称 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
        <h2 className="font-bold text-gray-700 mb-2">チェック項目の名称</h2>
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-3 text-sm text-red-700">
          <span className="font-bold">【注意】</span> 名称を変更すると、過去に入力した記録も新しい名称で表示されます。再出力したPDFにも反映されます。
        </div>

        <div className="mb-3">
          <p className="text-xs font-bold text-blue-700 mb-2 bg-blue-50 rounded px-2 py-1">身体介護</p>
          <div className="space-y-2">
            {DEFAULT_BODY_ITEMS.map((item) => (
              <div key={item.key}>
                <input
                  type="text"
                  value={checkLabels[item.key] ?? item.label}
                  onChange={(e) => setCheckLabels((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-green-700 mb-2 bg-green-50 rounded px-2 py-1">生活援助</p>
          <div className="space-y-2">
            {DEFAULT_LIFE_ITEMS.map((item) => (
              <div key={item.key}>
                <input
                  type="text"
                  value={checkLabels[item.key] ?? item.label}
                  onChange={(e) => setCheckLabels((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white rounded-lg p-4 font-bold hover:bg-blue-700 disabled:bg-gray-300"
      >
        {saved ? "保存しました" : saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
