// WMK Zombie Arena — motor de áudio procedural original, sem samples comerciais.
// As frequências e envelopes são efeitos artísticos de jogo, não simulação real de armas.
const PROFILES={
 pistol:{pitch:175,duration:.115,noise:.75,lowpass:2500},
 shotgun:{pitch:92,duration:.28,noise:1,lowpass:1450},
 smg:{pitch:200,duration:.085,noise:.65,lowpass:2900},
 rifle:{pitch:130,duration:.16,noise:.9,lowpass:2050},
 sniper:{pitch:72,duration:.44,noise:1,lowpass:1250},
 machine:{pitch:110,duration:.13,noise:.9,lowpass:1800},
 melee:{pitch:290,duration:.09,noise:.55,lowpass:1900}
};
const SND_STORAGE='wmk_zombie_audio_v1';
function clamp(n,a,b){return Math.min(b,Math.max(a,n));}
export class GameAudio {
 constructor(){this.context=null;this.master=null;this.effects=null;this.ambient=null;this.lastZombie=0;this.cache=new Map();this.config={enabled:true,volume:.55,ambient:.35};try{Object.assign(this.config,JSON.parse(localStorage.getItem(SND_STORAGE)||'{}'));}catch{};this.config.volume=clamp(Number(this.config.volume)||0,0,1);}
 async unlock(){if(!this.config.enabled)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.connect(this.context.destination);this.effects=this.context.createGain();this.effects.gain.value=1;this.effects.connect(this.master);this.ambient=this.context.createGain();this.ambient.gain.value=this.config.ambient;this.ambient.connect(this.master);this.sync();}if(this.context.state==='suspended')await this.context.resume();}catch(e){console.warn('Áudio indisponível:',e);}}
 sync(){if(this.master)this.master.gain.setTargetAtTime(this.config.enabled?this.config.volume:0,this.context.currentTime,.02);if(this.ambient)this.ambient.gain.setTargetAtTime(clamp(this.config.ambient,0,1),this.context.currentTime,.02);try{localStorage.setItem(SND_STORAGE,JSON.stringify(this.config));}catch{}}
 setEnabled(enabled){this.config.enabled=Boolean(enabled);this.sync();if(enabled)this.unlock();}
 setVolume(n){this.config.volume=clamp(Number(n),0,1);this.sync();}
 noise(duration){const ctx=this.context;const len=Math.max(128,Math.ceil(ctx.sampleRate*duration));const buf=ctx.createBuffer(1,len,ctx.sampleRate);const data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;return buf;}
 tone({pitch=140,duration=.15,noise=.6,lowpass=2400,volume=.35,detune=0},gainParent){const c=this.context;if(!c||c.state!=='running'||!this.config.enabled)return;const t=c.currentTime, out=c.createGain(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(lowpass,t);out.gain.setValueAtTime(Math.max(.0001,volume),t);out.gain.exponentialRampToValueAtTime(.0001,t+duration);filter.connect(out);out.connect(gainParent||this.effects);const osc=c.createOscillator();osc.type='triangle';osc.frequency.setValueAtTime(Math.max(35,pitch+detune),t);osc.frequency.exponentialRampToValueAtTime(Math.max(30,pitch*.42),t+duration);osc.connect(filter);osc.start(t);osc.stop(t+duration+.012);osc.onended=()=>{osc.disconnect();filter.disconnect();out.disconnect();};if(noise>0){const src=c.createBufferSource(),nGain=c.createGain();src.buffer=this.noise(duration);nGain.gain.value=clamp(noise,0,1);src.connect(nGain);nGain.connect(filter);src.start(t);src.stop(t+duration);src.onended=()=>{src.disconnect();nGain.disconnect()};}}
 // Para sons gravados próprios: audio: {shot:'assets/audio/ak47.ogg',reload:'...'} em WEAPONS.
 async sample(url,volume=.5){if(!this.context||!this.config.enabled||!url||!/^assets\/audio\/[\w./-]+\.(ogg|mp3|wav)$/i.test(url)||url.includes('..'))return false;try{let buffer=this.cache.get(url);if(!buffer){const response=await fetch(url);if(!response.ok)throw Error(`HTTP ${response.status}`);buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.cache.set(url,buffer);}const source=this.context.createBufferSource(),g=this.context.createGain();source.buffer=buffer;g.gain.value=volume;source.connect(g);g.connect(this.effects);source.start();source.onended=()=>{source.disconnect();g.disconnect()};return true;}catch(e){console.warn('Falha no sample',url,e);return false;}}
 shot(weapon){if(!weapon)return;const profile=PROFILES[weapon.category]||PROFILES.rifle;const custom=weapon.audio?.shot;if(custom){this.sample(custom,.65).then(ok=>{if(!ok)this.tone(profile);});return;}this.tone(profile);}
 reload(weapon){if(weapon?.audio?.reload){this.sample(weapon.audio.reload,.6).then(ok=>{if(!ok)this.reloadDefault()});return;}this.reloadDefault();}
 reloadDefault(){this.tone({pitch:540,duration:.055,noise:.12,lowpass:3800,volume:.14});}
 reloadComplete(){this.tone({pitch:360,duration:.08,noise:.14,lowpass:3200,volume:.12});}
 zombie(distance=7){if(!this.context||!this.config.enabled)return;const now=performance.now();if(now-this.lastZombie<750)return;this.lastZombie=now;const attenuation=1/(1+Math.max(0,distance)*.15);this.tone({pitch:65+Math.random()*32,duration:.35,noise:.28,lowpass:700,volume:.22*attenuation},this.ambient);}
 // Feedback de impacto: executado uma vez por disparo (não por fragmento da escopeta).
 // Sons ORIGINAIS sintetizados com Web Audio. Prioridade: headshot > eliminação > acerto.
 hit(){this.tone({pitch:490,duration:.058,noise:.09,lowpass:3600,volume:.14});}
 headshot(){
   this.tone({pitch:1000,duration:.095,noise:.04,lowpass:4100,volume:.21});
   const c=this.context;
   if(!c||c.state!=='running'||!this.config.enabled)return;
   const t=c.currentTime+.074,o=c.createOscillator(),g=c.createGain();
   o.type='sine';o.frequency.setValueAtTime(1450,t);o.frequency.exponentialRampToValueAtTime(930,t+.125);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.009);
   g.gain.exponentialRampToValueAtTime(.0001,t+.13);o.connect(g);g.connect(this.effects);
   o.start(t);o.stop(t+.14);o.onended=()=>{o.disconnect();g.disconnect()};
 }
 kill(){this.tone({pitch:610,duration:.13,noise:.07,lowpass:3300,volume:.16});}
 wallImpact(){this.tone({pitch:220,duration:.035,noise:.22,lowpass:2500,volume:.075});}
 zombieDeath(){this.tone({pitch:90,duration:.38,noise:.4,lowpass:900,volume:.18});}
 hurt(){this.tone({pitch:105,duration:.19,noise:.6,lowpass:1100,volume:.26});}
 explosion(){this.tone({pitch:50,duration:.8,noise:1,lowpass:750,volume:.5});}
 smoke(){this.tone({pitch:155,duration:.32,noise:.85,lowpass:2400,volume:.19});}
 scope(){this.tone({pitch:700,duration:.04,noise:.03,lowpass:3000,volume:.08});}
}
export const gameAudio=new GameAudio();
