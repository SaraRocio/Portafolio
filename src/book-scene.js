import * as THREE from 'three';
import { createCoverTexture } from './book-cover.js';

// Los tiempos parciales son fracciones de la duración total. Los ángulos están en grados.
export const opening = {
  duration: 3400,
  initialTilt: 12,
  initialScale: 0.83,
  coverStart: 0.08,
  coverEnd: 0.59,
  closedAngle: 0,
  openAngle: -180,
  firstPage: 0.24,
  pageStagger: 0.09,
  pageDuration: 0.46,
  pageCount: 4,
  pageCurl: 39,
  fanTilt: -30,
  easing: (t) => t * t * (3 - 2 * t),
};

const width = 5.12;
const height = 6.48;
const paperWidth = 4.94;
const paperHeight = 6.22;
const columns = 18;
const rows = 4;

function panel(width, height, depth, radius) {
  const x = width / 2;
  const y = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-x + radius, -y);
  shape.lineTo(x - radius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + radius);
  shape.lineTo(x, y - radius);
  shape.quadraticCurveTo(x, y, x - radius, y);
  shape.lineTo(-x + radius, y);
  shape.quadraticCurveTo(-x, y, -x, y - radius);
  shape.lineTo(-x, -y + radius);
  shape.quadraticCurveTo(-x, -y, -x + radius, -y);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function createBoard(parent, geometry, material, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(width / 2, 0, z);
  parent.add(mesh);
}

function createLeaf(parent, material, edgeMaterial) {
  const geometry = new THREE.PlaneGeometry(paperWidth, paperHeight, columns, rows);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  parent.add(mesh);

  const stride = columns + 1;
  const perimeter = [];
  for (let column = 0; column < columns; column++) perimeter.push(column);
  for (let row = 0; row < rows; row++) perimeter.push(row * stride + columns);
  for (let column = columns; column > 0; column--) perimeter.push(rows * stride + column);
  for (let row = rows; row > 0; row--) perimeter.push(row * stride);

  const edgeGeometry = new THREE.BufferGeometry();
  const outline = new THREE.BufferAttribute(new Float32Array(perimeter.length * 3), 3);
  edgeGeometry.setAttribute('position', outline);
  const edge = new THREE.LineLoop(edgeGeometry, edgeMaterial);
  edge.frustumCulled = false;
  parent.add(edge);

  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  position.setUsage(THREE.DynamicDrawUsage);
  outline.setUsage(THREE.DynamicDrawUsage);

  return function turn(progress, stackZ) {
    const angle = -Math.PI * progress;
    const curl = THREE.MathUtils.degToRad(opening.pageCurl) * Math.sin(Math.PI * progress);
    for (let i = 0; i < position.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i) - 0.5;
      const distance = paperWidth * u;
      const bend = angle - curl * u * (0.75 + v * 0.4);
      position.setXYZ(
        i,
        distance * Math.cos(bend),
        v * paperHeight + 0.12 * u * u * Math.sin(angle),
        stackZ - distance * Math.sin(bend),
      );
    }
    for (const [i, vertex] of perimeter.entries()) {
      outline.setXYZ(i, position.getX(vertex), position.getY(vertex), position.getZ(vertex));
    }
    geometry.computeVertexNormals();
    position.needsUpdate = true;
    outline.needsUpdate = true;
  };
}

