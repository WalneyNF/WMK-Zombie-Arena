@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title WMK Zombie Arena RC4 - Publicacao com verificacao remota
set "LOG=%~dp0RELATORIO-PUBLICACAO.txt"
set "DEST=%TEMP%\WMK-Zombie-Arena-CHECK-%RANDOM%-%RANDOM%"
set "REPO=https://github.com/WalneyNF/WMK-Zombie-Arena.git"
>"%LOG%" echo WMK Zombie Arena RC4 - Relatorio de publicacao
>>"%LOG%" echo Data: %DATE% %TIME%
echo =====================================================
echo WMK ZOMBIE ARENA - PUBLICAR RC4 COM VALIDACAO
 echo Relatorio: %LOG%
echo =====================================================
echo.
where git >nul 2>nul
if errorlevel 1 (echo [ERRO] Git nao instalado. & >>"%LOG%" echo Git nao instalado & goto :failed)
for %%F in (index.html game.js editor.js version.json) do (
 if not exist "%%F" (echo [ERRO] Nao existe %%F & >>"%LOG%" echo Faltando %%F & goto :failed)
)
findstr /c:"2.0.0-rc4" version.json >nul
if errorlevel 1 (echo [ERRO] version.json nao indica RC4. & goto :failed)
echo [1/6] Clonando main atual...
git clone -b main --single-branch "%REPO%" "%DEST%" >>"%LOG%" 2>&1
if errorlevel 1 (echo [ERRO] Falha no clone. & goto :failed)
echo [2/6] Copiando RC4 sem excluir recursos da main...
robocopy "%~dp0" "%DEST%" /E /XD .git /XF PUBLICAR-GITHUB.bat RELATORIO-PUBLICACAO.txt >>"%LOG%" 2>&1
if errorlevel 8 (echo [ERRO] Falha no robocopy. & goto :failed)
echo [3/6] Verificando versao e sintaxe...
git -C "%DEST%" status --short >>"%LOG%" 2>&1
findstr /c:"2.0.0-rc4" "%DEST%\version.json" >nul
if errorlevel 1 (echo [ERRO] RC4 nao foi copiada. & goto :failed)
where node >nul 2>nul
if not errorlevel 1 (
 for %%F in (game.js editor.js zombie-studio.js avatar-studio.js) do (
  if exist "%DEST%\%%F" (
   node --check "%DEST%\%%F" >>"%LOG%" 2>&1
   if errorlevel 1 (echo [ERRO] Sintaxe invalida: %%F & goto :failed)
  )
 )
)
echo [4/6] Preparando commit RC4...
git -C "%DEST%" add -A >>"%LOG%" 2>&1
if errorlevel 1 goto :failed
git -C "%DEST%" diff --cached --quiet
set "DIFFERR=!ERRORLEVEL!"
if "!DIFFERR!"=="0" (
 echo [AVISO] Nenhuma alteracao local para enviar. Validando main remota...
) else (
 if not "!DIFFERR!"=="1" (echo [ERRO] git diff falhou: !DIFFERR! & goto :failed)
 git -C "%DEST%" commit -m "release: WMK Zombie Arena v2.0.0-RC4" >>"%LOG%" 2>&1
 if errorlevel 1 (echo [ERRO] Falha ao criar commit. Configure nome/email no Git. & goto :failed)
)
echo [5/6] Enviando para main...
git -C "%DEST%" push origin main >>"%LOG%" 2>&1
if errorlevel 1 (echo [ERRO] git push falhou. Confira autenticacao/permissoes no relatorio. & goto :failed)
echo [6/6] Conferindo a main DO GITHUB...
git -C "%DEST%" fetch origin main >>"%LOG%" 2>&1
if errorlevel 1 (echo [ERRO] Nao foi possivel conferir a branch remota. & goto :failed)
for /f "delims=" %%H in ('git -C "%DEST%" rev-parse HEAD') do set "LOCALSHA=%%H"
for /f "delims=" %%H in ('git -C "%DEST%" rev-parse origin/main') do set "REMOTESHA=%%H"
echo Local:  !LOCALSHA!
echo Remoto: !REMOTESHA!
>>"%LOG%" echo Commit local !LOCALSHA!
>>"%LOG%" echo Commit remoto !REMOTESHA!
if /i not "!LOCALSHA!"=="!REMOTESHA!" (echo [ERRO] Commit remoto difere do local! & goto :failed)
git -C "%DEST%" show origin/main:version.json | findstr /c:"2.0.0-rc4" >nul
if errorlevel 1 (echo [ERRO] main remota ainda NAO possui RC4! & goto :failed)
echo.
echo [SUCESSO] GitHub MAIN contem versao 2.0.0-RC4.
echo [OBS] O Pages somente atualiza quando GitHub Actions terminar.
>>"%LOG%" echo SUCESSO: main remota contem 2.0.0-RC4
start "" "https://github.com/WalneyNF/WMK-Zombie-Arena/actions"
echo Confira o Pages: https://walneynf.github.io/WMK-Zombie-Arena/version.json
pause
exit /b 0
:failed
echo.
echo [FALHA] PUBLICACAO NAO CONFIRMADA. O relatorio explica a falha.
>>"%LOG%" echo FALHA de publicacao.
echo Envie RELATORIO-PUBLICACAO.txt no chat para diagnostico.
pause
exit /b 1
