@echo off
title 訪問介護アプリ 起動中...

:: ポート3000を解放
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 1 /nobreak >nul

:: ビルド＆本番サーバー起動
echo ビルド中...（しばらくお待ちください）
cd /d C:\訪問介護アプリ
call npm run build >nul 2>&1

:: バックグラウンドで本番サーバー起動
start "" /B cmd /c "cd /d C:\訪問介護アプリ && npm run start -- --hostname 0.0.0.0 >nul 2>&1"

:: 5秒待ってからブラウザを開く
echo サーバー起動中...（5秒お待ちください）
timeout /t 5 /nobreak >nul

start "" "http://localhost:3000"