export function createBookScene(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearAlpha(0);
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5.6, 5.6, 3.6, -3.6, 0.1, 50);
  camera.position.z = 14;
  const book = new THREE.Group();
  scene.add(book);
  scene.add(new THREE.HemisphereLight('#fff4d9', '#965d42', 1.8));
  const lamp = new THREE.DirectionalLight('#ffe4b3', 1.55);
  lamp.position.set(-3, 6, 8);
  scene.add(lamp);

  const cover = new THREE.Group();
  book.add(cover);
  const coverGeometry = panel(width, height, 0.17, 0.31);
  const leather = new THREE.MeshStandardMaterial({ color: '#74442f', roughness: 0.91 });
  createBoard(book, coverGeometry, leather, -0.37);
  createBoard(cover, coverGeometry, leather, 0);

  const spine = new THREE.Mesh(panel(0.38, height - 0.04, 0.34, 0.16), leather);
  spine.position.set(0.04, 0, -0.26);
  book.add(spine);

  const paperGeometry = panel(paperWidth, paperHeight, 0.062, 0.17);
  const paperEdge = new THREE.MeshStandardMaterial({ color: '#c49460', roughness: 1 });
  const paperBase = new THREE.MeshStandardMaterial({ color: '#eed3a3', roughness: 1 });
  for (let sheet = 0; sheet < 6; sheet++) {
    createBoard(book, paperGeometry, sheet % 2 ? paperBase : paperEdge, -0.28 + sheet * 0.058);
  }
  createBoard(cover, paperGeometry, paperBase, -0.12);

  const bookmarkShape = new THREE.Shape();
  bookmarkShape.moveTo(0, 0);
  bookmarkShape.lineTo(0.46, 0);
  bookmarkShape.lineTo(0.47, -0.59);
  bookmarkShape.lineTo(0.24, -0.43);
  bookmarkShape.lineTo(0.03, -0.61);
  bookmarkShape.closePath();
  const bookmark = new THREE.Mesh(
    new THREE.ShapeGeometry(bookmarkShape),
    new THREE.MeshBasicMaterial({ color: '#ab88c5', side: THREE.DoubleSide }),
  );
  bookmark.position.set(1.28, -2.94, -0.18);
  bookmark.rotation.z = -0.14;
  book.add(bookmark);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: createCoverTexture(), alphaTest: 0.5 }),
  );
  front.position.set(width / 2, 0, 0.086);
  cover.add(front);

  const paper = new THREE.MeshStandardMaterial({
    color: '#fff0bd',
    side: THREE.DoubleSide,
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const edge = new THREE.LineBasicMaterial({ color: '#a46d49', transparent: true, opacity: 0.68 });
  const leaves = Array.from({ length: opening.pageCount }, () => createLeaf(book, paper, edge));

  function stage(progress, start, end) {
    const fraction = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
    return opening.easing(fraction);
  }

  function draw(progress) {
    const lift = stage(progress, opening.coverStart, opening.coverEnd);
    const fan = stage(progress, 0.1, 0.55) * (1 - stage(progress, 0.7, 1));
    cover.rotation.y = THREE.MathUtils.degToRad(
      THREE.MathUtils.lerp(opening.closedAngle, opening.openAngle, lift),
    );
    cover.position.z = THREE.MathUtils.lerp(0.26, -0.07, lift);

    leaves.forEach((turn, index) => {
      const start = opening.firstPage + index * opening.pageStagger;
      const turned = stage(progress, start, start + opening.pageDuration);
      const step = 0.016;
      const rightDepth = 0.046 + (leaves.length - 1 - index) * step;
      const leftDepth = 0.099 + index * step;
      turn(turned, THREE.MathUtils.lerp(rightDepth, leftDepth, turned));
    });

    const scale = THREE.MathUtils.lerp(opening.initialScale, 1, stage(progress, 0.48, 1)) - fan * 0.27;
    book.scale.setScalar(scale);
    book.rotation.set(
      THREE.MathUtils.degToRad(-16 * (1 - lift) + opening.fanTilt * fan),
      THREE.MathUtils.degToRad(-17 * (1 - lift) + 11 * fan),
      THREE.MathUtils.degToRad(opening.initialTilt * (1 - lift) - 18 * fan),
    );
    const offset = -width / 2 * scale * (1 - lift);
    book.position.set(offset * Math.cos(book.rotation.z), offset * Math.sin(book.rotation.z) - fan * 0.10, -0.16);
    renderer.render(scene, camera);
  }

  let progress = 0;
  function resize() {
    const { clientWidth, clientHeight } = host;
    if (!clientWidth || !clientHeight) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(clientWidth, clientHeight, false);
    draw(progress);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  return {
    draw(value) {
      progress = value;
      draw(progress);
    },
  };
}

