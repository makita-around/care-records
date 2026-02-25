import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

const BROWSER_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

async function findBrowser(): Promise<string | null> {
  for (const p of BROWSER_CANDIDATES) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return null;
}

export async function POST(request: Request) {
  const { html, fileName } = await request.json();

  const browser = await findBrowser();
  if (!browser) {
    return Response.json(
      { error: "Chrome/Edgeが見つかりません" },
      { status: 500 }
    );
  }

  const stamp = Date.now();
  const tmpDir = os.tmpdir();
  const htmlFile = path.join(tmpDir, `pdf-src-${stamp}.html`);
  const pdfFile = path.join(tmpDir, `pdf-out-${stamp}.pdf`);

  try {
    await fs.writeFile(htmlFile, html, "utf-8");

    // Chrome headless で HTML → PDF
    // @page CSS の size/margin/orientation をそのまま反映してくれる
    const fileUrl = "file:///" + htmlFile.replace(/\\/g, "/");
    const cmd = `"${browser}" --headless=new --disable-gpu --no-sandbox --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfFile}" "${fileUrl}"`;

    await execAsync(cmd, { timeout: 30000 });

    const pdfBuffer = await fs.readFile(pdfFile);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName + ".pdf")}`,
      },
    });
  } catch (err) {
    console.error("PDF生成エラー:", err);
    return Response.json({ error: "PDF生成に失敗しました" }, { status: 500 });
  } finally {
    try { await fs.unlink(htmlFile); } catch {}
    try { await fs.unlink(pdfFile); } catch {}
  }
}
