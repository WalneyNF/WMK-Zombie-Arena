@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title WMK Zombie Arena - Publicar v2.0.0-RC4

echo ==========================================================
echo WMK ZOMBIE ARENA - PUBLICADOR v2.0.0-RC4
 echo Autor: Walney Moreira Klein - walneyk@hotmail.com
echo ==========================================================
echo.
where git >nul 2>nul
if errorlevel 1 (echo ERRO: Git nao encontrado. Instale git-scm.com & goto :fail)
for %%F in (index.html game.js editor.js style.css version.json) do (
  if not exist "%%F" (echo ERRO: arquivo ausente %%F & goto :fail)
)
set "DEST=%TEMP%\WMK-Zombie-Arena-RC4-%RANDOM%-%RANDOM%"
echo [1/5] Clonando main para uma pasta TEMPORARIA...
git clone -b main --single-branch https://github.com/WalneyNF/WMK-Zombie-Arena.git "%DEST%"
if errorlevel 1 goto :fail
echo [2/5] Consolidando RC4 sem apagar Cidade Viva, Loja e Backup presentes na main...
robocopy "%~dp0" "%DEST%" /E /XD .git /XF PUBLICAR-GITHUB.bat >nul
if errorlevel 8 goto :fail
pushd "%DEST%"
echo [3/5] Verificando JavaScript e JSON...
where node >nul 2>nul
if not errorlevel 1 (
  for %%F in (game.js editor.js zombie-studio.js avatar-studio.js) do (
    node --check "%%F"
    if errorlevel 1 goto :failpop
  )
)
where py >nul 2>nul
if not errorlevel 1 (py -m json.tool version.json >nul & if errorlevel 1 goto :failpop)
echo [4/5] Criando commit com fontes completos...
git add -A
if errorlevel 1 goto :failpop
git diff --cached --quiet
if not errorlevel 1 goto :okpop
git commit -m "release: WMK Zombie Arena v2.0.0-RC4 consolidado"
if errorlevel 1 goto :failpop
echo [5/5] Enviando para GitHub main...
git push origin main
if errorlevel 1 goto :failpop
:okpop
popd
echo.
echo [OK] GitHub atualizado. Acompanhe o deploy do Pages:
start "" "https://github.com/WalneyNF/WMK-Zombie-Arena/actions"
echo Site: https://walneynf.github.io/WMK-Zombie-Arena/
pause
exit /b 0
:failpop
popd
:fail
echo.
echo [FALHA] PUBLICACAO NAO CONCLUIDA. Verifique os erros acima.
pause
exit /b 1
