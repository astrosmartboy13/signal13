Option Explicit

Dim sh
Set sh = CreateObject("WScript.Shell")

sh.Run "cmd.exe /c cd /d ""C:\SIGNAL13"" && node gateway.js", 0, False

Set sh = Nothing