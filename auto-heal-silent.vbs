' VBScript Launcher for Claude Desktop Auto-Heal Daemon
' Launches auto-heal.ps1 completely silently without any flashing command prompt window.
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strPsScript = strScriptDir & "\auto-heal.ps1"

strCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strPsScript & """"
objShell.Run strCommand, 0, False
