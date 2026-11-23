import {allZombieTypes,BUILTIN_ZOMBIES} from './zombie-types.js';
import {injectCommunitySkins} from './custom-skins.js';
import {installCommunityWeapons} from './custom-weapons.js';
import {getMapCatalog,loadCatalogMap,validateMap,saveBrowserMap} from './map-library.js';
import {WEAPONS, WEAPON_ORDER, BUY_CATEGORIES, SKINS} from './weapons.js';
installCommunityWeapons(WEAPONS,WEAPON_ORDER);
injectCommunitySkins(SKINS);
import {gameAudio} from './audio.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

    // ------------------------------------------------------------
    // Cena e renderização
    // ------------------------------------------------------------

    const container = document.querySelector('#game');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbec5bf);
    scene.fog = new THREE.Fog(0xbec5bf, 32, 68);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.65, 15);
    scene.add(camera);

    // Uma câmera lógica FPS permanece na posição do jogador para movimento, IA e disparos.
    // A câmera TPS é exclusivamente de visualização: não substitui as coordenadas do jogador.
    const thirdPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    let thirdPersonEnabled = localStorage.getItem('wmk.cameraMode') === 'TPS';
    let thirdPersonDistance = 3.6;
    const thirdCamRay = new THREE.Raycaster();
    const avatar = new THREE.Group();
    const avatarUniform = {
      jacket: new THREE.MeshStandardMaterial({color:0x426e60,roughness:.9}),
      pants: new THREE.MeshStandardMaterial({color:0x242d32,roughness:.93}),
      skin: new THREE.MeshStandardMaterial({color:0xc49e82,roughness:.9}),
      helmet: new THREE.MeshStandardMaterial({color:0x303e3a,roughness:.8}),
      vest: new THREE.MeshStandardMaterial({color:0x22392f,roughness:.9})
    };
    function avatarBox(w,h,d,mat,x,y,z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      mesh.position.set(x,y,z); mesh.castShadow=true; avatar.add(mesh); return mesh;
    }
    avatarBox(.52,.71,.29,avatarUniform.jacket,0,1.12,0);
    avatarBox(.48,.48,.32,avatarUniform.vest,0,1.18,-.04);
    avatarBox(.22,.70,.24,avatarUniform.pants,-.16,.4,0);
    avatarBox(.22,.70,.24,avatarUniform.pants,.16,.4,0);
    avatarBox(.17,.62,.22,avatarUniform.jacket,-.37,1.12,-.03);
    avatarBox(.17,.62,.22,avatarUniform.jacket,.37,1.12,-.03);
    avatarBox(.20,.17,.18,avatarUniform.skin,0,1.75,0);
    const avatarHead=new THREE.Mesh(new THREE.SphereGeometry(.225,12,10),avatarUniform.skin);
    avatarHead.position.set(0,1.88,0);avatarHead.castShadow=true;avatar.add(avatarHead);
    const avatarHelmet=new THREE.Mesh(new THREE.SphereGeometry(.235,12,8,0,Math.PI*2,0,Math.PI*.55),avatarUniform.helmet);
    avatarHelmet.position.set(0,1.92,0);avatar.add(avatarHelmet);
    scene.add(avatar);
    function syncCameraModeLabel(){
      const label=document.getElementById('cameraModeHud');
      if(label)label.textContent=thirdPersonEnabled?'CÂMERA: 3ª PESSOA · P':'CÂMERA: 1ª PESSOA · P';
      document.body.classList.toggle('third-person',thirdPersonEnabled);
    }
    function toggleCameraMode(){
      thirdPersonEnabled=!thirdPersonEnabled;
      try{localStorage.setItem('wmk.cameraMode',thirdPersonEnabled?'TPS':'FPS');}catch{}
      syncCameraModeLabel();
      if(typeof updateScope==='function')updateScope();
    }
    function updateThirdPersonCamera(dt){
      const cameraActive=thirdPersonEnabled && sniperScopeLevel===0;
      avatar.visible=cameraActive;
      if(!cameraActive)return;
      const player= camera.position;
      avatar.position.set(player.x, Math.max(0,player.y-crouchHeight),player.z);
      avatar.rotation.y=yaw;
      const crouchAmount=Math.max(.65,Math.min(1,crouchHeight/1.65));
      avatar.scale.y=crouchAmount;
      // Posição sobre o ombro, atrás do jogador, usando o mesmo yaw do FPS.
      const back=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
      const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
      const lookTarget=player.clone().addScaledVector(camera.getWorldDirection(new THREE.Vector3()),26);
      const desired=player.clone().addScaledVector(back,thirdPersonDistance).addScaledVector(right,.65);
      desired.y+=.7;
      // Bloqueie a câmera antes de uma parede, evitando enxergar através dela.
      const travel=desired.clone().sub(player),len=travel.length();
      if(len>.01){
        thirdCamRay.set(player,travel.normalize());thirdCamRay.near=.08;thirdCamRay.far=len;
        const obstruction=thirdCamRay.intersectObjects(blockerMeshes,false)[0];
        if(obstruction)desired.copy(player).addScaledVector(travel,Math.max(.3,obstruction.distance-.3));
      }
      thirdPersonCamera.position.copy(desired);
      thirdPersonCamera.lookAt(lookTarget);
      thirdPersonCamera.fov=75;
      thirdPersonCamera.updateProjectionMatrix();
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    const cameraModeHud=document.createElement('div');
    cameraModeHud.id='cameraModeHud';
    document.querySelector('#hud')?.appendChild(cameraModeHud);
    syncCameraModeLabel();

    const hemisphere = new THREE.HemisphereLight(0xe4ebec, 0x49453b, 2.1);
    scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xffe2bd, 2.2);
    sun.position.set(-10, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -26;
    sun.shadow.camera.right = 26;
    sun.shadow.camera.top = 26;
    sun.shadow.camera.bottom = -26;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.0003;
    scene.add(sun);

    const obstacles = [];
    const blockerMeshes = [];

    function addBox(x, y, z, width, height, depth, color, solid = true) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
      );

      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      if (solid) {
        obstacles.push({
          minX: x - width / 2,
          maxX: x + width / 2,
          minZ: z - depth / 2,
          maxZ: z + depth / 2
        });
        blockerMeshes.push(mesh);
      }

      return mesh;
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(52, 52),
      new THREE.MeshStandardMaterial({
        color: 0x77786c,
        roughness: 1
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(40, 40, 0x59625a, 0x737b70);
    grid.position.y = 0.005;
    grid.material.transparent = true;
    grid.material.opacity = 0.16;
    grid.material.depthWrite = false;
    scene.add(grid);

    // Construção procedural de três mapas didáticos, sem assets externos.
    const mapMeshes = [];
    const glbLoader=new GLTFLoader(), glbSceneCache=new Map();
    const validModel=p=>typeof p==='string'&&/^assets\/models\/[a-z0-9_\/-]+\.glb$/i.test(p)&&!p.includes('..')&&p.length<160;
    async function attachMapModel(parent,path){try{let asset=glbSceneCache.get(path);if(!asset){asset=await glbLoader.loadAsync('./'+path);glbSceneCache.set(path,asset)}if(!parent.parent)return;const child=asset.scene.clone(true);const b=new THREE.Box3().setFromObject(child),dim=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());child.position.sub(center);const wrapper=new THREE.Group();wrapper.add(child);wrapper.scale.set(1/Math.max(dim.x,.001),1/Math.max(dim.y,.001),1/Math.max(dim.z,.001));parent.add(wrapper);parent.material.transparent=true;parent.material.opacity=0;parent.material.depthWrite=false;console.info('WMK GLB carregado:',path)}catch(err){console.warn('Não foi possível abrir GLB, usando geometria provisória:',path,err)}}
    let loadedCustomMap=null;
    const MAP_NAMES = {yard:'Pátio de contêineres',warehouse:'Depósito abandonado',streets:'Ruas da cidade',custom:'Mapa personalizado'};
    let activeSpawnPoints = null;
    let bombZones=[];
    function mapBox(x,y,z,w,h,d,color,solid=true){const m=addBox(x,y,z,w,h,d,color,solid);mapMeshes.push(m);return m;}
    function buildMap(id){
      for(const m of mapMeshes){scene.remove(m);m.traverse(o=>{if(o.isMesh){o.geometry?.dispose();if(o.material?.map)o.material.map.dispose();o.material?.dispose();}});}
      mapMeshes.length=0;obstacles.length=0;blockerMeshes.length=0;
      mapBox(0,2,-20,40,4,.8,0x626c69);mapBox(0,2,20,40,4,.8,0x626c69);
      mapBox(-20,2,0,.8,4,40,0x626c69);mapBox(20,2,0,.8,4,40,0x626c69);
      if(id==='training'){
        // Academia original: linhas de tiro abertas, distâncias virtuais a partir de z=15.
        const laneColors=[0x9ea7a1,0x83958d,0x6e837a,0x5b746b];
        [5,10,20,30].forEach((meters,i)=>{
          const z=15-meters;
          mapBox(0,.015,z,35,.03,.07,laneColors[i],false);
          const board=new THREE.Group();
          const boardMesh=new THREE.Mesh(new THREE.BoxGeometry(2.9,.8,.12),new THREE.MeshBasicMaterial({color:0x203c31}));board.add(boardMesh);
          const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;
          const ctx=canvas.getContext('2d');ctx.fillStyle='#d8f5b7';ctx.font='bold 45px Arial';ctx.textAlign='center';ctx.fillText(meters+' m',128,54);
          const texture=new THREE.CanvasTexture(canvas);const label=new THREE.Mesh(new THREE.PlaneGeometry(2.7,.75),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));label.position.z=.065;board.add(label);
          board.position.set(-17,1.35,z);scene.add(board);mapMeshes.push(board);
        });
        mapBox(0,.02,15,9,.04,3,0x395546,false);
      } else if(id==='custom'){
        let data=null;
        try { data=loadedCustomMap || JSON.parse(localStorage.getItem('wmk_zombie_custom_map')||'null'); }catch(e){console.warn('Mapa personalizado inválido',e);}
        if(data && data.format==='wmk-zombie-map' && Array.isArray(data.objects)){
          for(const o of data.objects.slice(0,500)){
            if(['spawn','player','bombA','bombB'].includes(o.type))continue;
            const n=a=>Number.isFinite(+a)?+a:0;
            const x=n(o.x),y=n(o.y),z=n(o.z),w=Math.max(.1,Math.min(80,n(o.w)||1)),h=Math.max(.1,Math.min(30,n(o.h)||1)),d=Math.max(.1,Math.min(80,n(o.d)||1));
            const color=/^#[0-9a-f]{6}$/i.test(o.color||'')?parseInt(o.color.slice(1),16):0x69756e;
            const mesh=mapBox(x,y,z,w,h,d,color,o.solid!==false);
            mesh.rotation.y=n(o.ry);
            if(validModel(o.model))attachMapModel(mesh,o.model);
            if(o.solid!==false && mesh.rotation.y){
              // AABB conservadora para colisão dos obstáculos rotacionados.
              const b=obstacles[obstacles.length-1]; const c=Math.abs(Math.cos(mesh.rotation.y)),s=Math.abs(Math.sin(mesh.rotation.y));
              const ex=(w*c+d*s)/2,ez=(w*s+d*c)/2;
              b.minX=x-ex;b.maxX=x+ex;b.minZ=z-ez;b.maxZ=z+ez;
            }
          }
          activeSpawnPoints=data.objects.filter(o=>o.type==='spawn' && Number.isFinite(+o.x) && Number.isFinite(+o.z)).map(o=>({x:+o.x,z:+o.z,types:Array.isArray(o.zombieTypes)&&o.zombieTypes.length?o.zombieTypes:['comum'],weight:Math.max(1,Math.min(100,Number(o.spawnWeight)||1)),count:Math.max(1,Math.min(20,Number(o.spawnCount)||1)),minWave:Math.max(1,Math.min(100,Number(o.minWave)||1))}));
          bombZones=data.objects.filter(o=>o.type==='bombA'||o.type==='bombB').map(o=>({x:Number(o.x),z:Number(o.z),label:o.type==='bombA'?'A':'B'}));
          const player=data.objects.find(o=>o.type==='player');
          if(player && Number.isFinite(+player.x)&&Number.isFinite(+player.z))camera.position.set(+player.x,1.65,+player.z);
        }else{console.warn('Sem mapa salvo no editor; usando arena vazia');activeSpawnPoints=null;}
      } else if(id==='yard'){
        [[-9,-6,6,3,2.7],[8,-8,7,3,2.7],[-7,7,3,3,6],[9,7,6,3,3],[0,1,3,1.5,4]].forEach(([x,z,w,h,d],i)=>mapBox(x,h/2,z,w,h,d,[0x728788,0x9c684d,0x55716c][i%3]));
      } else if(id==='warehouse'){
        [[-11,-8,4,4,4],[-4,-8,4,3,4],[6,-8,4,4,5],[12,-2,4,3,4],[-12,5,5,3,3],[0,6,5,2.5,3],[11,10,4,4,4]].forEach(([x,z,w,h,d],i)=>mapBox(x,h/2,z,w,h,d,i%2?0x8d7860:0x626b64));
      } else {
        [[-12,-12,8,7,7],[0,-12,6,5,6],[12,-12,7,6,7],[-12,2,7,7,7],[12,4,7,6,7],[-8,14,6,5,5],[5,13,7,6,6]].forEach(([x,z,w,h,d],i)=>mapBox(x,h/2,z,w,h,d,i%2?0x74756f:0x6d8180));
        mapBox(0,.35,0,3,.7,3,0x826e52);
      }
      if(id!=='custom')activeSpawnPoints=null;
      if(id!=='custom')bombZones=[];
      if(id==='training')activeSpawnPoints=null;
      document.querySelector('#mapName').textContent=id==='custom'?(loadedCustomMap?.name||'Mapa personalizado'):(MAP_NAMES[id]||'Campo de treinamento');
    }
    if(new URLSearchParams(location.search).get('map')==='custom')document.querySelector('#mapSelect').value='custom';
    // Seletor dinâmico a partir do manifesto mapas/index.json (sem acesso irrestrito ao disco).
    const customMapSelect=document.querySelector('#customMapSelect');
    const mapStatus=document.querySelector('#catalogStatus');
    const modeSelect=document.querySelector('#modeSelect');
    let customLoading=false;
    async function chooseCustomMap(file){
      customLoading=true;mapStatus.textContent='Carregando '+file+'...';
      try{loadedCustomMap=await loadCatalogMap(file);document.querySelector('#mapSelect').value='custom';mapStatus.textContent='✓ '+loadedCustomMap.name+' pronto para jogar';return true}
      catch(e){mapStatus.textContent='⚠ '+e.message;return false}
      finally{customLoading=false}
    }
    getMapCatalog().then(items=>{
      for(const m of items)customMapSelect.add(new Option(m.name,m.file));
      mapStatus.textContent=items.length+' mapas JSON encontrados em mapas/';
    }).catch(e=>{mapStatus.textContent='⚠ '+e.message+' — use Live Server';});
    customMapSelect.addEventListener('change',async()=>{
      if(customMapSelect.value)await chooseCustomMap(customMapSelect.value);
    });
    document.querySelector('#mapSelect').addEventListener('change',()=>{customMapSelect.value='';loadedCustomMap=null});
    const localMapFile=document.querySelector('#localMapFile');
    document.querySelector('#openLocalMap').onclick=()=>localMapFile.click();
    localMapFile.onchange=async()=>{try{if(localMapFile.files[0]){loadedCustomMap=validateMap(JSON.parse(await localMapFile.files[0].text()));saveBrowserMap(loadedCustomMap);document.querySelector('#mapSelect').value='custom';customMapSelect.value='';mapStatus.textContent='✓ JSON importado: '+loadedCustomMap.name}}catch(e){mapStatus.textContent='⚠ '+e.message}localMapFile.value=''};
    buildMap(document.querySelector('#mapSelect').value);

    // ------------------------------------------------------------
    // Arma em primeira pessoa
    // ------------------------------------------------------------

    const gun = new THREE.Group();
    let sniperScopeLevel=0;
    function updateScope(){const allowed=selectedWeapon==='awp'||selectedWeapon==='sniper';if(!allowed)sniperScopeLevel=0;camera.fov=sniperScopeLevel===1?35:sniperScopeLevel===2?18:75;camera.updateProjectionMatrix();document.body.classList.toggle('sniper-scoped',sniperScopeLevel>0);gun.visible=sniperScopeLevel===0&&!thirdPersonEnabled;const cross=document.querySelector('#scopeOverlay');if(cross)cross.hidden=!sniperScopeLevel;}

    camera.add(gun);

    const gunDark = new THREE.MeshStandardMaterial({
      color: 0x252b2a,
      roughness: 0.55,
      metalness: 0.35
    });

    const gunMetal = new THREE.MeshStandardMaterial({
      color: 0x505956,
      roughness: 0.45,
      metalness: 0.5
    });

    function addGunPart(geometry, material, x, y, z) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = false;
      gun.add(mesh);
      return mesh;
    }

    addGunPart(new THREE.BoxGeometry(0.16, 0.16, 0.38), gunDark, 0, 0, -0.16);
    addGunPart(new THREE.BoxGeometry(0.07, 0.07, 0.34), gunMetal, 0, 0.035, -0.49);
    addGunPart(new THREE.BoxGeometry(0.13, 0.19, 0.14), gunDark, 0, -0.15, 0.005);
    addGunPart(new THREE.BoxGeometry(0.13, 0.11, 0.26), gunDark, 0, -0.02, 0.18);
    addGunPart(new THREE.BoxGeometry(0.055, 0.055, 0.1), gunMetal, 0, 0.11, -0.16);

    const muzzle = addGunPart(
      new THREE.SphereGeometry(0.055, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffca6b }),
      0,
      0.035,
      -0.68
    );
    muzzle.visible = false;

    gun.position.set(0.32, -0.27, -0.55);
    let awpLoadVersion=0;
    function rebuildGun(config){
      for (const part of [...gun.children]) {if(part===muzzle)continue;gun.remove(part);if(part.geometry)part.geometry.dispose();if(part.material&&part.material!==gunDark&&part.material!==gunMetal)part.material.dispose();}
      const skin=SKINS[skinSettings[selectedWeapon]]||SKINS.classic;
      const material=new THREE.MeshStandardMaterial({color:skin.image?0xffffff:(skin.base||config.color),metalness:skin.metalness??.35,roughness:skin.roughness});
      if(skin.image){const tex=new THREE.TextureLoader().load(skin.image);tex.colorSpace=THREE.SRGBColorSpace;material.map=tex;}
      gunMetal.color.set(skin.metal);
      const length=config.length;
      addGunPart(new THREE.BoxGeometry(.18,.16,.30),material,0,0,-.17);
      addGunPart(new THREE.BoxGeometry(.08,.08,length),gunMetal,0,.025,-.29-length/2);
      addGunPart(new THREE.BoxGeometry(.12,.20,.13),gunDark,0,-.16,-.02);
      if(config.type==='auto')addGunPart(new THREE.BoxGeometry(.12,.13,.28),gunDark,0,-.04,.19);
      if(config.pellets>1)addGunPart(new THREE.BoxGeometry(.18,.06,length*.8),material,0,-.06,-.28);
      if(config.damage>100){addGunPart(new THREE.CylinderGeometry(.075,.075,.32,16),gunDark,0,.13,-.17);addGunPart(new THREE.CylinderGeometry(.04,.052,.11,12),gunMetal,0,.13,-.36);addGunPart(new THREE.BoxGeometry(.1,.04,.17),gunDark,0,.058,-.18);addGunPart(new THREE.BoxGeometry(.11,.19,.24),material,0,-.03,.16);}
      muzzle.position.z=-.29-length;
      // AWP WMK: modelo GLB original (não utiliza arquivos do CS/Steam).
      if(selectedWeapon==='awp'||config.modelPath){
        const version=++awpLoadVersion;
        glbLoader.load('./'+(config.modelPath||'assets/models/wmk-precision-awp.glb'), gltf=>{
          if(version!==awpLoadVersion||currentWeapon()!==config)return;
          const model=gltf.scene;model.name='WMK_WEAPON_GLB';
          if(config.modelScale)model.scale.setScalar(config.modelScale);
          if(config.modelOffset)model.position.fromArray(config.modelOffset);
          if(config.modelRotation)model.rotation.set(...config.modelRotation);
          for(const item of [...gun.children]){
            if(item===muzzle)continue;
            if(item.material){item.material.transparent=true;item.material.opacity=0;item.material.depthWrite=false;}
          }
          if(skin.image){for(const child of model.children){child.traverse?.(mesh=>{if(mesh.isMesh&&mesh.material){mesh.material=mesh.material.clone();mesh.material.map=new THREE.TextureLoader().load(skin.image);mesh.material.map.colorSpace=THREE.SRGBColorSpace;mesh.material.needsUpdate=true;}})}}
          gun.add(model);
        },undefined,err=>console.warn('GLB indisponível; geometria de teste permanece',err));
      } else ++awpLoadVersion;
    }


    // ------------------------------------------------------------
    // Bots e colisões
    // ------------------------------------------------------------

    const bots = [];
    const respawns = [];
    const effects = [];
    const spawnPoints = [
      [-14, -14],
      [-7, -14],
      [0, -14],
      [7, -14],
      [14, -14]
    ];

    const enemyBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x556c4a,
      roughness: 0.85
    });

    const enemyLegMaterial = new THREE.MeshStandardMaterial({
      color: 0x30383a,
      roughness: 0.9
    });

    const enemyHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0x879779,
      roughness: 0.85
    });

    const enemyHelmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x343e30,
      roughness: 0.8
    });

    function createBot(x, z, zombieType='comum') {
      const types=allZombieTypes(),spec=types[zombieType]||types.comum;
      const group = new THREE.Group();

      const bot = {
        group,
        parts: [],
        health: spec.health + Math.max(0,wave-1)*Math.min(12,spec.health*.08),
        kind:spec.id, attack:spec.attack, attackInterval:spec.attackInterval, points:spec.points, headMultiplier:spec.headMultiplier,
        alive: true,
        speed: spec.speed + Math.min(wave*.04,.4),
        attackTimer: 0,
        fireTimer: 0.8 + Math.random() * 1.8,
        strafe: Math.random() < 0.5 ? -1 : 1,
        strafeTimer: 0.6 + Math.random()
      };

      function part(geometry, material, name, px, py, pz, rz = 0) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.position.set(px, py, pz);
        mesh.rotation.z = rz;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.bot = bot;
        group.add(mesh);
        bot.parts.push(mesh);
        return mesh;
      }

      part(new THREE.BoxGeometry(0.24, 0.72, 0.24), enemyLegMaterial,
        'botLeg', -0.17, 0.36, 0);
      part(new THREE.BoxGeometry(0.24, 0.72, 0.24), enemyLegMaterial,
        'botLeg', 0.17, 0.36, 0);

      part(new THREE.CylinderGeometry(0.35, 0.44, 0.98, 8), enemyBodyMaterial,
        'botTorso', 0, 1.15, 0);

      part(new THREE.BoxGeometry(0.19, 0.68, 0.2), enemyBodyMaterial,
        'botArm', -0.45, 1.12, 0, -0.12);
      part(new THREE.BoxGeometry(0.19, 0.68, 0.2), enemyBodyMaterial,
        'botArm', 0.45, 1.12, 0, 0.12);

      part(new THREE.SphereGeometry(0.27, 12, 10), enemyHeadMaterial,
        'botHead', 0, 1.83, 0);
      part(new THREE.SphereGeometry(0.28, 10, 8), enemyHelmetMaterial,
        'botHelmet', 0, 1.96, 0);

      group.position.set(x, 0, z);
      // Modelos provisórios são hitboxes; o GLB é visual opcional, com fallback.
      group.scale.setScalar(spec.scale);
      for(const part of bot.parts){if(part.material===enemyBodyMaterial||part.material===enemyHeadMaterial){part.material=part.material.clone();part.material.color.set(spec.color)}}
      if(spec.model){const loader=new GLTFLoader();loader.load(spec.model,gltf=>{if(!bot.alive)return;const model=gltf.scene;const bb=new THREE.Box3().setFromObject(model);const size=bb.getSize(new THREE.Vector3()),center=bb.getCenter(new THREE.Vector3());model.position.sub(center);const wrapper=new THREE.Group();wrapper.add(model);wrapper.scale.setScalar(2.05/Math.max(size.y,.01));wrapper.position.y=1.04;group.add(wrapper);for(const part of bot.parts)part.visible=false; // Raycast continua funcionando com hitboxes invisíveis.
      },undefined,()=>console.warn('Modelo de zumbi indisponível:',spec.model))}
      scene.add(group);
      bots.push(bot);
      return bot;
    }

    function isBlocked(x, z, radius = 0.38) {
      if (x < -19.1 || x > 19.1 || z < -19.1 || z > 19.1) {
        return true;
      }

      for (const box of obstacles) {
        if (
          x > box.minX - radius &&
          x < box.maxX + radius &&
          z > box.minZ - radius &&
          z < box.maxZ + radius
        ) {
          return true;
        }
      }

      return false;
    }

    function moveBot(bot, dx, dz, dt) {
      const length = Math.hypot(dx, dz);
      if (length < 0.001) return;

      dx /= length;
      dz /= length;

      const step = bot.speed * dt;
      const choices = [
        [dx, dz],
        [-dz, dx],
        [dz, -dx],
        [-dx, -dz]
      ];

      for (const [mx, mz] of choices) {
        const nx = bot.group.position.x + mx * step;
        const nz = bot.group.position.z + mz * step;

        if (!isBlocked(nx, nz, 0.43) && Math.hypot(nx - camera.position.x, nz - camera.position.z) > 0.9) {
          bot.group.position.x = nx;
          bot.group.position.z = nz;
          return;
        }
      }
    }

    const raycaster = new THREE.Raycaster();

    function hasLineOfSight(origin, target) {
      const direction = target.clone().sub(origin);
      const distance = direction.length();

      if (distance < 0.5) return true;

      direction.normalize();
      raycaster.set(origin, direction);
      raycaster.near = 0.1;
      raycaster.far = distance - 0.25;

      return raycaster.intersectObjects(blockerMeshes, false).length === 0;
    }

    function addTracer(start, end, color) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        start.clone(),
        end.clone()
      ]);

      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9
      });

      const line = new THREE.Line(geometry, material);
      scene.add(line);
      effects.push({ line, life: 0.09, duration: 0.09 });
    }

    function updateEffects(dt) {
      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.life -= dt;
        effect.line.material.opacity = Math.max(0, effect.life / effect.duration);

        if (effect.life <= 0) {
          scene.remove(effect.line);
          effect.line.geometry.dispose();
          effect.line.material.dispose();
          effects.splice(i, 1);
        }
      }
    }

    function clearEffects() {
      for (const effect of effects) {
        scene.remove(effect.line);
        effect.line.geometry.dispose();
        effect.line.material.dispose();
      }
      effects.length = 0;
    }

    // ------------------------------------------------------------
    // Interface e estado da partida
    // ------------------------------------------------------------

    const overlay = document.querySelector('#overlay');
    const overlayTitle = document.querySelector('#overlayTitle');
    const overlayText = document.querySelector('#overlayText');
    const startButton = document.querySelector('#startButton');

    const healthText = document.querySelector('#healthText');
    const healthFill = document.querySelector('#healthFill');
    const ammoText = document.querySelector('#ammoText');
    const killCount = document.querySelector('#killCount');
    const matchTime = document.querySelector('#matchTime');
    const accuracyText = document.querySelector('#accuracyText');
    const hitmarker = document.querySelector('#hitmarker');
    const toast = document.querySelector('#toast');
    const damageFlash = document.querySelector('#damageFlash');

    const weaponName = document.querySelector('#weaponName');
    const weaponBar = document.querySelector('#weaponBar');
    const weaponPanel = document.querySelector('#weaponPanel');
    const weaponChoices = document.querySelector('#weaponChoices');
    const waveText = document.querySelector('#waveText');
    const aliveText = document.querySelector('#aliveText');
    const scoreText = document.querySelector('#scoreText');
    const mapSelect = document.querySelector('#mapSelect');
    const TARGET_KILLS = Infinity;
    let wave=1, waveRemaining=0, waveCooldown=0, score=0;
    let selectedWeapon='rifle';
    let inventory=Object.fromEntries(WEAPON_ORDER.map(id=>[id,{ammo:WEAPONS[id].magazine,reserve:WEAPONS[id].reserve}]));
    let loadout={primary:'rifle',secondary:'pistol',melee:'knife'};
    let weaponPanelOpen=false,buyCategory=null;
    const SKIN_STORAGE='wmk_zombie_skins_v1';
    let skinSettings={};
    try {const s=JSON.parse(localStorage.getItem(SKIN_STORAGE)||'{}');if(s&&typeof s==='object'&&!Array.isArray(s))skinSettings=s;}catch{}
    function currentWeapon(){return WEAPONS[selectedWeapon];}
    function applySkin(id,skinId){
      if(!WEAPONS[id]||!SKINS[skinId]||(SKINS[skinId].forWeapon&&SKINS[skinId].forWeapon!==id))return;
      skinSettings[id]=skinId;
      try{localStorage.setItem(SKIN_STORAGE,JSON.stringify(skinSettings));}catch(e){console.warn('Preferência de skin não persistida',e);}
      if(id===selectedWeapon)rebuildGun(currentWeapon());
      buildWeaponUI();
      document.querySelector('#buyStatus').textContent=`Visual da ${WEAPONS[id].name}: ${SKINS[skinId].name}. Dano e recarga não mudam.`;
    }
    function selectWeapon(id){
      if(!WEAPONS[id])return;
      // Somente as armas equipadas podem ser acessadas pelas teclas 1, 2 e 3.
      if(!Object.values(loadout).includes(id))return;
      saveAmmo();selectedWeapon=id;reloading=false;reloadTimer=0;shotCooldown=0;shootHeld=false;
      const state=inventory[id];ammo=state.ammo;reserveAmmo=state.reserve;
      rebuildGun(currentWeapon());updateScope();updateHUD();
      for(const el of weaponBar.children)el.classList.toggle('active',el.dataset.weapon===id);
    }
    function saveAmmo(){if(inventory[selectedWeapon])inventory[selectedWeapon]={ammo,reserve:reserveAmmo};}
    function buyWeapon(id){
      const w=WEAPONS[id];if(!w)return;
      // Economia será adicionada ao modo competitivo; no treinamento a compra é gratuita.
      if(w.slot==='primary'||w.slot==='secondary')loadout[w.slot]=id;
      if(w.slot==='melee')loadout.melee=id;
      selectWeapon(id);buyCategory=w.category;
      buildWeaponUI();
      document.querySelector('#buyStatus').textContent=`${w.name} equipada! Pressione ${w.slot==='primary'?'1':w.slot==='secondary'?'2':'3'} para acessar esse slot.`;
    }
    function buyAmmo(slot){
      const id=loadout[slot],w=WEAPONS[id];if(!w)return;
      inventory[id].reserve+=w.magazine*2;
      if(selectedWeapon===id)reserveAmmo=inventory[id].reserve;
      updateHUD();document.querySelector('#buyStatus').textContent=`Munição de ${w.name} adicionada (+${w.magazine*2}).`;
    }
    function makeBuyButton(text,detail,handler){
      const b=document.createElement('button');b.type='button';b.className='weapon-choice';
      const name=document.createElement('span');name.textContent=text;
      if(detail){const info=document.createElement('small');info.textContent=detail;name.append(info);}
      b.append(name);b.addEventListener('click',handler);weaponChoices.append(b);
    }
    function buildWeaponUI(){
      weaponBar.replaceChildren();weaponChoices.replaceChildren();
      [['1',loadout.primary],['2',loadout.secondary],['3',loadout.melee]].forEach(([key,id])=>{
        const slot=document.createElement('div');slot.className='slot';slot.dataset.weapon=id;
        slot.textContent=`${key} · ${WEAPONS[id].name}`;
        slot.classList.toggle('active',id===selectedWeapon);weaponBar.append(slot);
      });
      const title=document.querySelector('#buyTitle'),crumb=document.querySelector('#buyBreadcrumb');
      const skinArea=document.querySelector('#skinArea');skinArea.hidden=true;
      if(!buyCategory){
        title.textContent='COMPRAR EQUIPAMENTO';crumb.textContent='MENU PRINCIPAL';
        BUY_CATEGORIES.forEach(c=>makeBuyButton(`${c.key} · ${c.name}`,c.id==='equipment'?'Sistema de equipamentos em desenvolvimento':null,()=>openBuyCategory(c.id)));
      }else if(buyCategory==='primaryAmmo'||buyCategory==='secondaryAmmo'){
        const slot=buyCategory==='primaryAmmo'?'primary':'secondary';title.textContent='COMPRAR MUNIÇÃO';crumb.textContent=slot==='primary'?'PRINCIPAL':'SECUNDÁRIA';
        makeBuyButton('1 · REABASTECER',`+ ${WEAPONS[loadout[slot]].magazine*2} munições da ${WEAPONS[loadout[slot]].name}`,()=>buyAmmo(slot));
      }else if(buyCategory==='equipment'){
        title.textContent='EQUIPAMENTOS';crumb.textContent='EM DESENVOLVIMENTO';
        makeBuyButton('Colete · Capacete · Granadas','Planejado; sem compra funcional nesta versão',()=>{});
      }else{
        const c=BUY_CATEGORIES.find(x=>x.id===buyCategory);
        title.textContent=c?.name||'ARMAS';crumb.textContent='B → '+title.textContent;
        const ids=WEAPON_ORDER.filter(id=>WEAPONS[id].category===buyCategory);
        ids.forEach((id,i)=>{const w=WEAPONS[id];makeBuyButton(`${i+1} · ${w.name} ${Object.values(loadout).includes(id)?'✓':''}`,`W$ ${w.price} (grátis neste modo) · Dano ${w.damage} · Pente ${w.magazine} · Recarga ${w.reload}s · Skin: ${(SKINS[skinSettings[id]]||SKINS.classic).name}`,()=>{buyWeapon(id);renderSkinChoices(id);});});
      }
    }
    function renderSkinChoices(id){
      const area=document.querySelector('#skinArea'),grid=document.querySelector('#skinChoices');
      grid.replaceChildren();area.hidden=false;
      for(const [key,skin] of Object.entries(SKINS)){
        if(skin.forWeapon&&skin.forWeapon!==id)continue;
        const b=document.createElement('button');b.type='button';b.className='skin-swatch';
        const swatch=document.createElement('span');swatch.className='skin-dot';swatch.style.backgroundColor=skin.base||'#737777';if(skin.image)swatch.style.backgroundImage='url('+skin.image+')';
        b.append(swatch,document.createTextNode(skin.name+(skinSettings[id]===key?' ✓':'')));
        b.onclick=()=>{applySkin(id,key);renderSkinChoices(id);};grid.append(b);
      }
    }
    function openBuyCategory(category){buyCategory=category;buildWeaponUI();}
    function handleBuyDigit(n){
      if(!buyCategory){const cat=BUY_CATEGORIES[n-1];if(cat)openBuyCategory(cat.id);return;}
      if(buyCategory==='primaryAmmo'||buyCategory==='secondaryAmmo'){
        if(n===1)buyAmmo(buyCategory==='primaryAmmo'?'primary':'secondary');return;
      }
      const ids=WEAPON_ORDER.filter(id=>WEAPONS[id].category===buyCategory);
      if(ids[n-1]){buyWeapon(ids[n-1]);renderSkinChoices(ids[n-1]);}
    }
    function openWeaponPanel(){
      if(gameState!=='playing')return;
      weaponPanelOpen=true;buyCategory=null;shootHeld=false;buildWeaponUI();
      weaponPanel.classList.remove('hidden');
      if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();
    }
    function closeWeaponPanel(){
      weaponPanelOpen=false;weaponPanel.classList.add('hidden');
      if(gameState==='paused')startOrResume();
    }
    document.querySelector('#closeWeapons').addEventListener('click',closeWeaponPanel);
    document.querySelector('#buyBack').addEventListener('click',()=>{buyCategory=null;buildWeaponUI();});
    buildWeaponUI();

    const PLAYER_RADIUS = 0.38;
    const STANDING_HEIGHT = 1.65;
    const CROUCH_HEIGHT = 1.05;
    const MAGAZINE_SIZE = 30;

    let gameState = 'menu';
    let health = 100;
    let ammo = MAGAZINE_SIZE;
    let reserveAmmo = 90;
    let kills = 0;
    let elapsedTime = 0;
    let shotsFired = 0;
    let shotsHit = 0;
    let crouchHeight = STANDING_HEIGHT;

    let yaw = 0;
    let pitch = 0;
    let verticalVelocity = 0;
    let grounded = true;
    let jumpQueued = false;

    let reloadTimer = 0;
    let reloading = false;
    let shotCooldown = 0;
    let shootHeld = false;
    let recoil = 0;
    let muzzleTimer = 0;
    let hitTimer = 0;
    let toastTimer = 0;
    let damageFlashAlpha = 0;

    const keys = Object.create(null);

    function updateHUD() {
      healthText.textContent = Math.ceil(health);
      healthFill.style.width = `${Math.max(0, health)}%`;
      healthFill.style.background = health <= 30 ? '#c85a4d' : '#9cbd72';

      ammoText.textContent = reloading
        ? 'RECARREGANDO'
        : `${String(ammo).padStart(2, '0')} / ${reserveAmmo}`;

      weaponName.textContent=currentWeapon().name.toUpperCase() + ' · ' + (SKINS[skinSettings[selectedWeapon]]||SKINS.classic).name.toUpperCase();
      killCount.textContent = `${kills} eliminações`;
      waveText.textContent=`ONDA ${wave}`;
      aliveText.textContent=`${waveRemaining} ZUMBIS RESTANTES`;
      scoreText.textContent=String(score);
      const seconds = Math.floor(elapsedTime);
      matchTime.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      accuracyText.textContent = `${shotsFired ? Math.round(100 * shotsHit / shotsFired) : 0}%`;
    }

    function setOverlay(title, text, buttonText) {
      overlayTitle.textContent = title;
      overlayText.textContent = text;
      startButton.textContent = buttonText;
      overlay.classList.remove('hidden');
    }

    function showToast(text) {
      toast.textContent = text;
      toast.classList.add('visible');
      toastTimer = 1.1;
    }

    // Modos pedagógicos: survival, treino e operação bomba offline experimental.
    let currentMode='survival', trainingHits=0, bombTime=120, planted=false, plantTime=35, plantProgress=0;
    let trainingTargets=[], teammates=[], siteMeshes=[];
    function clearExtras(){
      for(const o of [...trainingTargets,...teammates,...siteMeshes]){
        scene.remove(o);o.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});
      }
      trainingTargets=[];teammates=[];siteMeshes=[];
    }
    const trainingDistanceSelect=document.querySelector('#trainingDistance');
    const trainingDrillSelect=document.querySelector('#trainingDrill');
    const trainingOptions=document.querySelector('#wmkTrainingOptions');
    const availableDistances=[5,10,20,30];
    let trainingSession=0, trainingNextSlot=0, trainingHeadshots=0;
    const modeButtonLabels={survival:'INICIAR SOBREVIVÊNCIA',training:'INICIAR TREINAMENTO',bomb:'INICIAR OPERAÇÃO BOMBA'};
    const trainingModeStatus=document.querySelector('#trainingModeStatus');
    const trainingStats=document.querySelector('#trainingStats');
    let trainingSessionShots=0, trainingSessionHits=0, trainingSessionKills=0;
    let trainingPendingRespawns=[];
    function trainingLabel(){return trainingDrillSelect.selectedOptions[0]?.textContent||'Precisão';}
    function refreshTrainingOptions(){
      const training=modeSelect.value==='training';
      if(trainingOptions)trainingOptions.hidden=!training;
      document.body.classList.toggle('selecting-training',training);
      if(gameState==='menu'||gameState==='ended'){
        startButton.textContent=modeButtonLabels[modeSelect.value]||modeButtonLabels.survival;
        overlayText.textContent=training
          ?'Academia FPS: configure a distância e o exercício, clique em Iniciar treinamento e atire nos alvos.'
          : modeSelect.value==='bomb'
            ?'Operação Bomba offline: conquiste uma das zonas A/B.'
            :'Sobreviva às ondas de zumbis. Escolha o mapa para começar.';
      }
      if(trainingModeStatus)trainingModeStatus.textContent=training
        ?'Treinamento: '+trainingLabel()+' · '+(trainingDistanceSelect.value==='mixed'?'5, 10, 20 e 30 m':trainingDistanceSelect.value+' m')
        :'Selecione Academia de mira para configurar exercícios.';
    }
    modeSelect.addEventListener('change',refreshTrainingOptions);
    trainingDistanceSelect.addEventListener('change',refreshTrainingOptions);
    trainingDrillSelect.addEventListener('change',refreshTrainingOptions);
    refreshTrainingOptions();
    function trainingDistance(){return trainingDistanceSelect.value==='mixed'?availableDistances[trainingNextSlot++%availableDistances.length]:[Number(trainingDistanceSelect.value)];}
    function makeTrainingTarget(distance,offset=0){
      const z=15-distance,x=Math.max(-13,Math.min(13,offset));
      const bot=createBot(x,z,'comum');bot.health=100;bot.speed=0;bot.attackTimer=99999;
      bot.training={distance,originX:x,elapsed:Math.random()*Math.PI*2,exercise:trainingDrillSelect.value};
      waveRemaining++;return bot;
    }
    function scheduleTargetRespawn(bot){
      trainingPendingRespawns.push({session:trainingSession,meters:bot.training?.distance||10,offset:bot.training?.originX||0,time:.65});
    }
    function updateTrainingRespawns(dt){
      for(let i=trainingPendingRespawns.length-1;i>=0;i--){
        const item=trainingPendingRespawns[i];item.time-=dt;
        if(item.time>0)continue;
        trainingPendingRespawns.splice(i,1);
        if(item.session!==trainingSession||currentMode!=='training')continue;
        makeTrainingTarget(item.meters,item.offset);
      }
    }
    function spawnTraining(){
      trainingSession++;trainingPendingRespawns.length=0;trainingNextSlot=0;trainingHits=0;trainingHeadshots=0;trainingSessionShots=0;trainingSessionHits=0;trainingSessionKills=0;waveRemaining=0;
      const distances=trainingDistance();
      for(const d of distances){
        const positions=distances.length===1?[-9,-5,-1,3,7,11]:[-5,0,5];
        for(const x of positions)makeTrainingTarget(d,x);
      }
      showToast('ACADEMIA: '+trainingDrillSelect.selectedOptions[0].textContent.toUpperCase());
    }
    function updateTrainingTargets(dt){
      if(currentMode!=='training')return;
      const exercise=trainingDrillSelect.value;
      if(exercise==='moving')for(const bot of bots){
        if(!bot.alive||!bot.training)continue;
        bot.training.elapsed+=dt;
        bot.group.position.x=bot.training.originX+Math.sin(bot.training.elapsed*1.6)*1.65;
      }
      updateTrainingRespawns(dt);
      document.querySelector('#waveText').textContent='TREINO · '+(trainingDistanceSelect.value==='mixed'?'5–30m':trainingDistanceSelect.value+'m');
      document.querySelector('#aliveText').textContent=`${waveRemaining} ALVOS · ${trainingHeadshots} HS`;
      if(trainingStats){
        const accuracy=trainingSessionShots?Math.round(100*trainingSessionHits/trainingSessionShots):0;
        trainingStats.textContent=`${trainingLabel()} · ${trainingSessionKills} alvos · ${trainingHeadshots} headshots · ${accuracy}% de acerto`;
      }
    }
    function siteMarker(x,z,label){
      const m=new THREE.Mesh(new THREE.CylinderGeometry(2,2,.07,32),new THREE.MeshBasicMaterial({color:label==='A'?0xffd060:0x79d2fa,transparent:true,opacity:.42,depthWrite:false}));
      m.position.set(x,.04,z);scene.add(m);siteMeshes.push(m);
      return m;
    }
    function spawnBombRound(){
      bombTime=120;planted=false;plantTime=35;plantProgress=0;
      waveRemaining=5;
      const spawns=(activeSpawnPoints?.length?activeSpawnPoints:[{x:-14,z:-13,types:['comum']},{x:0,z:-14,types:['comum']},{x:14,z:-13,types:['comum']}]);
      for(let i=0;i<5;i++){
        const {x,z,types=['comum']}=spawns[i%spawns.length];const allowed=types.filter(t=>allZombieTypes()[t]);const b=createBot(x+(i%2)*1.2,z+Math.floor(i/2)*1.2,allowed[0]||'comum');b.speed=1.7;
      }
      // Quatro aliados representados por unidades de suporte automáticas simplificadas.
      for(let i=0;i<4;i++){
        const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(.65,1.8,.65),new THREE.MeshStandardMaterial({color:0x448fbd}));m.position.y=.9;g.add(m);g.position.set(-3+i*2,0,10);scene.add(g);teammates.push(g);
      }
      const sites=bombZones.length?bombZones:[{x:-12,z:-9,label:'A'},{x:12,z:-9,label:'B'}];
      sites.forEach(s=>siteMarker(s.x,s.z,s.label));
      showToast('5v5 OFFLINE EXPERIMENTAL · PLANTE COM E EM A OU B');
    }
    function setupMode(){
      clearExtras();currentMode=modeSelect.value;
      document.querySelector('#modeHud').textContent=currentMode==='training'?'ACADEMIA DE MIRA':currentMode==='bomb'?'OPERAÇÃO BOMBA':'SOBREVIVÊNCIA';
      if(currentMode==='training')spawnTraining();
      else if(currentMode==='bomb')spawnBombRound();
      else startWave();
    }
    function updateBombMode(dt){
      bombTime-=dt;
      const sites=bombZones.length?bombZones:[{x:-12,z:-9,label:'A'},{x:12,z:-9,label:'B'}];
      const close=sites.some(s=>Math.hypot(camera.position.x-s.x,camera.position.z-s.z)<3);
      if(!planted && close && keys.KeyE){plantProgress+=dt;if(plantProgress>=2.5){planted=true;showToast('BOMBA ARMADA — PROTEJA A ZONA!');}}else if(!planted)plantProgress=0;
      if(planted){plantTime-=dt;if(plantTime<=0){finishGame(true);return;}}
      if(!planted&&bombTime<=0){finishGame(false);return;}
      // Aliados atiram em alvos próximos; simulação offline, sem rede.
      for(const ally of teammates){
        const target=bots.find(b=>b.alive&&Math.hypot(b.group.position.x-ally.position.x,b.group.position.z-ally.position.z)<13);
        if(target && Math.random()<dt*.36){target.health-=25;if(target.health<=0)eliminateBot(target);}
      }
      document.querySelector('#waveText').textContent=planted?'BOMBA: '+Math.ceil(plantTime)+'s':'RODADA: '+Math.ceil(Math.max(0,bombTime))+'s';
      document.querySelector('#aliveText').textContent=(5-Math.max(0,5-waveRemaining))+' DEFENSORES';
    }
    function resetGame() {
      clearExtras();
      clearGrenades();clearWeaponProjectiles();grenades={he:2,smoke:2};updateGrenadeHud();
      for (const bot of bots) {
        scene.remove(bot.group);
      }
      bots.length = 0;
      respawns.length = 0;
      clearEffects();

      health = 100;
      inventory=Object.fromEntries(WEAPON_ORDER.map(id=>[id,{ammo:WEAPONS[id].magazine,reserve:WEAPONS[id].reserve}]));
      ammo=WEAPONS.rifle.magazine;reserveAmmo=WEAPONS.rifle.reserve;
      loadout={primary:'rifle',secondary:'pistol',melee:'knife'};
      trainingSession++;trainingPendingRespawns.length=0;
      wave=1;waveRemaining=0;waveCooldown=0;score=0;
      kills=0;
      elapsedTime = 0;
      shotsFired = 0;
      shotsHit = 0;
      crouchHeight = STANDING_HEIGHT;
      document.body.classList.remove('crouching');

      yaw = 0;
      pitch = 0;
      verticalVelocity = 0;
      grounded = true;
      jumpQueued = false;

      reloadTimer = 0;
      reloading = false;
      shotCooldown = 0;
      shootHeld = false;
      recoil = 0;
      muzzleTimer = 0;
      hitTimer = 0;
      toastTimer = 0;
      damageFlashAlpha = 0;

      for (const key in keys) delete keys[key];

      camera.position.set(0, 1.65, 15);
      camera.rotation.set(0, 0, 0, 'YXZ');

      muzzle.visible = false;
      hitmarker.classList.remove('visible');
      toast.classList.remove('visible');
      damageFlash.style.opacity = '0';

      buildMap(modeSelect.value==='training'?'training':mapSelect.value);
      selectWeapon('rifle');
      setupMode();

      gameState = 'paused';
      document.body.classList.remove('in-game');
      updateHUD();
    }

    function finishGame(won) {
      if (gameState === 'ended') return;

      gameState = 'ended';
      shootHeld = false;
      document.body.classList.remove('in-game');

      if (won) {
        setOverlay(
          'MISSÃO CUMPRIDA',
          currentMode==='bomb'?'Vitória da equipe atacante!':currentMode==='training'?'Treinamento concluído!':'Missão concluída.',
          'Jogar novamente'
        );
      } else {
        setOverlay(
          'VOCÊ FOI ELIMINADO',
          'Tente outra vez e use as coberturas da arena.',
          'Jogar novamente'
        );
      }

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      }
    }

    function damagePlayer(amount) {
      gameAudio.hurt();
      health = Math.max(0, health - amount);
      damageFlashAlpha = Math.min(0.58, damageFlashAlpha + 0.28);
      updateHUD();

      if (health <= 0) {
        finishGame(false);
      }
    }

    function eliminateBot(bot){
      if(!bot.alive)return;
      gameAudio.zombieDeath();
      bot.alive=false;scene.remove(bot.group);kills++;score+=bot.points||100;waveRemaining--;
      showToast('ELIMINADO '+(bot.kind||'COMUM').toUpperCase()+' +'+(bot.points||100));updateHUD();
      if(currentMode==='survival'&&waveRemaining===0){waveCooldown=3.8;showToast(`ONDA ${wave} CONCLUÍDA`);}
      if(currentMode==='training'){trainingHits++;trainingSessionKills++;scheduleTargetRespawn(bot);}
      if(currentMode==='bomb' && waveRemaining<=0)finishGame(true);
    }
    function chooseSpawnPoint(){
      const raw=activeSpawnPoints?.length?activeSpawnPoints:spawnPoints.map(([x,z])=>({x,z,types:['comum'],weight:1,count:1,minWave:1}));
      const candidates=raw.filter(s=>s.minWave<=wave&&!isBlocked(s.x,s.z,.5));
      const viable=candidates.filter(s=>Math.hypot(s.x-camera.position.x,s.z-camera.position.z)>10);
      const pool=viable.length?viable:candidates.length?candidates:raw;
      const weighted=pool.flatMap(s=>Array(Math.min(100,Math.round((s.weight||1)*(s.count||1)))).fill(s));
      return weighted[Math.floor(Math.random()*weighted.length)]||{x:-14,z:-14,types:['comum']};
    }
    function startWave(){
      waveRemaining=Math.min(4+wave*2,28);
      for(let i=0;i<waveRemaining;i++){
        const spawn=chooseSpawnPoint();const ids=(spawn.types||['comum']).filter(id=>allZombieTypes()[id]);
        const type=ids.length?ids[Math.floor(Math.random()*ids.length)]:'comum';
        const x=spawn.x,z=spawn.z;
        const bot=createBot(x+(Math.random()-.5)*1.2,z+(Math.random()-.5)*1.2,type);
        if(isBlocked(bot.group.position.x,bot.group.position.z,.4))bot.group.position.set(x,0,z);
      }
      updateHUD();showToast(`ONDA ${wave} · SOBREVIVA!`);
    }
    function updateWaves(dt){
      if(waveRemaining===0 && waveCooldown>0){waveCooldown-=dt;
        if(waveCooldown<=0){wave++;health=Math.min(100,health+20);
          for(const id of WEAPON_ORDER)inventory[id].reserve+=Math.ceil(WEAPONS[id].magazine*.6);
          reserveAmmo=inventory[selectedWeapon].reserve;
          startWave();}}
    }

    // ------------------------------------------------------------
    // Movimento, tiro e IA
    // ------------------------------------------------------------

    function updatePlayer(dt) {
      const forwardInput =
        (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
      const sideInput =
        (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);

      let moveX = 0;
      let moveZ = 0;

      if (forwardInput !== 0 || sideInput !== 0) {
        const forwardX = -Math.sin(yaw);
        const forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);

        moveX = forwardX * forwardInput + rightX * sideInput;
        moveZ = forwardZ * forwardInput + rightZ * sideInput;

        const length = Math.hypot(moveX, moveZ);
        moveX /= length;
        moveZ /= length;
      }

      const moving = Math.hypot(moveX, moveZ) > 0.01;
      const crouching = Boolean(keys.KeyC || keys.ControlLeft || keys.ControlRight);
      document.body.classList.toggle('crouching', crouching);
      const targetHeight = crouching ? CROUCH_HEIGHT : STANDING_HEIGHT;
      crouchHeight += (targetHeight - crouchHeight) * Math.min(1, 12 * dt);
      const speed = crouching ? 2.6 : (keys.ShiftLeft || keys.ShiftRight ? 8.2 : 5.2);

      const nextX = camera.position.x + moveX * speed * dt;
      const nextZ = camera.position.z + moveZ * speed * dt;

      if (!isBlocked(nextX, camera.position.z, 0.38)) {
        camera.position.x = nextX;
      }
      if (!isBlocked(camera.position.x, nextZ, 0.38)) {
        camera.position.z = nextZ;
      }

      if (jumpQueued && grounded && !crouching) {
        verticalVelocity = 5.3;
        grounded = false;
      }
      jumpQueued = false;

      if (!grounded) {
        verticalVelocity -= 15.5 * dt;
        camera.position.y += verticalVelocity * dt;

        if (camera.position.y <= crouchHeight) {
          camera.position.y = crouchHeight;
          verticalVelocity = 0;
          grounded = true;
        }
      }

      if (grounded) camera.position.y = crouchHeight;
      return moving;
    }

    function updateWeapon(dt, moving) {
      recoil = Math.max(0, recoil - dt * 0.85);

      const phase = performance.now() * 0.012;
      const bob = moving ? Math.sin(phase) * 0.009 : 0;
      const sideBob = moving ? Math.cos(phase * 0.5) * 0.007 : 0;

      gun.position.x = 0.32 + sideBob;
      gun.position.y = -0.27 + bob - recoil * 0.1;
      gun.position.z = -0.55 + recoil * 0.32;
      gun.rotation.x = recoil * 0.12;

      if (muzzleTimer > 0) {
        muzzleTimer -= dt;
        muzzle.visible = muzzleTimer > 0;
      }
    }

    // Entidades de projéteis de fantasia; colisão calculada no cliente para o modo offline.
    const weaponProjectiles=[];
    function clearWeaponProjectiles(){for(const p of weaponProjectiles){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose()}weaponProjectiles.length=0}
    function launchWeaponProjectile(weapon){
      const direction=new THREE.Vector3();camera.getWorldDirection(direction);
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshBasicMaterial({color:0xff9e4b}));
      mesh.position.copy(camera.position).addScaledVector(direction,.72);scene.add(mesh);
      weaponProjectiles.push({mesh,dir:direction,speed:weapon.projectileSpeed||22,range:0,weapon});
      showToast('PROJÉTIL LANÇADO · '+weapon.name.toUpperCase());
    }
    function explodeWeaponProjectile(p){
      gameAudio.explosion();const origin=p.mesh.position.clone();
      const range=p.weapon.blastRadius||4;
      for(const bot of [...bots]){
        if(!bot.alive)continue;
        const pos=bot.group.position.clone().add(new THREE.Vector3(0,1,0));
        const d=pos.distanceTo(origin);
        if(d<range){bot.health-=p.weapon.damage*Math.max(0,1-d/range);if(bot.health<=0)eliminateBot(bot)}
      }
      const pulse=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),new THREE.MeshBasicMaterial({color:0xffab52,transparent:true,opacity:.45,depthWrite:false}));
      pulse.position.copy(origin);pulse.scale.setScalar(range);scene.add(pulse);
      effects.push({line:pulse,life:.18,duration:.18});
    }
    function updateWeaponProjectiles(dt){
      for(let i=weaponProjectiles.length-1;i>=0;i--){const p=weaponProjectiles[i],travel=p.speed*dt;
        raycaster.set(p.mesh.position,p.dir);raycaster.near=0;raycaster.far=travel+.2;
        const objects=[...blockerMeshes,...bots.filter(b=>b.alive).flatMap(b=>b.parts)];
        const hits=raycaster.intersectObjects(objects,false);
        if(hits.length)p.mesh.position.copy(hits[0].point);
        else p.mesh.position.addScaledVector(p.dir,travel);
        p.range+=travel;
        if(hits.length||p.range>=70||p.mesh.position.y<=0.2){explodeWeaponProjectile(p);scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();weaponProjectiles.splice(i,1)}
      }
    }
    function tryShoot(){
      if(gameState!=='playing'||shotCooldown>0||reloading)return;
      const weapon=currentWeapon();
      if(weapon.slot!=='melee'&&ammo<=0){startReload();return;}
      if(weapon.slot!=='melee'){ammo--;saveAmmo();}shotsFired++;if(currentMode==='training')trainingSessionShots++;shotCooldown=weapon.cooldown;
      gameAudio.shot(weapon);
      recoil=weapon.damage>100?.31:.12;muzzleTimer=weapon.slot==='melee'?0:.055;muzzle.visible=weapon.slot!=='melee';
      scene.updateMatrixWorld(true);
      const moving=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD;
      const spread=(weapon.spread+(moving?weapon.movementSpread:0))*(sniperScopeLevel?0.45:1);
      if(weapon.mechanic==='projectile'){launchWeaponProjectile(weapon);updateHUD();return;}
      const activeParts=bots.filter(b=>b.alive).flatMap(b=>b.parts);
      let hitAny=false,headshotAny=false,killedAny=false,wallHit=false;
      for(let pellet=0;pellet<weapon.pellets;pellet++){
        raycaster.setFromCamera(new THREE.Vector2((Math.random()-.5)*spread,(Math.random()-.5)*spread),camera);
        raycaster.near=0;raycaster.far=weapon.slot==='melee'?2.5:75;
        const hits=raycaster.intersectObjects([...blockerMeshes,...activeParts],false);
        const direction=raycaster.ray.direction;
        let endpoint=camera.position.clone().addScaledVector(direction,weapon.slot==='melee'?2.5:65);
        if(hits.length){
          endpoint.copy(hits[0].point);
          const bot=hits[0].object.userData.bot;
          if(!bot)wallHit=true;
          if(bot&&bot.alive){
            hitAny=true;
            const head=['botHead','botHelmet'].includes(hits[0].object.name);
            if(currentMode==='training' && trainingDrillSelect.value==='headshot' && !head){
              // Em treino de HS, impactos no corpo são registrados mas não danificam o alvo.
            }else{
              bot.health-=weapon.damage*(head?weapon.headMultiplier*(bot.headMultiplier||2)/2:1);
              if(head && currentMode==='training')trainingHeadshots++;
            }
            if(head)headshotAny=true;
            if(bot.health<=0){killedAny=true;eliminateBot(bot);}
          }
        }
        if(weapon.slot!=='melee'&&(pellet===0||weapon.pellets===1))addTracer(camera.position.clone().addScaledVector(direction,.35),endpoint,0xffe3a0);
      }
      if(hitAny){
        shotsHit++;if(currentMode==='training')trainingSessionHits++;hitmarker.classList.add('visible');hitTimer=.15;
        if(headshotAny){gameAudio.headshot();showToast(killedAny?'HEADSHOT • ELIMINAÇÃO':'HEADSHOT!');}
        else if(killedAny){gameAudio.kill();}
        else gameAudio.hit();
      }else if(wallHit){gameAudio.wallImpact();}
      updateHUD();
    }
    // Granadas fictícias para o jogo: HE de área e fumaça visual (sem IA afetada).
    const grenadeEntities=[];
    let grenades={he:2,smoke:2};
    const grenadeGeo=new THREE.SphereGeometry(.13,10,8);
    function clearGrenades(){for(const g of grenadeEntities){scene.remove(g.mesh);g.mesh.geometry.dispose();g.mesh.material.dispose()}grenadeEntities.length=0}
    function throwGrenade(kind){
      if(gameState!=='playing'||weaponPanelOpen||grenades[kind]<=0)return;
      grenades[kind]--;
      const dir=new THREE.Vector3();camera.getWorldDirection(dir);
      const mesh=new THREE.Mesh(grenadeGeo.clone(),new THREE.MeshStandardMaterial({color:kind==='he'?0x60744d:0x8997a0,metalness:.45,roughness:.5}));
      mesh.position.copy(camera.position).addScaledVector(dir,.8);
      scene.add(mesh);
      const velocity=dir.multiplyScalar(12);velocity.y+=3.2;
      grenadeEntities.push({kind,mesh,velocity,timer:kind==='he'?2.2:1.8,cloud:false,life:0});
      showToast(kind==='he'?'GRANADA EXPLOSIVA LANÇADA':'GRANADA DE FUMAÇA LANÇADA');updateGrenadeHud();
    }
    function updateGrenadeHud(){const e=document.querySelector('#grenadeHud');if(e)e.textContent='G HE '+grenades.he+' · H FUMAÇA '+grenades.smoke}
    function updateGrenades(dt){
      for(let i=grenadeEntities.length-1;i>=0;i--){const g=grenadeEntities[i];
        if(g.cloud){g.life-=dt;g.mesh.material.opacity=Math.min(.22,Math.max(0,g.life/8*.22));g.mesh.scale.setScalar(Math.min(1,1+(8-g.life)*.12));if(g.life<=0){scene.remove(g.mesh);g.mesh.geometry.dispose();g.mesh.material.dispose();grenadeEntities.splice(i,1)}continue}
        g.timer-=dt;g.velocity.y-=12*dt;
        g.mesh.position.addScaledVector(g.velocity,dt);
        if(g.mesh.position.y<.16){g.mesh.position.y=.16;g.velocity.y*=-.42;g.velocity.x*=.72;g.velocity.z*=.72}
        if(g.timer>0)continue;
        if(g.kind==='he'){
          gameAudio.explosion();
          const p=g.mesh.position.clone();
          const range=5.5; // raio lúdico: não representa uma arma real.
          for(const bot of [...bots]){if(!bot.alive)continue;const dist=bot.group.position.distanceTo(new THREE.Vector3(p.x,0,p.z));if(dist<range){bot.health-=Math.round(120*(1-dist/range));if(bot.health<=0)eliminateBot(bot)}}
          const pulse=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xff9a40,transparent:true,opacity:.36,depthWrite:false}));pulse.position.copy(p);pulse.scale.setScalar(range);scene.add(pulse);
          scene.remove(g.mesh);g.mesh.geometry.dispose();g.mesh.material.dispose();g.mesh=pulse;g.cloud=true;g.life=.18;
        }else{
          gameAudio.smoke();
          scene.remove(g.mesh);g.mesh.geometry.dispose();g.mesh.material.dispose();
          const smoke=new THREE.Mesh(new THREE.SphereGeometry(4,20,14),new THREE.MeshBasicMaterial({color:0x9ba4aa,transparent:true,opacity:.22,depthWrite:false}));smoke.position.copy(g.mesh.position);smoke.position.y=1.8;scene.add(smoke);
          g.mesh=smoke;g.cloud=true;g.life=8;
        }
      }
    }

    function startReload(){
      const weapon=currentWeapon();
      if(weapon.slot==='melee'||reloading||ammo>=weapon.magazine||reserveAmmo<=0)return;
      gameAudio.reload(weapon);
      reloading=true;reloadTimer=weapon.reload;updateHUD();showToast(`RECARREGANDO ${weapon.name.toUpperCase()}`);
    }
    function updateBots(dt){
      for(const bot of bots){
        if(!bot.alive)continue;
        const position=bot.group.position;
        const dx=camera.position.x-position.x,dz=camera.position.z-position.z;
        const distance=Math.hypot(dx,dz);
        bot.group.rotation.y=Math.atan2(dx,dz);
        // Zumbis atacam corpo a corpo; não usam armas nem disparos probabilísticos.
        if(currentMode==='training'){continue;}
        if(distance>1.15){
          if(distance<8 && Math.random()<dt*.4)gameAudio.zombie(distance);
          moveBot(bot,dx,dz,dt);
        } else {
          bot.attackTimer-=dt;
          if(bot.attackTimer<=0){bot.attackTimer=bot.attackInterval||1.15;gameAudio.zombie(distance);damagePlayer((bot.attack||7)+Math.min(wave,12));}
        }
        const t=performance.now()*.005+position.x;
        for(const p of bot.parts){if(p.name==='botArm')p.rotation.x=Math.sin(t)*.14;}
        if(gameState!=='playing')break;
      }
    }

    // ------------------------------------------------------------
    // Entradas do jogador
    // ------------------------------------------------------------

    function startOrResume() {
      gameAudio.unlock();
      if (gameState === 'menu' || gameState === 'ended') {
        if(customLoading){mapStatus.textContent='Aguarde o carregamento do mapa antes de iniciar.';return;}
        resetGame();
        setOverlay(
          currentMode==='training'?'WMK ACADEMIA FPS':currentMode==='bomb'?'OPERAÇÃO BOMBA':'WMK ZOMBIE ARENA',
          currentMode==='training'?'Alvos carregados. Capture o mouse para começar o exercício '+trainingLabel()+'.':'Prepare-se para entrar na partida.',
          'ENTRANDO...'
        );
      } else {
        startButton.textContent = 'Entrando...';
      }

      try {
        const request = renderer.domElement.requestPointerLock();
        if (request && typeof request.catch === 'function') {
          request.catch(() => {
            startButton.textContent = 'Tentar novamente';
            overlayText.textContent = 'Não foi possível capturar o mouse. Use localhost (Live Server ou python -m http.server) e permita o bloqueio do ponteiro.';
          });
        }
      } catch {
        startButton.textContent = 'Tentar novamente';
            overlayText.textContent = 'Não foi possível capturar o mouse. Use localhost (Live Server ou python -m http.server) e permita o bloqueio do ponteiro.';
      }
    }

    startButton.addEventListener('click', startOrResume);
    const audioToggle=document.querySelector('#audioToggle');
    const audioVolume=document.querySelector('#audioVolume');
    if(audioToggle){audioToggle.checked=gameAudio.config.enabled;audioToggle.addEventListener('change',e=>gameAudio.setEnabled(e.target.checked));}
    if(audioVolume){audioVolume.value=Math.round(gameAudio.config.volume*100);audioVolume.addEventListener('input',e=>gameAudio.setVolume(Number(e.target.value)/100));}


    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === renderer.domElement;

      if (locked) {
        if (gameState === 'paused') gameState = 'playing';

        if (gameState === 'playing') {
          overlay.classList.add('hidden');
          document.body.classList.add('in-game');
        }
      } else {
        document.body.classList.remove('in-game');
        shootHeld = false;

        if (gameState === 'playing') {
          gameState = 'paused';
          if(!weaponPanelOpen)setOverlay(
            'PARTIDA PAUSADA',
            'O mouse foi liberado. Clique em continuar para voltar.',
            'Continuar'
          );
        }
      }
    });

    document.addEventListener('mousemove', (event) => {
      if (
        document.pointerLockElement !== renderer.domElement ||
        gameState !== 'playing'
      ) {
        return;
      }

      const sensitivity=sniperScopeLevel?0.0011:0.0022;
      yaw -= event.movementX * sensitivity;
      pitch -= event.movementY * sensitivity;
      pitch = Math.max(-1.48, Math.min(1.48, pitch));

      camera.rotation.set(pitch, yaw, 0, 'YXZ');
    });

    document.addEventListener('keydown', (event) => {
      if(weaponPanelOpen){
        if(event.code==='Escape'||event.code==='KeyB'){event.preventDefault();closeWeaponPanel();return;}
        if(event.code==='Backspace'){event.preventDefault();buyCategory=null;buildWeaponUI();return;}
        if(/^Digit[1-9]$/.test(event.code) && !event.repeat){event.preventDefault();handleBuyDigit(Number(event.code.slice(-1)));return;}
        return;
      }
      if (gameState !== 'playing') return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) jumpQueued = true;
      }

      keys[event.code] = true;

      if(event.code==='KeyR'&&!event.repeat)startReload();
      if(event.code==='KeyV'&&!event.repeat){sniperScopeLevel=0;updateScope();}
      if(event.code==='KeyP'&&!event.repeat)toggleCameraMode();
      if(event.code==='KeyG'&&!event.repeat)throwGrenade('he');
      if(event.code==='KeyH'&&!event.repeat)throwGrenade('smoke');
      if(!event.repeat && ['Digit1','Digit2','Digit3'].includes(event.code)){
        const slots=['primary','secondary','melee'];selectWeapon(loadout[slots[Number(event.code.slice(-1))-1]]);
      }
      if(event.code==='KeyB'&&!event.repeat)openWeaponPanel();
    });

    document.addEventListener('keyup', (event) => {
      keys[event.code] = false;
    });

    window.addEventListener('mousedown', (event) => {
      if(event.button===2&&gameState==='playing'&&!weaponPanelOpen&&(selectedWeapon==='awp'||selectedWeapon==='sniper')){sniperScopeLevel=(sniperScopeLevel+1)%3;gameAudio.scope();updateScope();return;}
      if (
        event.button === 0 &&
        gameState === 'playing' &&
        document.pointerLockElement === renderer.domElement
      ) {
        shootHeld = true;
        tryShoot();
      }
    });

    window.addEventListener('mouseup', (event) => {
      if (event.button === 0) shootHeld = false;
    });

    window.addEventListener('blur', () => {
      shootHeld = false;
      for (const key in keys) delete keys[key];
    });

    renderer.domElement.addEventListener('wheel',(event)=>{
      if(!thirdPersonEnabled||gameState!=='playing')return;
      event.preventDefault();
      thirdPersonDistance=THREE.MathUtils.clamp(thirdPersonDistance+Math.sign(event.deltaY)*.45,2,7);
    },{passive:false});
    renderer.domElement.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    // ------------------------------------------------------------
    // Loop principal
    // ------------------------------------------------------------

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.05);

      if (gameState === 'playing') {
        elapsedTime += dt;
        const moving = updatePlayer(dt);
        updateHUD();

        shotCooldown = Math.max(0, shotCooldown - dt);

        if (reloading) {
          reloadTimer -= dt;

          if (reloadTimer <= 0) {
            const needed = currentWeapon().magazine - ammo;
            const loaded = Math.min(needed, reserveAmmo);

            ammo += loaded;
            reserveAmmo -= loaded;
            saveAmmo();
            reloading = false;
            gameAudio.reloadComplete();
            updateHUD();
          }
        }

        if (shootHeld && currentWeapon().type === 'auto') tryShoot();

        updateBots(dt);
        updateGrenades(dt);
        updateWeaponProjectiles(dt);
        if(currentMode==='survival')updateWaves(dt);
        if(currentMode==='bomb')updateBombMode(dt);
        if(currentMode==='training')updateTrainingTargets(dt);
        updateWeapon(dt, moving);
      }

      if (gameState === 'playing') updateEffects(dt);

      if (gameState === 'playing' && hitTimer > 0) {
        hitTimer -= dt;
        if (hitTimer <= 0) hitmarker.classList.remove('visible');
      }

      if (gameState === 'playing' && toastTimer > 0) {
        toastTimer -= dt;
        if (toastTimer <= 0) toast.classList.remove('visible');
      }

      if (gameState === 'playing') damageFlashAlpha = Math.max(0, damageFlashAlpha - dt * 1.8);
      damageFlash.style.opacity = damageFlashAlpha.toFixed(2);

      updateThirdPersonCamera(dt);
      renderer.render(scene,thirdPersonEnabled&&sniperScopeLevel===0?thirdPersonCamera:camera);
    }

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      thirdPersonCamera.aspect=camera.aspect;thirdPersonCamera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    selectWeapon('rifle');
    updateHUD();
    animate();
