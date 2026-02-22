"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type ServiceType = {
  id: number;
  name: string;
  defaultMinutes: number;
};

type RecordType = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  bodycare: boolean;
  lifeSupport: boolean;
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
  note: string;
  confirmed: boolean;
  signatureData: string;
  helper: { id: number; lastName: string; firstName: string };
  serviceType: { id: number; name: string; defaultMinutes: number };
  helperId: number;
};

type ClientType = {
  id: number;
  lastName: string;
  firstName: string;
  gender: string;
  defaultServiceId: number | null;
  signatureMode: string;
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

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function calcMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// はんこ型電子印コンポーネント（名字のみ）
function StampSeal({ lastName }: { lastName: string }) {
  const chars = lastName.split("");
  return (
    <div className="w-16 h-16 rounded-full border-[3px] border-red-500 flex flex-col items-center justify-center bg-white shadow-sm">
      {chars.map((char, i) => (
        <span key={i} className="text-red-500 font-bold leading-none" style={{ fontSize: chars.length === 1 ? "1.4rem" : chars.length === 2 ? "1.1rem" : "0.9rem" }}>
          {char}
        </span>
      ))}
    </div>
  );
}

// 手書きサインキャンバスコンポーネント
function SignatureCanvas({ onSigned, existingData, onClear }: {
  onSigned: (data: string) => void;
  existingData: string;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hasDrawnRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (existingData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = existingData;
      hasDrawnRef.current = true;
    }
  }, [existingData]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    lastPosRef.current = pos;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
    hasDrawnRef.current = true;
  };

  const endDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (hasDrawnRef.current && canvasRef.current) {
      onSigned(canvasRef.current.toDataURL("image/png"));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasDrawnRef.current = false;
    onClear();
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "120px", touchAction: "none" }}
        className="border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-crosshair"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <button
        type="button"
        onClick={handleClear}
        className="mt-1 text-xs text-gray-400 underline"
      >
        クリア
      </button>
    </div>
  );
}

