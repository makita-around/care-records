@echo off
chcp 65001 > nul
echo.
echo ============================================
echo   訪問介護アプリ  アップデート
echo ============================================
echo.

:: アプリフォルダに移動
cd /d C:\訪問介護アプリ
if %errorlevel% neq 0 (
    echo 【エラー】アプリフォルダが見つかりません。
    echo 初回セットアップが完了しているか確認してください。
    echo.
    pause
    exit /b 1
)

echo [1/4] 最新版をダウンロードしています...
echo       （インターネット接続が必要です）
echo.
git pull
if %errorlevel% neq 0 (
    echo.
    echo 【エラー】ダウンロードに失敗しました。
    echo インターネットに接続されているか確認してください。
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] 必要なファイルを更新しています...
call npm install --silent
if %errorlevel% neq 0 (
    echo 【エラー】ファイルの更新に失敗しました。
    pause
    exit /b 1
)

echo.
echo [3/4] データベースクライアントを更新しています...
call npx prisma generate

echo.
echo [4/5] データベースを更新しています...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo 【エラー】データベースの更新に失敗しました。
    pause
    exit /b 1
)

echo.
echo [5/5] デスクトップのショートカットを更新しています...
copy /Y "C:\訪問介護アプリ\訪問介護アプリ起動.vbs" "%USERPROFILE%\Desktop\訪問介護アプリ起動.vbs" >nul
copy /Y "C:\訪問介護アプリ\更新.bat" "%USERPROFILE%\Desktop\訪問介護アプリ更新.bat" >nul

echo.
echo ============================================
echo   アップデートが完了しました！
echo.
echo   デスクトップの「訪問介護アプリ起動」を
echo   ダブルクリックしてアプリを再起動してください。
echo ============================================
echo.
pause
