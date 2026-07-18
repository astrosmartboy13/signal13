Set WshShell = CreateObject("WScript.Shell")

WshShell.Run """C:\SIGNAL13\cloudflared.exe"" tunnel --config ""C:\Users\astro\.cloudflared\config.yml"" run signal13", 0, False