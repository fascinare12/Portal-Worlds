/**
 * Murals: common words that have no place in a city street (mountain, sea,
 * sun, rain...) are painted on the walls as pictures. Each drawing fills a
 * 384 x 220 area; the word itself is added underneath by the city.
 */

type Draw = (g: CanvasRenderingContext2D) => void;

const INK = '#0a0818';

/** Fills and outlines the current path, the way a piece is filled then cut out with a dark line. */
function paint(g: CanvasRenderingContext2D, fill: string, width = 7): void {
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = width;
  g.lineJoin = g.lineCap = 'round';
  g.stroke();
}

export const MURALS: Record<string, Draw> = {
  // やま: two peaks, the taller one capped with snow.
  yama(g) {
    g.beginPath();
    g.moveTo(40, 200);
    g.lineTo(150, 60);
    g.lineTo(230, 200);
    g.closePath();
    paint(g, '#8cff6a');
    g.beginPath();
    g.moveTo(140, 200);
    g.lineTo(250, 28);
    g.lineTo(350, 200);
    g.closePath();
    paint(g, '#39e6ff');
    g.beginPath();
    g.moveTo(250, 28);
    g.lineTo(283, 84);
    g.lineTo(262, 72);
    g.lineTo(248, 92);
    g.lineTo(232, 70);
    g.lineTo(215, 82);
    g.closePath();
    paint(g, '#ffffff', 5);
  },
  // うみ: three rows of rolling waves.
  umi(g) {
    ['#39e6ff', '#2f9fe0', '#2a6fd0'].forEach((colour, row) => {
      g.beginPath();
      g.moveTo(20, 210);
      g.lineTo(20, 90 + row * 40);
      for (let x = 20; x < 364; x += 57) g.quadraticCurveTo(x + 14, 50 + row * 40, x + 57, 90 + row * 40);
      g.lineTo(364, 210);
      g.closePath();
      paint(g, colour);
    });
  },
  // たいよう: a sun with rays.
  taiyou(g) {
    g.strokeStyle = '#ffe14a';
    g.lineWidth = 14;
    g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(192 + Math.cos(a) * 72, 112 + Math.sin(a) * 72);
      g.lineTo(192 + Math.cos(a) * 100, 112 + Math.sin(a) * 100);
      g.stroke();
    }
    g.beginPath();
    g.arc(192, 112, 56, 0, 6.3);
    paint(g, '#ff7a3a');
  },
  // くも: a fat cloud.
  kumo(g) {
    g.beginPath();
    g.arc(130, 130, 46, 0, 6.3);
    g.arc(190, 100, 58, 0, 6.3);
    g.arc(258, 128, 48, 0, 6.3);
    g.rect(120, 130, 150, 46);
    paint(g, '#ffffff');
    g.fillStyle = '#ffffff';
    g.fillRect(124, 110, 142, 62);
  },
  // にじ: a rainbow.
  niji(g) {
    ['#ff4fa3', '#ff7a3a', '#ffe14a', '#8cff6a', '#39e6ff', '#c58bff'].forEach((colour, i) => {
      g.beginPath();
      g.arc(192, 205, 165 - i * 19, Math.PI, 0);
      g.strokeStyle = colour;
      g.lineWidth = 19;
      g.lineCap = 'butt';
      g.stroke();
    });
  },
  // あめ: a cloud with rain falling from it.
  ame(g) {
    g.strokeStyle = '#39e6ff';
    g.lineWidth = 10;
    g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(120 + i * 30, 135);
      g.lineTo(104 + i * 30, 198);
      g.stroke();
    }
    g.beginPath();
    g.arc(140, 80, 38, 0, 6.3);
    g.arc(192, 60, 46, 0, 6.3);
    g.arc(248, 80, 38, 0, 6.3);
    g.rect(132, 82, 124, 36);
    paint(g, '#c9c6e6');
    g.fillStyle = '#c9c6e6';
    g.fillRect(136, 66, 116, 48);
  },
  // ゆき: a snowflake.
  yuki(g) {
    g.strokeStyle = '#ffffff';
    g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(192, 112);
      g.lineTo(192 + c * 92, 112 + s * 92);
      g.stroke();
      g.lineWidth = 8;
      for (const side of [0.5, -0.5]) {
        g.beginPath();
        g.moveTo(192 + c * 56, 112 + s * 56);
        g.lineTo(192 + c * 56 + Math.cos(a + side) * 30, 112 + s * 56 + Math.sin(a + side) * 30);
        g.stroke();
      }
    }
  },
  // ひ: a flame.
  hi(g) {
    g.beginPath();
    g.moveTo(192, 20);
    g.bezierCurveTo(250, 80, 285, 120, 262, 172);
    g.bezierCurveTo(245, 212, 139, 212, 122, 172);
    g.bezierCurveTo(105, 132, 150, 110, 150, 70);
    g.bezierCurveTo(170, 90, 180, 60, 192, 20);
    paint(g, '#ff7a3a');
    g.beginPath();
    g.moveTo(194, 100);
    g.bezierCurveTo(225, 135, 238, 160, 220, 182);
    g.bezierCurveTo(205, 198, 180, 198, 166, 182);
    g.bezierCurveTo(150, 160, 185, 140, 194, 100);
    paint(g, '#ffe14a', 5);
  },
  // いえ: a small house with a door and a window.
  ie(g) {
    g.beginPath();
    g.rect(110, 100, 164, 104);
    paint(g, '#ffe9b0');
    g.beginPath();
    g.moveTo(86, 104);
    g.lineTo(192, 24);
    g.lineTo(298, 104);
    g.closePath();
    paint(g, '#ff4fa3');
    g.beginPath();
    g.rect(170, 140, 44, 64);
    paint(g, '#8a4a2a', 5);
    g.beginPath();
    g.rect(226, 124, 32, 30);
    paint(g, '#39e6ff', 5);
  },
  // ふね: a sailing boat on the water.
  fune(g) {
    g.beginPath();
    g.moveTo(196, 26);
    g.lineTo(196, 140);
    g.lineTo(290, 140);
    g.closePath();
    paint(g, '#ffffff');
    g.beginPath();
    g.moveTo(182, 50);
    g.lineTo(182, 140);
    g.lineTo(118, 140);
    g.closePath();
    paint(g, '#ffe14a');
    g.beginPath();
    g.moveTo(84, 150);
    g.lineTo(300, 150);
    g.lineTo(266, 196);
    g.lineTo(118, 196);
    g.closePath();
    paint(g, '#ff7a3a');
    g.strokeStyle = '#39e6ff';
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(40, 206);
    for (let x = 40; x < 344; x += 38) g.quadraticCurveTo(x + 10, 190, x + 38, 206);
    g.stroke();
  },
  // め: an eye.
  me(g) {
    g.beginPath();
    g.moveTo(52, 112);
    g.quadraticCurveTo(192, 6, 332, 112);
    g.quadraticCurveTo(192, 218, 52, 112);
    paint(g, '#ffffff');
    g.beginPath();
    g.arc(192, 112, 48, 0, 6.3);
    paint(g, '#39e6ff');
    g.beginPath();
    g.arc(192, 112, 22, 0, 6.3);
    g.fillStyle = INK;
    g.fill();
    g.beginPath();
    g.arc(206, 98, 9, 0, 6.3);
    g.fillStyle = '#ffffff';
    g.fill();
  },
  // て: an open hand.
  te(g) {
    g.beginPath();
    g.moveTo(140, 206);
    g.lineTo(134, 120);
    for (const [x, top] of [[146, 44], [176, 26], [206, 30], [234, 50]]) {
      g.lineTo(x - 12, top + 14);
      g.arc(x, top + 14, 12, Math.PI, 0);
      g.lineTo(x + 12, 110);
    }
    g.lineTo(250, 130);
    g.lineTo(282, 100);
    g.arc(290, 110, 13, -2.3, 0.9);
    g.lineTo(254, 180);
    g.lineTo(246, 206);
    g.closePath();
    paint(g, '#ffc6a0');
  },
  // うさぎ: a rabbit's head with long ears.
  usagi(g) {
    for (const x of [158, 226]) {
      g.beginPath();
      g.ellipse(x, 66, 19, 56, x < 192 ? -0.14 : 0.14, 0, 6.3);
      paint(g, '#ffffff');
      g.beginPath();
      g.ellipse(x, 70, 8, 36, x < 192 ? -0.14 : 0.14, 0, 6.3);
      g.fillStyle = '#ff9fc8';
      g.fill();
    }
    g.beginPath();
    g.ellipse(192, 150, 66, 56, 0, 0, 6.3);
    paint(g, '#ffffff');
    g.fillStyle = INK;
    for (const x of [168, 216]) {
      g.beginPath();
      g.arc(x, 140, 7, 0, 6.3);
      g.fill();
    }
    g.beginPath();
    g.arc(192, 160, 7, 0, 6.3);
    g.fillStyle = '#ff4fa3';
    g.fill();
  },
  // へび: a snake in loops, with a forked tongue.
  hebi(g) {
    g.beginPath();
    g.moveTo(52, 170);
    g.bezierCurveTo(52, 60, 132, 60, 132, 130);
    g.bezierCurveTo(132, 200, 212, 200, 212, 130);
    g.bezierCurveTo(212, 60, 292, 60, 300, 104);
    g.strokeStyle = INK;
    g.lineWidth = 40;
    g.lineCap = 'round';
    g.stroke();
    g.strokeStyle = '#8cff6a';
    g.lineWidth = 27;
    g.stroke();
    g.strokeStyle = '#ff4fa3';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(308, 112);
    g.lineTo(334, 130);
    g.lineTo(350, 122);
    g.moveTo(334, 130);
    g.lineTo(346, 144);
    g.stroke();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(296, 92, 5, 0, 6.3);
    g.fill();
  },
};
