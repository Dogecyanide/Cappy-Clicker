@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Cappy Clicker needs Node.js and npm. Install the current Node.js LTS release, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing Cappy Clicker dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check the message above and try npm install in this folder.
    pause
    exit /b 1
  )
)
echo Opening the Cappy Clicker development server...
call npm run dev

