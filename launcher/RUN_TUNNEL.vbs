Set WshShell = CreateObject("WScript.Shell")

WshShell.Run "cmd.exe /c ""C:\SIGNAL13\tools\cloudflared.exe"" tunnel run signal13", 0, False

Set WshShell = Nothing