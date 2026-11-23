@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title WMK Zombie Arena - Publicar jogo completo v1.7.1

echo ===============================================================
echo   WMK ZOMBIE ARENA - PUBLICACAO DO JOGO COMPLETO v1.7.1
echo   Walney Moreira Klein - walneyk@hotmail.com
echo ===============================================================
echo.
where git >nul 2>nul
if errorlevel 1 (
 echo [ERRO] Git nao instalado ou nao esta no PATH.
 echo Instale em https://git-scm.com/downloads/win
 goto :falha
)
for %%F in (index.html game.js style.css weapons.js editor.html editor.js editor.css marketplace.html marketplace.js marketplace.css map-library.js mapas\index.json assets\logo.svg) do (
 if not exist "%%F" (
   echo [ERRO] Arquivo obrigatorio ausente: %%F
   goto :falha
 )
)
set "DEST=%TEMP%\WMK-Zombie-Arena-Publicar-%RANDOM%-%RANDOM%"
echo [1/5] Clonando projeto oficial...
git clone --branch main --single-branch "https://github.com/WalneyNF/WMK-Zombie-Arena.git" "%DEST%"
if errorlevel 1 goto :falha

echo [2/5] Copiando jogo, editor, mapas, prefabs e manuais...
robocopy "%~dp0" "%DEST%" /E /XD .git /XF PUBLICAR-GITHUB.bat >nul
if errorlevel 8 goto :falha

pushd "%DEST%"
echo [3/5] Preparando commit...
git add -A
if errorlevel 1 goto :falhapop
git diff --cached --quiet
if not errorlevel 1 (
 echo [INFO] Nenhuma alteracao. Arquivos ja estao atualizados.
 goto :okpop
)
git commit -m "release: publica WMK Zombie Arena completo v1.7.1"
if errorlevel 1 goto :falhapop

echo [4/5] Enviando todos os arquivos ao GitHub...
git push origin main
if errorlevel 1 goto :falhapop

:okpop
popd
echo [5/5] Publicacao de arquivos concluida.
echo.
echo IMPORTANTE: no GitHub abra Settings ^> Pages.
echo Selecione Source: GitHub Actions para usar o workflow do projeto.
echo Depois verifique: https://github.com/WalneyNF/WMK-Zombie-Arena/actions
echo Site: https://walneynf.github.io/WMK-Zombie-Arena/
echo.
echo [OK] A demonstracao foi substituida pelos arquivos completos na main.
echo A entrada no ar depende do deploy do GitHub Pages terminar com sucesso.
start "" "https://github.com/WalneyNF/WMK-Zombie-Arena/actions"
pause
exit /b 0
:falhapop
popd
:falha
echo.
echo [FALHA] Nada foi declarado como publicado.
echo Verifique os erros acima. Git pode solicitar autenticacao no navegador.
pause
exit /b 1
