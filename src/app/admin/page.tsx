"use client";

import Link from "next/link";

const menuItems = [
  { href: "/admin/helpers", title: "ヘルパー管理", desc: "ヘルパーの登録・編集" },
  { href: "/admin/clients", title: "利用者管理", desc: "利用者の登録・編集・デフォルトサービス設定" },
  { href: "/admin/services", title: "サービス種別管理", desc: "サービス種別の追加・編集" },
  { href: "/admin/records", title: "記録一覧", desc: "全記録の確認・検索" },
  { href: "/admin/export", title: "PDF / CSV出力", desc: "利用者別・期間指定で出力" },
  { href: "/admin/performance", title: "実績出力", desc: "月別・利用者別の予実カレンダー出力" },
  { href: "/admin/settings", title: "設定", desc: "事業所名・サービス提供責任者名の設定" },
];

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">管理者画面</h1>
        <Link href="/" className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
          ← ヘルパー選択
        </Link>
      </div>

      <div className="space-y-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-800">{item.title}</h2>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
