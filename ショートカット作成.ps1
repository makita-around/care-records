$vbsPath = "C:\Users\user\claude_projects\care-records\サーバー起動.vbs"
$desktop = [Environment]::GetFolderPath("Desktop")
$startup = [Environment]::GetFolderPath("Startup")

$ws = New-Object -ComObject WScript.Shell

$shortcut = $ws.CreateShortcut("$desktop\介護記録_サーバー起動.lnk")
$shortcut.TargetPath = $vbsPath
$shortcut.Save()

$shortcut2 = $ws.CreateShortcut("$startup\介護記録_サーバー起動.lnk")
$shortcut2.TargetPath = $vbsPath
$shortcut2.Save()

Write-Host "OK"
