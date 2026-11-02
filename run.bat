@echo off
rem Runs the Hello World application: the built executable if present, otherwise from source.
setlocal EnableExtensions
set "ROOT=%~dp0"
if exist "%ROOT%build\bin\hello.exe" (
  "%ROOT%build\bin\hello.exe" %*
  exit /b
)
echo build\bin\hello.exe not found, running from source (node src\index.ts); run ci.bat to build it 1>&2
node "%ROOT%src\index.ts" %*
exit /b
