@echo off
chcp 65001 >nul
echo.
echo  デスクトップにショートカットを作成しています...
echo.

copy /Y "C:\care-records\訪問介護アプリ起動.vbs" "%USERPROFILE%\Desktop\訪問介護アプリ起動.vbs" >nul

(
  echo [InternetShortcut]
  echo URL=http://localhost:3000
) > "%USERPROFILE%\Desktop\訪問介護アプリを開く.url"

echo  ========================================
echo.
echo    セットアップが完了しました！
echo.
echo    デスクトップに2つのアイコンが作成されました。
echo.
echo    【毎日の起動手順】
echo    1.「訪問介護アプリ起動」をダブルクリック
echo    2. 約10秒待つ
echo    3. ブラウザが自動で開きます
echo.
echo  ========================================
echo.
pause
