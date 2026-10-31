import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';

// Display only: all ecological indices are supplied by model.js.
export function createTidalScene(host) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8eff0');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', '회전하고 확대할 수 있는 갯벌 3D 모형. 아래 버튼 또는 방향키로도 조작할 수 있습니다.');
  renderer.domElement.tabIndex = 0;
  host.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enablePan = false;
  controls.minDistance = 9;
  controls.maxDistance = 25;
  controls.minPolarAngle = .24;
  controls.maxPolarAngle = Math.PI / 2 - .12;
  controls.enableDamping = false;
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);
  function resetCamera() {
    camera.position.set(11, 10, 13);
    controls.target.set(0, 0, 0);
    controls.update();
    render();
  }
  scene.add(new THREE.HemisphereLight('#fff8e8', '#727b66', 2.8));
  const sun = new THREE.DirectionalLight('#fff4d8', 3);
  sun.position.set(-6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left:-9, right:9, top:8, bottom:-8, near:1, far:35 });
  sun.shadow.bias = -.001;
  scene.add(sun);

  const geometries = new Set(), materials = new Set();
  function material(color, extra = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness:.9, ...extra });
    materials.add(m); return m;
  }
  const soil = material('#9e8060'), layer = material('#bca181'), mud = material('#bca57f');
  const water = material('#72aca9', { metalness:.15, roughness:.32 });
  const white = material('#fcf9eb'), charcoal = material('#3f5147');
  const reed = material('#6e8957'), stem = material('#ad8959');
  const dirty = material('#83755c'), sign = material('#3f6f57');
  function mesh(geometry, mat, parent = scene) {
    geometries.add(geometry);
    const result = new THREE.Mesh(geometry, mat);
    result.castShadow = true; result.receiveShadow = true;
    parent.add(result); return result;
  }
  function box(w,h,d,mat,x,y,z,parent) {
    const result=mesh(new THREE.BoxGeometry(w,h,d),mat,parent);
    result.position.set(x,y,z);return result;
  }
  box(12,.65,8,soil,0,-.5,0);
  box(12,.13,8,layer,0,-.12,0);
  box(12,.10,8,water,0,.015,0);
  const mudGroup = new THREE.Group();scene.add(mudGroup);
  const mudBlock = box(12,.16,1,mud,0,.13,0,mudGroup);
  const surfaceGeometry = new THREE.PlaneGeometry(12,1,36,20);
  const surfacePositions = surfaceGeometry.attributes.position;
  for(let i=0;i<surfacePositions.count;i++) {
    const x=surfacePositions.getX(i), y=surfacePositions.getY(i);
    surfacePositions.setZ(i,.018*Math.sin(x*6+y*18)+.009*Math.cos(x*3-y*8));
  }
  surfaceGeometry.computeVertexNormals();
  const surface=mesh(surfaceGeometry,mud,mudGroup);
  surface.rotation.x=-Math.PI/2;surface.position.y=.22;
  const birdGroup=new THREE.Group(), reeds=new THREE.Group(), pollution=new THREE.Group(), signs=new THREE.Group();
  scene.add(birdGroup,reeds,pollution,signs);
  function sphere(radius,mat,x,y,z,parent,sx=1,sy=1,sz=1) {
    const result=mesh(new THREE.SphereGeometry(radius,12,8),mat,parent);
    result.position.set(x,y,z);result.scale.set(sx,sy,sz);return result;
  }
  // Reuse a small pool: sliders only move or hide objects, never allocate per frame.
  for(let i=0;i<12;i++) {
    const bird=new THREE.Group();birdGroup.add(bird);
    sphere(.17,white,0,.54,0,bird,1.8,.85,1);
    const neck=mesh(new THREE.CylinderGeometry(.045,.05,.42,8),white,bird);
    neck.position.set(.19,.78,0);neck.rotation.z=-.2;
    sphere(.085,white,.23,1.02,0,bird);
    const beak=mesh(new THREE.ConeGeometry(.04,.34,8),charcoal,bird);
    beak.rotation.z=-Math.PI/2;beak.position.set(.43,1.015,0);
    sphere(.015,charcoal,.267,1.044,.066,bird);
    for(const z of [-.075,.075]) {
      const leg=mesh(new THREE.CylinderGeometry(.014,.014,.34,6),charcoal,bird);
      leg.position.set(-.04,.29,z);
    }
    bird.rotation.y=(i%3-1)*.8;
  }
  for(let i=0;i<18;i++) {
    const clump=new THREE.Group();reeds.add(clump);
    for(let j=0;j<4;j++) {
      const stalk=mesh(new THREE.CylinderGeometry(.012,.018,.45+j*.09,5),reed,clump);
      stalk.position.set((j-1.5)*.065,.3+j*.045,0);stalk.rotation.z=(j-1.5)*.13;
    }
  }
  for(let i=0;i<24;i++) sphere(.07+(i%3)*.025,dirty,0,.12,0,pollution,1.5,.5,1);
  for(let i=0;i<5;i++) {
    const marker=new THREE.Group();signs.add(marker);
    box(.055,.7,.055,stem,0,.47,0,marker);
    box(.46,.29,.07,sign,0,.8,0,marker);
    box(.24,.035,.08,white,0,.8,.01,marker);
  }
  function update(inputs, metrics) {
    const depth=8*inputs.area/100, edge=4-depth;
    mudGroup.visible=depth>0;
    mudBlock.scale.z=depth;mudBlock.position.z=4-depth/2;
    surface.scale.y=depth;surface.position.z=4-depth/2;
    const birdCount=Math.round(metrics.birds/9);
    birdGroup.children.forEach((b,i)=>{
      b.visible=i<birdCount && depth>0;
      b.position.set(-4.8+((i*2.17)%9.5),.08,edge+depth*(.18+(i%3)*.24));
    });
    reeds.children.forEach((r,i)=>{
      r.visible=i<Math.ceil(inputs.area/7) && depth>0;
      r.position.set(-5.4+(i*.67)%10.8,.18,edge+depth*(i%2 ? .88 : .73));
    });
    pollution.children.forEach((p,i)=>{
      p.visible=i<Math.round(inputs.pollution/100*24);
      p.position.set(-5.2+((i*1.71)%10.4),depth===8 ? .28 : .11,
        depth===8 ? -3.7+((i*1.1)%7.4) : -3.8+((i*.79)%(Math.max(.15,8-depth)*.85)));
    });
    signs.children.forEach((s,i)=>{
      s.visible=depth>0 && i<Math.round(inputs.protection/20);
      s.position.set(-4.7+i*2.35,.08,3.6);
    });
    host.dataset.area=String(inputs.area);
    host.dataset.birds=String(birdCount);
    renderer.domElement.setAttribute('aria-label', `갯벌 3D 모형. 면적 ${inputs.area}%, 오염 부담 ${inputs.pollution}, 보호 노력 ${inputs.protection}. 철새 쉼터 지수 ${metrics.birds}. 새와 오염 입자는 가상 지수의 상징입니다.`);
    render();
  }
  function orbit(dx,dy=0) {
    const offset=camera.position.clone().sub(controls.target);
    const spherical=new THREE.Spherical().setFromVector3(offset);
    spherical.theta+=dx;
    spherical.phi=THREE.MathUtils.clamp(spherical.phi+dy,controls.minPolarAngle,controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();render();
  }
  function zoom(factor) {
    const offset=camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));
    camera.position.copy(controls.target).add(offset);controls.update();render();
  }
  renderer.domElement.addEventListener('keydown',e=>{
    const actions={ArrowLeft:()=>orbit(-.15),ArrowRight:()=>orbit(.15),ArrowUp:()=>orbit(0,-.12),ArrowDown:()=>orbit(0,.12),'+':()=>zoom(.85),'=':()=>zoom(.85),'-':()=>zoom(1.18),'Home':resetCamera};
    if(actions[e.key]){e.preventDefault();actions[e.key]();}
  });
  const observer=new ResizeObserver(()=>{
    const {width,height}=host.getBoundingClientRect();
    if(width<1 || height<1)return;
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();
  });
  observer.observe(host);
  resetCamera();
  return {update,resetCamera,orbit,zoom, dispose(){
    observer.disconnect();controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();
  }};
}
