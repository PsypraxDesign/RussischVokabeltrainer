@echo off
setlocal

REM In den Ordner wechseln, in dem diese BAT liegt
cd /d "%~dp0"

echo.
echo === Gorod - Russisch lernen in der Stadt ===
echo.

set PYTHON_CMD=
python --version >nul 2>&1 && set PYTHON_CMD=python
if not defined PYTHON_CMD (
  py --version >nul 2>&1 && set PYTHON_CMD=py
)
if not defined PYTHON_CMD (
  echo FEHLER: Python wurde nicht gefunden.
  pause
  exit /b 1
)

%PYTHON_CMD% -c "import flask" >nul 2>&1
if errorlevel 1 (
  echo Flask wird installiert...
  %PYTHON_CMD% -m pip install flask
)

echo Server startet auf http://localhost:5083
echo Spielstand: daten\spielstand.json
echo Dieses Fenster offen lassen. Beenden: Strg+C oder Fenster schliessen.
echo.

REM App-Fenster ohne Adressleiste: Chrome, sonst Edge, sonst Standardbrowser
set "APP_URL=http://localhost:5083"
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

REM Fenster erst oeffnen, wenn der Server laeuft (2 Sekunden Vorlauf)
if defined BROWSER (
  start "" cmd /c "timeout /t 2 /nobreak >nul & start "" "%BROWSER%" --app=%APP_URL% --start-maximized"
) else (
  start "" cmd /c "timeout /t 2 /nobreak >nul & start "" %APP_URL%"
)

%PYTHON_CMD% server.py

echo.
echo Server wurde beendet.
pause
endlocal
