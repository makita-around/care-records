Set ws = CreateObject("WScript.Shell")

' 動いているサーバーを停止する
ws.Run "cmd /c taskkill /f /im node.exe >nul 2>&1", 0, True
WScript.Sleep 1500

' サーバーを起動する（黒い画面は表示しない）
ws.Run "cmd /c cd /d C:\care-records && npm run dev >nul 2>&1", 0, False

' サーバーが起動するまで待つ（約10秒）
WScript.Sleep 10000

' ブラウザで自動的に開く
ws.Run "http://localhost:3000"