export default function RecordPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientType | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [helperId, setHelperId] = useState<number>(0);
  const [helperName, setHelperName] = useState("");
  const [loading, setLoading] = useState(true);
  const [signatureMode, setSignatureMode] = useState<"stamp" | "handwritten">("stamp");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [serviceTypeId, setServiceTypeId] = useState<number>(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [todayDefaults, setTodayDefaults] = useState<DefaultWeeklyService[]>([]);
  const [checkLabels, setCheckLabels] = useState<Record<string, string>>({});

  const checkItemsBody = DEFAULT_CHECK_ITEMS_BODY.map((item) => ({
    key: item.key,
    label: checkLabels[item.key] || item.label,
  }));
  const checkItemsLife = DEFAULT_CHECK_ITEMS_LIFE.map((item) => ({
    key: item.key,
    label: checkLabels[item.key] || item.label,
  }));

  useEffect(() => {
    const hId = sessionStorage.getItem("helperId");
    const hName = sessionStorage.getItem("helperName");
    if (!hId || !hName) {
      router.push("/");
      return;
    }
    setHelperId(parseInt(hId));
    setHelperName(hName);

    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/service-types").then((r) => r.json()),
      fetch(`/api/records?clientId=${clientId}&date=${selectedDate}`).then((r) => r.json()),
      fetch(`/api/default-services?clientId=${clientId}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([clients, types, recs, defaults, settings]) => {
      const labels: Record<string, string> = {};
      for (const item of [...DEFAULT_CHECK_ITEMS_BODY, ...DEFAULT_CHECK_ITEMS_LIFE]) {
        if (settings[`checkLabel_${item.key}`]) {
          labels[item.key] = settings[`checkLabel_${item.key}`];
        }
      }
      setCheckLabels(labels);
      const c = clients.find((cl: ClientType) => cl.id === parseInt(clientId));
      setClient(c || null);
      setServiceTypes(types);
      setRecords(recs);
      setSignatureMode(c?.signatureMode === "handwritten" ? "handwritten" : "stamp");

      // 今日の曜日でデフォルトをフィルタ（selectedDateの曜日）
      const dateObj = new Date(selectedDate + "T00:00:00");
      const dow = dateObj.getDay(); // 0=日...6=土
      setTodayDefaults((defaults as DefaultWeeklyService[]).filter((d) => d.dayOfWeek === dow));

      if (c?.defaultServiceId) {
        setServiceTypeId(c.defaultServiceId);
      } else if (types.length > 0) {
        setServiceTypeId(types[0].id);
      }

      setLoading(false);
    });
  }, [clientId, router, selectedDate]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setStartTime("");
    setEndTime("");
    setChecks({});
    setNote("");
    setConfirmed(false);
    setSignatureData("");
    if (client?.defaultServiceId) {
      setServiceTypeId(client.defaultServiceId);
    }
  }, [client]);

  const openNewForm = () => {
    resetForm();
    const now = new Date();
    setStartTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    );
    const st = serviceTypes.find((s) => s.id === (client?.defaultServiceId || serviceTypeId));
    if (st) {
      const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setEndTime(addMinutes(nowStr, st.defaultMinutes));
    }
    setShowForm(true);
  };

  const openFormFromDefault = (def: DefaultWeeklyService) => {
    resetForm();
    setServiceTypeId(def.serviceTypeId);
    setStartTime(def.startTime);
    setEndTime(def.endTime);
    setShowForm(true);
  };

  const openEditForm = (record: RecordType) => {
    if (record.helperId !== helperId) return;
    setEditingId(record.id);
    setServiceTypeId(record.serviceType.id);
    setStartTime(record.startTime);
    setEndTime(record.endTime);
    const newChecks: Record<string, boolean> = {};
    [...checkItemsBody, ...checkItemsLife].forEach((item) => {
      newChecks[item.key] = (record as unknown as Record<string, boolean>)[item.key] || false;
    });
    setChecks(newChecks);
    setNote(record.note);
    setConfirmed(record.confirmed);
    setSignatureData(record.signatureData || "");
    setShowForm(true);
  };

  const handleServiceTypeChange = (id: number) => {
    setServiceTypeId(id);
    const st = serviceTypes.find((s) => s.id === id);
    if (st && startTime) {
      setEndTime(addMinutes(startTime, st.defaultMinutes));
    }
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    const st = serviceTypes.find((s) => s.id === serviceTypeId);
    if (st) {
      setEndTime(addMinutes(time, st.defaultMinutes));
    }
  };

  const toggleCheck = (key: string) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!startTime || !endTime) return;
    setSaving(true);

    const totalMinutes = calcMinutes(startTime, endTime);
    const st = serviceTypes.find((s) => s.id === serviceTypeId);
    const isBody = st ? st.name.includes("身体") || st.name.includes("身1") || st.name.includes("新身") : false;
    const isLife = st ? st.name.includes("生活") || st.name.includes("生1") || st.name.includes("独自") : false;

    const data = {
      id: editingId,
      clientId: parseInt(clientId),
      helperId,
      serviceTypeId,
      date: selectedDate,
      startTime,
      endTime,
      totalMinutes,
      bodycare: isBody,
      lifeSupport: isLife,
      ...Object.fromEntries(
        [...checkItemsBody, ...checkItemsLife].map((item) => [
          item.key,
          checks[item.key] || false,
        ])
      ),
      note,
      confirmed,
      signatureData,
    };

    const method = editingId ? "PUT" : "POST";
    const res = await fetch("/api/records", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const saved = await res.json();

    if (editingId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === saved.id ? saved : r))
      );
    } else {
      setRecords((prev) => [...prev, saved]);
    }

    setShowForm(false);
    resetForm();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">読み込み中...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">利用者が見つかりません</p>
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
        <h1 className="text-xl font-bold text-gray-800">{client.lastName}{client.firstName}</h1>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setShowForm(false);
              resetForm();
            }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          {selectedDate !== getToday() && (
            <button
              onClick={() => {
                setSelectedDate(getToday());
                setShowForm(false);
                resetForm();
              }}
              className="text-xs text-blue-600 underline"
            >
              今日に戻す
            </button>
          )}
        </div>
      </div>

      {/* 本日のデフォルトサービス */}
      {todayDefaults.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold text-green-700 mb-2">本日のデフォルトサービス</h2>
          <div className="space-y-2">
            {todayDefaults.map((def) => (
              <button
                key={def.id}
                onClick={() => openFormFromDefault(def)}
                className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 hover:bg-green-100 active:bg-green-200 transition-colors text-left"
              >
                <div>
                  <span className="font-bold text-green-800">{def.serviceTypeName}</span>
                  <span className="ml-2 text-sm text-green-600">{def.startTime}〜{def.endTime}</span>
                </div>
                <span className="text-sm text-green-700 font-medium">記録する →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 既存の記録一覧 */}
      {records.length > 0 && (
        <div className="space-y-3 mb-4">
          <h2 className="text-sm font-bold text-gray-600">{selectedDate === getToday() ? "本日" : selectedDate.replace(/-/g, "/")}の記録</h2>
          {records.map((record) => (
            <div
              key={record.id}
              onClick={() => openEditForm(record)}
              className={`bg-white rounded-lg border p-3 shadow-sm ${
                record.helperId === helperId
                  ? "border-blue-200 cursor-pointer hover:bg-blue-50"
                  : "border-gray-200"
              }`}
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
                {[...checkItemsBody, ...checkItemsLife]
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
                <p className="text-sm text-gray-600 mt-1">📝 {record.note}</p>
              )}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>担当: {record.helper.lastName}{record.helper.firstName}</span>
                {record.confirmed && (
                  <div className="flex items-center gap-2">
                    {record.signatureData ? (
                      <img
                        src={record.signatureData}
                        alt="サイン"
                        className="h-8 object-contain"
                      />
                    ) : (
                      <StampSeal lastName={client.lastName} />
                    )}
                    <span className="text-red-500 font-bold">確認済 ✓</span>
                  </div>
                )}
                {record.helperId === helperId && (
                  <span className="text-blue-400">タップで編集</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新規記録ボタン */}
      {!showForm && (
        <button
          onClick={openNewForm}
          className="w-full bg-blue-600 text-white rounded-lg p-4 text-lg font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow"
        >
          ＋ 新しい記録を追加
        </button>
      )}

      {/* 記録入力フォーム */}
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-blue-300 p-4 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editingId ? "記録を編集" : "新しい記録"}
          </h2>

          {/* サービス種別 */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-600 mb-1">
              サービス種別
            </label>
            <select
              value={serviceTypeId}
              onChange={(e) => handleServiceTypeChange(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-3 text-lg"
            >
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* 時間 */}
          <div className="flex gap-2 items-center mb-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-600 mb-1">
                開始
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-lg"
              />
            </div>
            <span className="text-gray-400 mt-6">〜</span>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-600 mb-1">
                終了
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-lg"
              />
            </div>
            {startTime && endTime && (
              <span className="text-sm text-gray-500 mt-6">
                {calcMinutes(startTime, endTime)}分
              </span>
            )}
          </div>

          {/* チェック項目 - 身体介護 */}
          <div className="mb-3">
            <label className="block text-sm font-bold text-gray-600 mb-2">
              身体介護
            </label>
            <div className="grid grid-cols-2 gap-2">
              {checkItemsBody.map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleCheck(item.key)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    checks[item.key]
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {checks[item.key] ? "✓ " : ""}{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* チェック項目 - 生活援助 */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-600 mb-2">
              生活援助
            </label>
            <div className="grid grid-cols-2 gap-2">
              {checkItemsLife.map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleCheck(item.key)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                    checks[item.key]
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {checks[item.key] ? "✓ " : ""}{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 特記事項 */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-600 mb-1">
              特記事項
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="特記事項があれば入力..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>

          {/* ご利用者確認 */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-600 mb-2">
              ご利用者確認
            </label>

            {signatureMode === "stamp" ? (
              /* タップ押印モード */
              <button
                onClick={() => setConfirmed(!confirmed)}
                className={`w-full p-4 rounded-lg border-2 flex items-center justify-center gap-3 transition-colors ${
                  confirmed
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                {confirmed ? (
                  <>
                    <StampSeal lastName={client.lastName} />
                    <span className="text-red-500 font-bold">確認済み（タップで解除）</span>
                  </>
                ) : (
                  <span className="text-gray-400">タップして押印する</span>
                )}
              </button>
            ) : (
              /* 手書きサインモード */
              <div className={`rounded-lg border-2 p-3 ${confirmed ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-white"}`}>
                {confirmed && signatureData ? (
                  <div className="flex items-center gap-3">
                    <img src={signatureData} alt="サイン" className="h-16 object-contain border rounded" />
                    <div>
                      <p className="text-blue-700 font-bold text-sm">サイン済み</p>
                      <button
                        onClick={() => { setConfirmed(false); setSignatureData(""); }}
                        className="text-xs text-gray-400 underline mt-1"
                      >
                        やり直す
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">下の枠内にサインをお願いします</p>
                    <SignatureCanvas
                      existingData=""
                      onSigned={(data) => {
                        setSignatureData(data);
                        setConfirmed(true);
                      }}
                      onClear={() => {
                        setSignatureData("");
                        setConfirmed(false);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 保存・キャンセル */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="flex-1 bg-gray-200 text-gray-700 rounded-lg p-3 font-bold"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !startTime || !endTime}
              className="flex-1 bg-blue-600 text-white rounded-lg p-3 font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
