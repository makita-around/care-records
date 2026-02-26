import re

bat_path = r"C:\Users\user\Desktop\訪問介護アプリ_配布用\初回セットアップ.bat"

with open(bat_path, "rb") as f:
    raw = f.read()

# 現在のエンコーディングを検出して読み込み
for enc in ("utf-8-sig", "utf-8", "cp932"):
    try:
        content = raw.decode(enc)
        detected = enc
        break
    except:
        continue

# cd コマンドの直後に .env 作成ステップを挿入
old = "cd /d C:\\訪問介護アプリ\n"
new = (
    "cd /d C:\\訪問介護アプリ\n\n"
    ":: .envファイルの作成\n"
    "echo DATABASE_URL=\"file:./dev.db\" > C:\\訪問介護アプリ\\.env\n"
)

if old in content:
    content = content.replace(old, new, 1)
    with open(bat_path, "w", encoding=detected) as f:
        f.write(content)
    print(f"OK (encoding={detected}): .env 作成ステップを追加しました")
else:
    print("ERROR: cd コマンドが見つかりませんでした")
    print(repr(content[:300]))
