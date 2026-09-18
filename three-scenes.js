/* REKLAM · 3D scenes (three.js r160)
   hero: 3D F1 car + flippable ad billboards
   livery: same car, decals fly on when words are picked
   ring: 3D carousel of real platform screenshots
   flag: waving chequered flag in the finale */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const R = window.REKLAM || {};
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.6 : 2);

function glOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

async function boot() {
  if (!glOK()) throw new Error('no webgl');
  try { await Promise.race([Promise.all([document.fonts.load('900 64px Unbounded'), document.fonts.load('700 40px Caveat')]), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
  root.classList.remove('no3d'); root.classList.add('has3d');

  const stages = [];
  const clock = new THREE.Clock();

  /* ---------- shared helpers ---------- */
  function stage(canvas, { fov = 32, env = true } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(DPR);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    if (env) {
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
    const st = { renderer, scene, camera, canvas, visible: false, update: null, onResize: null, w: 1, h: 1 };
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      st.w = w; st.h = h;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      st.onResize && st.onResize(w, h);
    };
    new ResizeObserver(resize).observe(canvas); resize();
    new IntersectionObserver(es => { st.visible = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(canvas);
    stages.push(st);
    return st;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // text → CanvasTexture (auto-fit, optional skew, sticker look)
  function textTex(text, { w = 512, h = 256, bg = '#fff', fg = '#111', font = 'Unbounded', weight = 900, skew = -0.16, radius = 18, pad = .86, border = null, tape = false } = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (bg) { g.fillStyle = bg; roundRect(g, 0, 0, w, h, radius); g.fill(); }
    if (border) { g.lineWidth = 10; g.strokeStyle = border; roundRect(g, 8, 8, w - 16, h - 16, radius); g.stroke(); }
    const lines = String(text).split('\n');
    let size = Math.floor(h / (lines.length * 1.05));
    const fit = () => { g.font = `${weight} ${size}px ${font}, Arial Black, sans-serif`; return Math.max(...lines.map(l => g.measureText(l).width)); };
    while (fit() > w * pad && size > 10) size -= 2;
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.setTransform(1, 0, skew, 1, -skew * h / 2, 0);
    const lh = size * 1.02, y0 = h / 2 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => g.fillText(l, w / 2, y0 + i * lh + size * .04));
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (tape) { g.fillStyle = 'rgba(255,240,170,.8)'; g.save(); g.translate(w / 2, 10); g.rotate(-.05); g.fillRect(-60, -14, 120, 30); g.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  function blobShadow(w = 5.4, d = 2.4, o = .45) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, `rgba(0,0,0,${o})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.005;
    return m;
  }

  function rod(a, b, r, mat) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), mat);
    m.position.copy(A).add(B).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  }

  /* ---------- procedural F1 car ---------- */
  function buildCar({ body = '#00665a', accent = '#D7EA1A', dark = '#0d1f1c', stripe = '#D7EA1A', helmet = '#FFD500' } = {}) {
    const car = new THREE.Group();
    const mBody = new THREE.MeshPhysicalMaterial({ color: body, metalness: .45, roughness: .28, clearcoat: 1, clearcoatRoughness: .12 });
    const mAcc = new THREE.MeshStandardMaterial({ color: accent, metalness: .25, roughness: .35 });
    const mDark = new THREE.MeshStandardMaterial({ color: dark, metalness: .5, roughness: .4 });
    const mCarbon = new THREE.MeshStandardMaterial({ color: '#101010', metalness: .6, roughness: .45 });
    const mTyre = new THREE.MeshStandardMaterial({ color: '#151515', roughness: .88 });
    const mStripe = new THREE.MeshStandardMaterial({ color: stripe, roughness: .5 });
    const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); car.add(m); return m; };

    // monocoque + nose: extruded side profile, nose tapered in z
    const s = new THREE.Shape();
    s.moveTo(-1.95, .16); s.lineTo(-1.95, .5); s.lineTo(-1.05, .6); s.lineTo(-.5, .86); s.lineTo(-.1, .86);
    s.lineTo(.08, .62); s.lineTo(.75, .55); s.quadraticCurveTo(1.6, .44, 2.3, .27); s.lineTo(2.34, .18); s.lineTo(-1.95, .16);
    const tub = new THREE.ExtrudeGeometry(s, { depth: .52, bevelEnabled: true, bevelThickness: .06, bevelSize: .05, bevelSegments: 3, curveSegments: 16 });
    tub.translate(0, 0, -.26);
    const p = tub.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      if (x > .8) p.setZ(i, p.getZ(i) * (1 - .45 * Math.min(1, (x - .8) / 1.5)));
      if (x < -1.1) p.setZ(i, p.getZ(i) * (1 - .35 * Math.min(1, (-1.1 - x) / .85)));
    }
    tub.computeVertexNormals();
    add(tub, mBody);
    add(new THREE.BoxGeometry(.6, .04, .36), mCarbon, .38, .6, 0); // cockpit opening

    // sidepods + intakes
    for (const sd of [-1, 1]) {
      const pod = new THREE.BoxGeometry(1.5, .36, .42, 4, 1, 1);
      const pp = pod.attributes.position;
      for (let i = 0; i < pp.count; i++) { const x = pp.getX(i); if (x < 0) { const k = 1 - .45 * (-x / .75); pp.setY(i, pp.getY(i) * k - (1 - k) * .1); } }
      pod.computeVertexNormals();
      add(pod, mBody, -.35, .36, sd * .5);
      add(new THREE.BoxGeometry(.04, .24, .34), mCarbon, .41, .38, sd * .5);
      add(new THREE.BoxGeometry(.08, .05, .1), mCarbon, .55, .72, sd * .36); // mirrors
    }
    add(new THREE.BoxGeometry(1.1, .28, .026), mBody, -1.35, .7, 0); // shark fin
    add(new THREE.BoxGeometry(3.3, .04, 1.3), mCarbon, -.1, .1, 0);  // floor

    // rear wing
    add(new THREE.BoxGeometry(.42, .16, 1.34), mDark, -2.05, .98, 0);
    const flap = add(new THREE.BoxGeometry(.3, .05, 1.34), mAcc, -1.95, 1.1, 0); flap.rotation.z = .28;
    for (const sd of [-1, 1]) add(new THREE.BoxGeometry(.56, .62, .035), mBody, -2.05, .72, sd * .685);
    add(new THREE.BoxGeometry(.08, .42, .05), mCarbon, -1.95, .66, 0);

    // front wing
    add(new THREE.BoxGeometry(.5, .035, 1.8), mDark, 2.15, .1, 0);
    const fflap = add(new THREE.BoxGeometry(.34, .03, 1.8), mAcc, 2.04, .16, 0); fflap.rotation.z = .22;
    for (const sd of [-1, 1]) add(new THREE.BoxGeometry(.46, .2, .03), mBody, 2.15, .16, sd * .9);

    // halo + helmet
    const halo = new THREE.TorusGeometry(.3, .034, 8, 28, Math.PI);
    halo.rotateX(-Math.PI / 2); halo.rotateY(-Math.PI / 2);
    add(halo, mCarbon, .06, .9, 0);
    car.add(rod([.36, .9, 0], [.6, .58, 0], .03, mCarbon));
    for (const sd of [-1, 1]) car.add(rod([.06, .9, sd * .3], [-.08, .62, sd * .27], .03, mCarbon));
    add(new THREE.SphereGeometry(.15, 20, 16), new THREE.MeshPhysicalMaterial({ color: helmet, roughness: .25, clearcoat: 1 }), .02, .8, 0);
    add(new THREE.BoxGeometry(.06, .05, .2), mCarbon, .14, .82, 0);

    // wheels
    const wheels = [];
    const wheel = (x, r, w, z) => {
      const wg = new THREE.Group(); wg.position.set(x, r, z);
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36, 1), mTyre); tyre.rotation.x = Math.PI / 2; wg.add(tyre);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * .6, r * .6, w + .012, 24), mDark); rim.rotation.x = Math.PI / 2; wg.add(rim);
      const spin = new THREE.Group(); wg.add(spin);
      for (const sd of [-1, 1]) {
        const st = new THREE.Mesh(new THREE.TorusGeometry(r * .8, .014, 6, 40), mStripe); st.position.z = sd * (w / 2 + .002); wg.add(st);
        for (let k = 0; k < 5; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(r * 1.05, .03, .012), mAcc); sp.rotation.z = k * Math.PI / 5; sp.position.z = sd * (w / 2 + .008); spin.add(sp); }
      }
      car.add(wg); wheels.push(spin);
      car.add(rod([x > 0 ? x - .25 : x + .25, .42, 0], [x, r, z * .8], .018, mCarbon));
      car.add(rod([x > 0 ? x - .1 : x + .1, .28, 0], [x, r * .9, z * .8], .018, mCarbon));
    };
    for (const sd of [-1, 1]) { wheel(-1.35, .36, .4, sd * .8); wheel(1.35, .33, .34, sd * .78); }
    car.userData.wheels = wheels;
    car.add(blobShadow());
    return car;
  }

  // shared drag-to-rotate (horizontal only, page scroll stays vertical)
  function dragYaw(canvas, st) {
    let down = false, x0 = 0, y0 = 0, moved = 0;
    canvas.addEventListener('pointerdown', e => { down = true; x0 = e.clientX; y0 = e.clientY; moved = 0; st.lastTouch = performance.now(); });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - x0; x0 = e.clientX; moved += Math.abs(dx) + Math.abs(e.clientY - y0) * .2;
      st.yawV = dx * .012; st.target += dx * .012; st.lastTouch = performance.now();
    });
    addEventListener('pointerup', e => {
      if (!down) return; down = false;
      if (moved < 6 && st.onTap) st.onTap(e);
    });
    addEventListener('pointercancel', () => { down = false; });
  }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(e, st, objs) {
    const r = st.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, st.camera);
    return ray.intersectObjects(objs, true)[0];
  }
  function lights(scene, key = 2.2, rim = '#ffb3a3') {
    scene.add(new THREE.HemisphereLight('#ffffff', '#330000', .7));
    const d = new THREE.DirectionalLight('#ffffff', key); d.position.set(4, 6, 5); scene.add(d);
    const r = new THREE.DirectionalLight(rim, 1.4); r.position.set(-5, 2, -4); scene.add(r);
  }

  /* =========================================================
     HERO
     ========================================================= */
  (() => {
    const canvas = document.getElementById('c-hero'); if (!canvas) return;
    const st = stage(canvas, { fov: 30 });
    const { scene, camera } = st;
    lights(scene);
    const car = buildCar({ body: '#f4f4f4', accent: '#D50A0A', dark: '#161616', stripe: '#FFD500', helmet: '#FFD500' });
    car.scale.setScalar(.92);
    const rig = new THREE.Group(); rig.add(car); scene.add(rig);

    // livery stripes on the white car
    const red = new THREE.MeshStandardMaterial({ color: '#D50A0A', roughness: .35, metalness: .2 });
    for (const sd of [-1, 1]) {
      const band = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .12), red); band.position.set(-.35, .44, sd * .714); band.rotation.y = sd < 0 ? Math.PI : 0; car.add(band);
      const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .2), new THREE.MeshStandardMaterial({ map: textTex('REKLAM', { w: 512, h: 96, bg: null, fg: '#D50A0A' }), transparent: true, roughness: .4 }));
      lbl.position.set(-.35, .3, sd * .715); lbl.rotation.y = sd < 0 ? Math.PI : 0; car.add(lbl);
    }

    // billboards: front = Turkish, back = Russian (tap flips)
    const BB = [
      { tr: '%50\nİNDİRİM', ru: 'скидка\n50%', say: 'yüzde elli indirim', bg: '#FFD500', fg: '#D50A0A' },
      { tr: '1 ALANA\n1 BEDAVA', ru: 'купи 1,\nвторой даром', say: 'bir alana bir bedava', bg: '#ffffff', fg: '#0F0F12' },
      { tr: 'SON GÜN!', ru: 'последний\nдень', say: 'son gün', bg: '#0F0F12', fg: '#FFD500' },
      { tr: 'KAMPANYA', ru: 'акция', say: 'kampanya', bg: '#0052F5', fg: '#ffffff' },
      { tr: 'FIRSAT!', ru: 'выгодное\nпредложение', say: 'fırsat', bg: '#00594F', fg: '#D7EA1A' },
      { tr: 'YENİ', ru: 'новинка', say: 'yeni', bg: '#FF7A00', fg: '#0F0F12' },
    ];
    const boards = [], hitList = [];
    BB.forEach((b, i) => {
      const grp = new THREE.Group();
      const geo = new THREE.PlaneGeometry(1.5, .75);
      const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: textTex(b.tr, { bg: b.bg, fg: b.fg, tape: true }), roughness: .5, side: THREE.FrontSide }));
      const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: textTex(b.ru, { bg: '#ffffff', fg: '#0F0F12', font: 'Manrope', weight: 800, skew: 0, border: b.bg }), roughness: .5, side: THREE.FrontSide }));
      back.rotation.y = Math.PI; back.position.z = -.004;
      const edge = new THREE.Mesh(new THREE.BoxGeometry(1.5, .75, .003), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .15 }));
      grp.add(front, back, edge);
      const a = (i / BB.length) * Math.PI * 2;
      grp.userData = { a, r: 3.1 + (i % 2) * .5, y: .9 + (i % 3) * .55, flip: 0, flipT: 0, spd: .9 + (i % 3) * .15, b, i };
      front.userData.board = grp; back.userData.board = grp;
      scene.add(grp); boards.push(grp); hitList.push(front, back);
    });

    // speed streaks
    const streakGeo = new THREE.BoxGeometry(1, .012, .012);
    const streakMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5 });
    const streaks = new THREE.InstancedMesh(streakGeo, streakMat, 46);
    const sd = [], M = new THREE.Matrix4();
    for (let i = 0; i < 46; i++) sd.push({ x: Math.random() * 16 - 8, y: Math.random() * 2.6, z: Math.random() * 6 - 3, l: .4 + Math.random() * 1.6, v: 6 + Math.random() * 10 });
    scene.add(streaks);

    st.target = -.55; st.yaw = -.55; st.yawV = 0; st.lastTouch = 0;
    dragYaw(canvas, st);
    st.onTap = e => {
      const hit = pickAt(e, st, hitList);
      if (!hit) { st.target += Math.PI / 2; return; }
      const b = hit.object.userData.board; b.userData.flip = b.userData.flip ? 0 : 1;
      R.speak && R.speak(b.userData.b.say);
      R.burst && R.burst(e.clientX, e.clientY, 22, 6);
    };

    st.onResize = (w, h) => {
      const a = w / h;
      const dist = a < .9 ? 10.2 : a < 1.4 ? 9.4 : 8.6;
      camera.position.set(0, 2.4, dist); camera.lookAt(0, .95, 0);
      st.rad = Math.max(.62, Math.min(1, a * .5));
    };
    st.onResize(st.w, st.h);

    let scrollK = 0;
    st.update = (dt, t) => {
      const idle = performance.now() - st.lastTouch > 2500;
      if (idle && !reduce) st.target += dt * .35;
      st.yaw += (st.target - st.yaw) * Math.min(1, dt * 4);
      const hero = canvas.closest('.hero'), hr = hero.getBoundingClientRect();
      scrollK += (Math.min(1, Math.max(0, -hr.top / hr.height)) - scrollK) * .15;
      rig.rotation.y = st.yaw;
      rig.position.set(scrollK * 5, Math.sin(t * 2.2) * .03, scrollK * 1.5);
      rig.rotation.z = Math.sin(t * 1.3) * .012 - scrollK * .05;
      car.userData.wheels.forEach(w => { w.rotation.z -= dt * (8 + scrollK * 40); });
      boards.forEach(b => {
        const u = b.userData, a = u.a + t * .18 * u.spd;
        b.position.set(Math.cos(a) * u.r * st.rad, u.y + Math.sin(t * 1.6 + u.i) * .15, Math.sin(a) * u.r * .75);
        b.lookAt(camera.position.x, b.position.y, camera.position.z);
        u.flipT += (u.flip - u.flipT) * Math.min(1, dt * 7);
        b.rotateY(u.flipT * Math.PI);
        b.rotateZ(Math.sin(t + u.i) * .06);
      });
      for (let i = 0; i < sd.length; i++) {
        const s = sd[i]; s.x -= s.v * dt * (1 + scrollK * 3); if (s.x < -9) { s.x = 9; s.y = Math.random() * 2.6; }
        M.makeScale(s.l, 1, 1); M.setPosition(s.x, s.y, s.z); streaks.setMatrixAt(i, M);
      }
      streaks.instanceMatrix.needsUpdate = true;
    };
  })();

  /* =========================================================
     LIVERY (decals fly onto the car)
     ========================================================= */
  (() => {
    const canvas = document.getElementById('c-livery'); if (!canvas) return;
    const st = stage(canvas, { fov: 30 });
    const { scene, camera } = st;
    lights(scene, 2.4, '#b8ffe9');
    const car = buildCar();
    scene.add(car);
    const L = R.LIVERY || [];

    const P = Math.PI;
    // slot: [x,y,z], [rx,ry,rz], [w,h], yaw to look at it
    const SLOTS = [
      { parts: [[[-.35, .37, .716], [0, 0, 0]], [[-.35, .37, -.716], [0, P, 0]]], size: [1.2, .27], yaw: 0 },
      { parts: [[[-1.35, .7, .016], [0, 0, 0]], [[-1.35, .7, -.016], [0, P, 0]]], size: [.95, .2], yaw: .15 },
      { parts: [[[-2.05, .74, .706], [0, 0, 0]], [[-2.05, .74, -.706], [0, P, 0]]], size: [.5, .2], yaw: .6 },
      { parts: [[[1.5, .47, 0], [-P / 2, 0, 0], -.19]], size: [.95, .34], yaw: -.35, up: true },
      { parts: [[[2.15, .122, 0], [-P / 2, 0, P / 2]]], size: [1.5, .36], yaw: -1.15, up: true },
      { parts: [[[.95, .36, .31], [0, 0, 0]], [[.95, .36, -.31], [0, P, 0]]], size: [.5, .14], yaw: -.25 },
      { parts: [[[-.35, .546, .5], [-P / 2, 0, 0]], [[-.35, .546, -.5], [-P / 2, 0, 0]]], size: [1.15, .3], yaw: .3, up: true },
      { parts: [[[-2.263, .98, 0], [0, -P / 2, 0]]], size: [1.2, .14], yaw: 2.1 },
    ];
    const decals = SLOTS.map((s, i) => {
      const d = (L[i] && L[i].d) || { t: 'REKLAM', bg: '#D7EA1A', fg: '#00362F' };
      const ratio = s.size[0] / s.size[1];
      const tex = textTex(d.t, { w: 512, h: Math.max(48, Math.round(512 / ratio)), bg: d.bg, fg: d.fg, radius: 10, pad: .8 });
      const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0, roughness: .35, metalness: .1, polygonOffset: true, polygonOffsetFactor: -2 });
      const meshes = s.parts.map(([pos, rot, tilt]) => {
        const holder = new THREE.Group(); holder.position.set(...pos); if (tilt) holder.rotation.z = tilt;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(...s.size), mat); m.rotation.set(...rot);
        m.userData.idx = i; holder.add(m); holder.scale.setScalar(.001); car.add(holder);
        return holder;
      });
      return { meshes, mat, on: false, t: 0, slot: s };
    });

    // sparks
    const SP = 70, spGeo = new THREE.BufferGeometry(), spPos = new Float32Array(SP * 3), spVel = [];
    spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
    const spMat = new THREE.PointsMaterial({ color: '#D7EA1A', size: .07, transparent: true, opacity: 0, depthWrite: false });
    const sparks = new THREE.Points(spGeo, spMat); car.add(sparks);
    let spLife = 0;
    function spark(at) {
      for (let i = 0; i < SP; i++) {
        spPos.set([at.x, at.y, at.z], i * 3);
        spVel[i] = new THREE.Vector3((Math.random() - .5) * 3, Math.random() * 2.5, (Math.random() - .5) * 3);
      }
      spGeo.attributes.position.needsUpdate = true; spLife = 1;
    }

    st.target = .35; st.yaw = .35; st.yawV = 0; st.lastTouch = 0; st.done = false;
    dragYaw(canvas, st);
    st.onTap = e => {
      const hit = pickAt(e, st, decals.flatMap(d => d.meshes));
      if (hit && hit.object.userData.idx != null) dispatchEvent(new CustomEvent('livery:pick', { detail: hit.object.userData.idx }));
      else st.target += P / 2;
    };
    let camUp = 0, camUpT = 0;
    addEventListener('livery:stick', e => {
      const d = decals[e.detail]; if (!d) return;
      d.on = true; d.t = 0; d.meshes.forEach(h => h.scale.setScalar(2.6));
      // turn the car so this decal faces the camera
      const cur = st.target, want = d.slot.yaw, k = Math.round((cur - want) / (2 * P));
      st.target = want + k * 2 * P; st.lastTouch = performance.now();
      camUpT = d.slot.up ? 1 : 0;
      spark(d.meshes[0].position);
    });
    addEventListener('livery:done', () => { st.done = true; });

    st.onResize = (w, h) => {
      const a = w / h;
      st.dist = a < 1.2 ? 9.6 : a < 1.7 ? 8.2 : 7.4;
    };
    st.onResize(st.w, st.h);

    st.update = (dt, t) => {
      const idle = performance.now() - st.lastTouch > 3500;
      if (idle && !reduce) st.target += dt * .25;
      st.yaw += (st.target - st.yaw) * Math.min(1, dt * 3.5);
      car.rotation.y = st.yaw;
      camUp += (camUpT - camUp) * Math.min(1, dt * 2);
      if (idle) camUpT *= .995;
      camera.position.set(0, 1.5 + camUp * 2.4, st.dist - camUp * 1.2); camera.lookAt(0, .45, 0);
      decals.forEach(d => {
        if (!d.on || d.t >= 1) return;
        d.t = Math.min(1, d.t + dt * 2.2);
        const e = 1 - Math.pow(1 - d.t, 3), bounce = 1 + Math.sin(d.t * P) * .25 * (1 - d.t);
        d.meshes.forEach(h => { h.scale.setScalar(2.6 - (2.6 - 1) * e * bounce); h.rotation.x = (1 - e) * .8; });
        d.mat.opacity = Math.min(1, d.t * 2.5);
      });
      if (spLife > 0) {
        spLife -= dt * 1.1; spMat.opacity = Math.max(0, spLife);
        for (let i = 0; i < SP; i++) { const v = spVel[i]; v.y -= dt * 5; spPos[i * 3] += v.x * dt; spPos[i * 3 + 1] += v.y * dt; spPos[i * 3 + 2] += v.z * dt; }
        spGeo.attributes.position.needsUpdate = true;
      }
      const spd = st.done ? 30 : 0;
      car.userData.wheels.forEach(w => { w.rotation.z -= dt * spd; });
      car.position.y = st.done ? Math.abs(Math.sin(t * 9)) * .03 : 0;
      car.position.x = st.done ? Math.sin(t * 18) * .012 : 0;
    };
  })();

  /* =========================================================
     RING · 3D carousel of real screenshots
     ========================================================= */
  (() => {
    const canvas = document.getElementById('c-ring'); if (!canvas) return;
    const st = stage(canvas, { fov: 34, env: false });
    const { scene, camera } = st;
    scene.add(new THREE.AmbientLight('#ffffff', 2.2));
    const PH = R.PHONES || [];
    const ring = new THREE.Group(); scene.add(ring);
    const N = PH.length, CW = 1.25, CH = 2.2, RAD = Math.max(3, N * (CW + .28) / (2 * Math.PI));
    const loader = new THREE.TextureLoader();
    const cards = [];
    PH.forEach(([f, cap], i) => {
      const grp = new THREE.Group();
      const frame = textTex(cap, { w: 300, h: 540, bg: '#ffffff', fg: '#0F0F12', font: 'Caveat', weight: 700, skew: 0, radius: 6, pad: .86 });
      // draw caption only at the bottom: redraw a polaroid canvas
      const c = document.createElement('canvas'); c.width = 300; c.height = 540;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 540);
      g.fillStyle = '#0F0F12'; g.font = '700 38px Caveat, cursive'; g.textAlign = 'center'; g.fillText(cap, 150, 510, 280);
      g.fillStyle = 'rgba(255,236,160,.85)'; g.save(); g.translate(150, 8); g.rotate(-.06); g.fillRect(-50, -10, 100, 26); g.restore();
      frame.image = c; frame.needsUpdate = true;
      const back = new THREE.Mesh(new THREE.PlaneGeometry(CW + .14, CH + .5), new THREE.MeshBasicMaterial({ map: frame, side: THREE.DoubleSide }));
      back.position.y = -.18;
      const shot = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshBasicMaterial({ color: '#dddddd' }));
      shot.position.z = .006;
      loader.load(`media/${f}.webp`, tex => {
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        const ia = tex.image.width / tex.image.height, pa = CW / CH;
        if (ia < pa) { tex.repeat.set(1, ia / pa); tex.offset.set(0, 1 - ia / pa); } else { tex.repeat.set(pa / ia, 1); tex.offset.set((1 - pa / ia) / 2, 0); }
        shot.material = new THREE.MeshBasicMaterial({ map: tex }); shot.userData = back.userData;
      });
      grp.add(back, shot);
      const a = (i / N) * Math.PI * 2;
      grp.position.set(Math.sin(a) * RAD, 0, Math.cos(a) * RAD);
      grp.rotation.y = a; grp.rotation.z = (i % 2 ? 1 : -1) * .04;
      back.userData = { src: `media/${f}.webp`, cap, grp };
      shot.userData = back.userData;
      ring.add(grp); cards.push({ grp, a, back, shot });
    });

    st.target = 0; st.yaw = 0; st.yawV = 0; st.lastTouch = 0;
    dragYaw(canvas, st);
    st.onTap = e => {
      const hit = pickAt(e, st, cards.flatMap(c => [c.back, c.shot]));
      if (hit && hit.object.userData.src) R.openLightbox && R.openLightbox(hit.object.userData.src, hit.object.userData.cap);
    };
    st.onResize = (w, h) => {
      const a = w / h;
      camera.position.set(0, 1.3, RAD + (a < 1 ? 7.2 : 5)); camera.lookAt(0, -.1, 0);
    };
    st.onResize(st.w, st.h);
    let lastSY = scrollY;
    st.update = (dt, t) => {
      const idle = performance.now() - st.lastTouch > 2000;
      const dy = scrollY - lastSY; lastSY = scrollY;
      if (!reduce) st.target += (idle ? dt * .18 : 0) + dy * .0015;
      st.yaw += (st.target - st.yaw) * Math.min(1, dt * 4);
      ring.rotation.y = -st.yaw;
      cards.forEach((c, i) => {
        const wa = c.a - st.yaw, front = Math.cos(wa);
        const s = 1 + Math.max(0, front) * .12;
        c.grp.scale.setScalar(s);
        c.grp.position.y = Math.sin(t * 1.2 + i) * .06 + Math.max(0, front) * .1;
      });
    };
  })();

  /* =========================================================
     FLAG · waving chequered flag
     ========================================================= */
  (() => {
    const canvas = document.getElementById('c-flag'); if (!canvas) return;
    const st = stage(canvas, { fov: 30 });
    const { scene, camera } = st;
    lights(scene, 2, '#ffd0c8');
    const c = document.createElement('canvas'); c.width = 512; c.height = 320;
    const g = c.getContext('2d'); const cs = 64;
    for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#f5f5f5'; g.fillRect(x * cs, y * cs, cs, cs); }
    g.fillStyle = '#D50A0A'; g.fillRect(0, 128, 512, 64);
    g.fillStyle = '#fff'; g.font = '900 44px Unbounded, Arial Black'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.setTransform(1, 0, -.18, 1, 30, 0); g.fillText('ALTERNA · A0 → C1', 256, 162); g.setTransform(1, 0, 0, 1, 0, 0);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const W = 4.2, H = 2.6, SX = 48, SY = 30;
    const geo = new THREE.PlaneGeometry(W, H, SX, SY); geo.translate(W / 2, 0, 0);
    const base = geo.attributes.position.array.slice();
    const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: .7 }));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 4.2, 12), new THREE.MeshStandardMaterial({ color: '#dddddd', metalness: .8, roughness: .25 }));
    pole.position.set(0, -.75, 0);
    const holder = new THREE.Group(); holder.add(flag, pole); scene.add(holder);
    holder.rotation.z = -.12; holder.rotation.y = -.25;
    st.onResize = (w, h) => {
      const a = w / h; holder.position.set(-W / 2, -.1, 0);
      camera.position.set(0, 0, a < 1.6 ? 12 : 9); camera.lookAt(0, 0, 0);
    };
    st.onResize(st.w, st.h);
    let amp = .25, ampT = .25;
    addEventListener('final:go', () => { amp = 1.1; ampT = .45; });
    canvas.addEventListener('pointerup', e => { amp = 1.2; R.burst && R.burst(e.clientX, e.clientY, 50, 9); });
    st.update = (dt, t) => {
      amp += (ampT - amp) * Math.min(1, dt * .9);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], k = x / W;
        p.setZ(i, (Math.sin(x * 2.2 - t * 5) * .28 + Math.sin(y * 1.8 + x - t * 3) * .1) * k * amp * (reduce ? .2 : 1));
        p.setY(i, y - k * k * .15 * amp);
      }
      p.needsUpdate = true; geo.computeVertexNormals();
    };
  })();

  /* ---------- single RAF for all stages ---------- */
  function loop() {
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    for (const s of stages) if (s.visible) { s.update && s.update(dt, t); s.renderer.render(s.scene, s.camera); }
    requestAnimationFrame(loop);
  }
  loop();
}

boot().catch(err => {
  console.warn('3D disabled:', err);
  root.classList.remove('has3d');
  dispatchEvent(new Event('three:fail'));
});
