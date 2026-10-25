import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader=new GLTFLoader();const scenes=[];
function create(stage){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.01,100);
 scene.add(new THREE.HemisphereLight(0xf2fff9,0x0c3b2b,3.1));
 const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(3,5,6);scene.add(key);
 const rim=new THREE.DirectionalLight(0x37d7a1,2.8);rim.position.set(-4,3,-4);scene.add(rim);
 stage.appendChild(renderer.domElement);const player=stage.dataset.type==='player';camera.position.set(0,player?1.5:0,player?8.5:5.5);
 const item={stage,renderer,scene,camera,object:null,player,mode:player?'front':'auto',visible:true,angle:0};scenes.push(item);
 loader.load(stage.dataset.model,g=>{const model=g.scene;const bounds=new THREE.Box3().setFromObject(model);const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 model.position.sub(center);const target=player?3.1:2.7;const factor=target/Math.max(size.x,size.y,size.z);model.scale.setScalar(factor);
 if(player){model.rotation.y=0;}item.object=model;scene.add(model);stage.classList.add('model-loaded');resize(item)},undefined,()=>{renderer.dispose();renderer.domElement.remove()});
 return item;
}
function resize(item){const w=item.stage.clientWidth,h=item.stage.clientHeight;if(!w||!h)return;item.renderer.setSize(w,h,false);item.camera.aspect=w/h;item.camera.updateProjectionMatrix()}
try{document.querySelectorAll('[data-model]').forEach(create)}catch(e){console.warn('Vista 3D no disponible; se muestra imagen de respaldo.',e)}
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{const item=scenes.find(s=>s.stage===e.target);if(item)item.visible=e.isIntersecting}),{rootMargin:'150px'});scenes.forEach(item=>obs.observe(item.stage));
window.addEventListener('resize',()=>scenes.forEach(resize),{passive:true});
document.querySelectorAll('[data-model-view]').forEach(button=>button.addEventListener('click',()=>{const item=scenes.find(s=>s.player);if(!item)return;item.mode=button.dataset.modelView;document.querySelectorAll('[data-model-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))}));
let last=0;function loop(t){requestAnimationFrame(loop);const dt=Math.min((t-last)/1000,.05);last=t;for(const item of scenes){if(!item.visible||!item.object)continue;
 if(item.player){if(item.mode==='auto'&&!reduce)item.angle+=dt*.55;else{const target=item.mode==='back'?Math.PI:0;let diff=((target-item.angle+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;item.angle+=diff*Math.min(1,dt*4)}item.object.rotation.y=item.angle}
 else if(!reduce){const rect=item.stage.getBoundingClientRect(),scrollProgress=Math.max(-1,Math.min(1,(window.innerHeight/2-rect.top-rect.height/2)/window.innerHeight));item.object.rotation.y=scrollProgress*.7+Math.sin(t*.00032)*.13;item.object.rotation.x=-.08+Math.sin(t*.00025)*.04}
 item.renderer.render(item.scene,item.camera)}}requestAnimationFrame(loop);
