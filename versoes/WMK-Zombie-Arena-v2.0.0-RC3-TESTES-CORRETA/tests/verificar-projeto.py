"""Verificações estáticas de regressão WMK Zombie Arena v2.0 RC1.
Execute: py tests/verificar-projeto.py (a partir da raiz do projeto).
Os testes NÃO substituem testes reais de gameplay no navegador.
"""
from pathlib import Path
import re, json, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text(encoding='utf-8')
game=(ROOT/'game.js').read_text(encoding='utf-8')
errs=[]
required=['overlay','pauseOverlay','gameEndOverlay','trainingReport','gameEndRestart','gameEndMenu','resumeGame','returnMainMenu','trainingRestart','trainingToMenu','modeSelect','startButton','trainingDrill','trainingDistance','bombAllies','bombEnemies','bombEnemyType']
for id in required:
 if not re.search(r'\bid=["\']'+re.escape(id)+r'["\']',html):errs.append('ID ausente: '+id)
for path in ['zombie-studio.html','skin-studio.html','arsenal.html','avatar-studio.html','editor.html','marketplace.html']:
 if not (ROOT/path).exists():errs.append('Editor ou página ausente: '+path)
 if f'href="{path}"' not in html:errs.append('Link de menu ausente: '+path)
for s in ['function showPauseMenu()', 'function returnToMainMenu()', 'function startTrainingReport()', 'function spawnTraining()', 'function finishGame(won)', 'function beginGame()', "gameEndOverlay.classList.remove('hidden')", "returnToMainMenu();", "if(!Array.isArray(distances)||!distances.length)"]:
 if s not in game:errs.append('Regra ausente em game.js: '+s)
for f in ROOT.rglob('*.json'):
 try:json.loads(f.read_text(encoding='utf-8'))
 except Exception as e:errs.append(f'JSON inválido {f}: {e}')
js=list(ROOT.glob('*.js'))
for f in js:
 p=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
 if p.returncode:errs.append(f'Sintaxe inválida: {f.name}: {p.stderr.strip()}')
for f in ROOT.glob('mapas/*.json'):
 data=json.loads(f.read_text())
 if 'objects' in data and len(data['objects'])>1000:errs.append('Mapa excessivo: '+f.name)
print('ARQUIVOS JS:',len(js),'JSON:',len(list(ROOT.rglob('*.json'))),'MODOS: 3')
if errs:
 print('FALHOU:',*errs,sep='\n - ');sys.exit(1)
print('OK: estrutura, menus, links, sintaxe e JSON; gameplay real requer navegador.')
