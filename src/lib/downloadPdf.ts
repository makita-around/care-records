/**
 * サーバーサイド（Chrome headless）でPDFを生成してダウンロードする
 */
export async function downloadPdf(
  fullHtml: string,
  fileName: string,
  _orientation: "portrait" | "landscape" = "portrait"
) {
  // @page { size: A4 landscape/portrait } が HTML 内の CSS に含まれているため
  // orientation パラメータは Chrome が CSS から自動判別する

  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: fullHtml, fileName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "PDF生成に失敗しました");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
