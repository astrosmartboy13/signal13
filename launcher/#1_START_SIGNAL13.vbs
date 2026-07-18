Option Explicit

Dim sh
Dim fso
Dim p

Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

p = fso.GetParentFolderName(WScript.ScriptFullName)

'============================
' ONTIME
'============================

sh.Run "wscript.exe """ & p & "\RUN_ONTIME.vbs""",0,False

Do
    WScript.Sleep 1000
Loop Until sh.Run("powershell -NoProfile -Command ""try{Invoke-WebRequest http://127.0.0.1:4001/ -UseBasicParsing>$null;exit 0}catch{exit 1}""",0,True)=0

'============================
' GATEWAY
'============================

sh.Run "wscript.exe """ & p & "\RUN_GATEWAY.vbs""",0,False

Do
    WScript.Sleep 1000
Loop Until sh.Run("powershell -NoProfile -Command ""try{Invoke-WebRequest http://127.0.0.1:8080/health -UseBasicParsing>$null;exit 0}catch{exit 1}""",0,True)=0

'============================
' TUNNEL
'============================

sh.Run "wscript.exe """ & p & "\RUN_TUNNEL.vbs""",0,False

WScript.Sleep 3000

'============================
' OPEN BROWSER
'============================

sh.Run "http://127.0.0.1:8080/dashboard/"

WScript.Sleep 300

sh.Run "http://127.0.0.1:8080/editor/"

WScript.Sleep 300

sh.Run "http://127.0.0.1:8080/timer/"

WScript.Sleep 300

sh.Run "http://127.0.0.1:8080/backstage/"

WScript.Sleep 300

sh.Run "http://127.0.0.1:8080/timeline/"

WScript.Sleep 300

sh.Run "http://127.0.0.1:8080/studio/"

Set sh = Nothing
Set fso = Nothing