@echo off
setlocal
cd /d "c:\Main\Games\FoundryVTT\Data\modules\fftweaks\src\homebrew"
set PORT=8181
:loop
set PORT=%PORT%
node "c:\Main\Games\FoundryVTT\Data\modules\fftweaks\src\homebrew\service\serve-homebrew.cjs"
REM If server exits, wait 5 seconds and restart
timeout /t 5 /nobreak >nul
goto loop
