@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
echo =====================================================
echo  WMK ZOMBIE ARENA - PUBLICACAO GITHUB PAGES v1.6.0
echo  Walney Moreira Klein - walneyk@hotmail.com
echo =====================================================
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Git nao encontrado. Instale Git for Windows.
  pause
  exit /b 1
)
if not exist "game.js" (
  echo [ERRO] Execute este BAT dentro da pasta do projeto completo.
  pause
  exit /b 1
)
set "DEST=%TEMP%\WMK-Zombie-Arena-Publicar"
if exist "%DEST%\.git" (
  echo [ERRO] A pasta temporaria ja existe: %DEST%
  echo Exclua ou renomeie manualmente essa pasta e execute novamente.
  pause
  exit /b 1
)
echo Clonando repositorio para pasta temporaria...
git clone https://github.com/WalneyNF/WMK-Zombie-Arena.git "%DEST%"
if errorlevel 1 goto :failed
echo Copiando arquivos do projeto (sem modificar .git)...
robocopy "%~dp0" "%DEST%" /E /XD ".git" /XF "PUBLICAR-GITHUB.bat" >nul
if errorlevel 8 goto :failed
echo Conferindo arquivos essenciais...
if not exist "%DEST%\index.html" goto :failed
if not exist "%DEST%\marketplace.html" goto :failed
if not exist "%DEST%\game.js" goto :failed
pushd "%DEST%"
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo Nao ha novas alteracoes para publicar.
  popd
  goto :success
)
git commit -m "release: WMK Zombie Arena v1.6.0 completo para GitHub Pages"
if errorlevel 1 (
  popd
  goto :failed
)
git push origin main
if errorlevel 1 (
  popd
  goto :failed
)
popd
:success
echo.
echo [OK] Repositorio atualizado, ou ja estava atualizado.
echo Ative Settings ^> Pages ^> GitHub Actions no GitHub.
echo https://walneynf.github.io/WMK-Zombie-Arena/
pause
exit /b 0
:failed
echo.
echo [FALHA] Publicacao interrompida. Confira a mensagem acima.
echo Talvez voce precise autenticar no GitHub ou configurar nome/email do Git.
pause
exit /b 1
