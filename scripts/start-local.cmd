@echo off
setlocal
cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0start-local.ps1" %*
if errorlevel 1 (
  echo.
  echo Local site did not start. See the error above.
  pause
)
endlocal
