import * as THREE from 'three';

export function createCoverTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 810;
  const ink = canvas.getContext('2d');
  const gold = '#f6d498';

  ink.lineJoin = 'round';
  ink.lineCap = 'round';

  function plate(path, fill, edge, width) {
    const shape = new Path2D(path);
    ink.fillStyle = fill;
    ink.fill(shape);
    ink.strokeStyle = edge;
    ink.lineWidth = width;
    ink.stroke(shape);
  }

  function disc(x, y, radius, fill) {
    ink.beginPath();
    ink.arc(x, y, radius, 0, Math.PI * 2);
    ink.fillStyle = fill;
    ink.fill();
  }

  const leather = ink.createLinearGradient(22, 26, 605, 800);
  leather.addColorStop(0, '#bc8869');
  leather.addColorStop(0.55, '#a46c51');
  leather.addColorStop(1, '#88523d');

  ink.beginPath();
  ink.roundRect(11, 11, 618, 788, 38);
  ink.fillStyle = leather;
  ink.fill();
  ink.strokeStyle = '#58341f';
  ink.lineWidth = 20;
  ink.stroke();
  plate('M 53 22 Q 22 23 22 66 L 22 742 Q 22 783 58 787 L 101 787 L 99 23 Z',
    '#81503c', '#683c28', 5);

  ink.strokeStyle = '#ebbb8180';
  ink.lineWidth = 3;
  ink.beginPath();
  ink.roundRect(116, 33, 487, 744, 21);
  ink.stroke();

  // Herrajes dibujados en la textura para conservar el acabado ilustrado.
  const brass = ink.createLinearGradient(0, 0, 0, 810);
  brass.addColorStop(0, '#f7d394');
  brass.addColorStop(0.5, '#e7a958');
  brass.addColorStop(1, '#bc773e');
  for (const y of [17, 793]) {
    ink.save();
    ink.translate(0, y);
    if (y > 17) ink.scale(1, -1);
    plate('M 463 1 L 587 1 Q 621 1 623 39 L 623 139 Q 602 141 584 123 Q 567 107 565 83 Q 561 59 530 57 Q 490 62 463 21 Z',
      brass, '#754520', 10);
    disc(590, 29, 10, '#ffdf9e');
    ink.restore();
  }

  for (const y of [165, 590]) {
    plate(`M 20 ${y + 33} Q 48 ${y - 10} 91 ${y - 3} Q 105 ${y + 1} 102 ${y + 23} Q 52 ${y + 25} 24 ${y + 67} Z`,
      brass, '#70411f', 7);
  }

  plate('M 622 337 L 573 342 Q 559 343 545 362 L 521 399 Q 516 410 530 419 L 562 446 Q 573 453 591 448 L 624 439 Z',
    brass, '#734321', 9);
  disc(571, 394, 18, '#804921');
  disc(571, 394, 8, '#fbe0a4');

  const seal = ink.createRadialGradient(333, 391, 45, 333, 391, 166);
  seal.addColorStop(0, '#e2c78e');
  seal.addColorStop(0.72, '#b48368');
  seal.addColorStop(1, '#9a624a');
  disc(333, 391, 169, '#d59b6b');
  disc(333, 391, 154, seal);
  disc(333, 391, 119, '#ae9188');
  for (const [index, color] of ['#ffe8ab', '#e9b9cc', '#f9d69c'].entries()) {
    ink.save();
    ink.translate(333, 391);
    ink.rotate(index * Math.PI * 2 / 3);
    ink.fillStyle = color;
    ink.fill(new Path2D('M -7 2 C -48 -28 -17 -82 27 -78 C 72 -73 106 -30 97 13 C 126 -51 73 -108 11 -107 C -57 -105 -83 -34 -49 10 C -34 29 -11 23 -7 2 Z'));
    ink.restore();
  }

  function moon(x, y, angle, full = false) {
    ink.save();
    ink.translate(x, y);
    ink.rotate(angle);
    if (full) {
      disc(0, 0, 25, gold);
    } else {
      ink.fillStyle = gold;
      ink.fill(new Path2D('M 9 -24 C -29 -29 -39 20 -3 26 C 4 27 10 26 15 23 C -8 19 -12 -13 9 -24 Z'));
    }
    ink.restore();
  }

  for (const [x, y, angle] of [[176, 202, 2.3], [245, 161, 2.8], [333, 148, 0], [421, 161, 0.35], [487, 202, 0.85],
    [176, 593, 3.9], [245, 629, 3.4], [333, 643, 0], [421, 629, -0.35], [487, 593, -0.95]]) {
    moon(x, y, angle, x === 333);
  }

  for (const [x, y] of [[170, 304], [473, 281], [162, 495], [484, 522], [222, 710], [445, 704]]) {
    ink.save();
    ink.translate(x, y);
    ink.fillStyle = gold;
    ink.fill(new Path2D('M 0 -15 Q 2 -3 12 0 Q 2 3 0 15 Q -2 3 -12 0 Q -2 -3 0 -15 Z'));
    ink.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
