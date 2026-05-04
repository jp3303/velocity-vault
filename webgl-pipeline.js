"use strict";

(function () {
  function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== "string") return [1, 1, 1, alpha];
    const clean = hex.replace("#", "");
    const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, alpha];
  }

  function shade(color, factor) {
    return [
      Math.max(0, Math.min(1, color[0] * factor)),
      Math.max(0, Math.min(1, color[1] * factor)),
      Math.max(0, Math.min(1, color[2] * factor)),
      color[3]
    ];
  }

  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ];
  }

  function normalize(v) {
    const length = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function lookAt(eye, center, up) {
    const z = normalize([eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]]);
    const x = normalize(cross(up, z));
    const y = cross(z, x);
    return [
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
    ];
  }

  function multiply(a, b) {
    const out = new Array(16).fill(0);
    for (let col = 0; col < 4; col += 1) {
      for (let row = 0; row < 4; row += 1) {
        out[col * 4 + row] =
          a[0 * 4 + row] * b[col * 4 + 0] +
          a[1 * 4 + row] * b[col * 4 + 1] +
          a[2 * 4 + row] * b[col * 4 + 2] +
          a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    return out;
  }

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "WebGL shader compile failed");
    }
    return shader;
  }

  function linkProgram(gl) {
    const vertex = compile(gl, gl.VERTEX_SHADER, `
      attribute vec3 aPosition;
      attribute vec4 aColor;
      uniform mat4 uMvp;
      varying vec4 vColor;
      void main() {
        gl_Position = uMvp * vec4(aPosition, 1.0);
        vColor = aColor;
      }
    `);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec4 vColor;
      void main() {
        gl_FragColor = vColor;
      }
    `);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "WebGL program link failed");
    }
    return program;
  }

  function VelocityWebGLPipeline(canvas) {
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      depth: true,
      powerPreference: "high-performance"
    });
    if (!gl) throw new Error("WebGL is not available in this browser");

    const program = linkProgram(gl);
    const buffer = gl.createBuffer();
    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aColor = gl.getAttribLocation(program, "aColor");
    const uMvp = gl.getUniformLocation(program, "uMvp");
    let vertices = [];

    function addVertex(point, color) {
      vertices.push(point[0], point[1], point[2], color[0], color[1], color[2], color[3]);
    }

    function tri(a, b, c, color) {
      addVertex(a, color);
      addVertex(b, color);
      addVertex(c, color);
    }

    function quad(a, b, c, d, color) {
      tri(a, b, c, color);
      tri(a, c, d, color);
    }

    function box(x, y, z, w, h, d, color) {
      const x0 = x - w / 2;
      const x1 = x + w / 2;
      const y0 = y - h / 2;
      const y1 = y + h / 2;
      const z0 = z - d / 2;
      const z1 = z + d / 2;
      quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], shade(color, 1.14));
      quad([x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], shade(color, 0.55));
      quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], shade(color, 0.76));
      quad([x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0], shade(color, 0.88));
      quad([x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [x1, y0, z1], shade(color, 1.02));
      quad([x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z0], shade(color, 0.64));
    }

    function taperedBox(x, y, z, bottomW, topW, h, d, color) {
      const y0 = y - h / 2;
      const y1 = y + h / 2;
      const z0 = z - d / 2;
      const z1 = z + d / 2;
      const b0 = x - bottomW / 2;
      const b1 = x + bottomW / 2;
      const t0 = x - topW / 2;
      const t1 = x + topW / 2;
      quad([t0, y1, z0], [t1, y1, z0], [t1, y1, z1], [t0, y1, z1], shade(color, 1.16));
      quad([b0, y0, z1], [b1, y0, z1], [b1, y0, z0], [b0, y0, z0], shade(color, 0.55));
      quad([b0, y0, z0], [t0, y1, z0], [t0, y1, z1], [b0, y0, z1], shade(color, 0.78));
      quad([b1, y0, z1], [t1, y1, z1], [t1, y1, z0], [b1, y0, z0], shade(color, 0.9));
      quad([b0, y0, z1], [t0, y1, z1], [t1, y1, z1], [b1, y0, z1], shade(color, 1.02));
      quad([b1, y0, z0], [t1, y1, z0], [t0, y1, z0], [b0, y0, z0], shade(color, 0.66));
    }

    function lowMound(x, z, w, h, d, color) {
      taperedBox(x, h * 0.3, z, w, w * 0.72, h * 0.6, d, shade(color, 0.82));
      taperedBox(x, h * 0.78, z - d * 0.05, w * 0.72, w * 0.42, h * 0.44, d * 0.76, color);
      taperedBox(x, h * 1.08, z - d * 0.1, w * 0.42, w * 0.18, h * 0.24, d * 0.48, shade(color, 1.18));
    }

    function signPanel(x, z, textColor, baseColor) {
      box(x, 2.15, z, 3.2, 1.25, 0.14, baseColor);
      box(x, 2.22, z - 0.08, 2.35, 0.14, 0.16, textColor);
      box(x - 0.9, 1.7, z + 0.05, 0.12, 1.0, 0.12, [0.42, 0.44, 0.4, 1]);
      box(x + 0.9, 1.7, z + 0.05, 0.12, 1.0, 0.12, [0.42, 0.44, 0.4, 1]);
    }

    function person(x, z, shirtColor, scale = 1) {
      box(x, 0.18 * scale, z, 0.12 * scale, 0.36 * scale, 0.08 * scale, [0.04, 0.045, 0.04, 1]);
      box(x, 0.62 * scale, z, 0.28 * scale, 0.52 * scale, 0.16 * scale, shirtColor);
      box(x, 1.02 * scale, z, 0.22 * scale, 0.22 * scale, 0.18 * scale, [0.72, 0.52, 0.38, 1]);
      box(x - 0.24 * scale, 0.68 * scale, z, 0.08 * scale, 0.42 * scale, 0.08 * scale, shade(shirtColor, 0.75));
      box(x + 0.24 * scale, 0.68 * scale, z, 0.08 * scale, 0.42 * scale, 0.08 * scale, shade(shirtColor, 0.75));
    }

    function spectatorCluster(x, z, accent, accent2) {
      for (let j = 0; j < 5; j += 1) {
        const row = Math.floor(j / 3);
        const px = x + (j % 3 - 1) * 0.55;
        const pz = z + row * 0.34;
        person(px, pz, j % 2 ? accent : accent2, 0.74);
      }
      box(x, 0.28, z + 0.85, 2.4, 0.14, 0.14, [0.78, 0.82, 0.78, 1]);
    }

    function streetLight(x, z, accent) {
      const side = x < 0 ? 1 : -1;
      box(x, 1.35, z, 0.1, 2.7, 0.1, [0.38, 0.42, 0.39, 1]);
      box(x + side * 0.55, 2.62, z, 1.1, 0.08, 0.08, [0.38, 0.42, 0.39, 1]);
      box(x + side * 1.05, 2.52, z, 0.34, 0.12, 0.32, accent);
      box(x + side * 1.05, 2.43, z, 0.6, 0.03, 0.56, shade(accent, 1.35));
    }

    function roadsideTree(x, z, color, kind = "tree") {
      box(x, 0.74, z, 0.22, 1.45, 0.22, [0.34, 0.2, 0.1, 1]);
      if (kind === "palm") {
        taperedBox(x - 0.45, 1.82, z, 1.6, 0.25, 0.22, 1.0, color);
        taperedBox(x + 0.45, 1.86, z, 1.6, 0.25, 0.22, 1.0, color);
        taperedBox(x, 2.02, z - 0.45, 1.4, 0.2, 0.2, 1.15, color);
      } else {
        taperedBox(x, 1.85, z, 1.8, 0.7, 1.3, 1.6, color);
        taperedBox(x + 0.35, 2.45, z - 0.1, 1.3, 0.45, 1.0, 1.25, shade(color, 1.18));
      }
    }

    function barrierRun(x, z, accent) {
      box(x, 0.58, z, 0.14, 0.75, 0.16, [0.62, 0.66, 0.62, 1]);
      box(x, 0.86, z, 0.16, 0.12, 3.2, [0.78, 0.82, 0.78, 1]);
      box(x, 0.68, z, 0.18, 0.08, 3.0, shade(accent, 0.9));
    }

    function wrapZ(index, spacing, offset, speed = 0.07) {
      const total = spacing * 22;
      let z = index * spacing - ((offset * speed) % total);
      while (z < 0) z += total;
      return z + 8;
    }

    function addRoad(data) {
      const place = data.selectedRace.place;
      const theme = data.selectedRace.theme || ["#09100f", "#46d9ff", "#ffd166"];
      const accent = hexToRgba(theme[1], 1);
      const roadColors = {
        snow: [0.34, 0.42, 0.41, 1],
        harbor: [0.12, 0.25, 0.3, 1],
        airfield: [0.24, 0.24, 0.22, 1],
        farm: [0.31, 0.25, 0.16, 1],
        desert: [0.42, 0.31, 0.18, 1],
        tokyo: [0.12, 0.11, 0.18, 1],
        rainforest: [0.12, 0.18, 0.14, 1],
        europe: [0.18, 0.24, 0.25, 1]
      };
      const groundColors = {
        coast: [0.05, 0.2, 0.2, 1],
        city: [0.06, 0.07, 0.08, 1],
        canyon: [0.28, 0.13, 0.08, 1],
        alpine: [0.05, 0.14, 0.12, 1],
        harbor: [0.03, 0.16, 0.2, 1],
        snow: [0.6, 0.68, 0.66, 1],
        airfield: [0.24, 0.18, 0.12, 1],
        freight: [0.2, 0.22, 0.13, 1],
        farm: [0.12, 0.28, 0.12, 1],
        tokyo: [0.04, 0.03, 0.08, 1],
        desert: [0.48, 0.32, 0.16, 1],
        rainforest: [0.03, 0.18, 0.1, 1],
        europe: [0.07, 0.18, 0.16, 1]
      };
      const roadColor = roadColors[place] || [0.14, 0.16, 0.15, 1];
      const groundColor = groundColors[place] || [0.04, 0.08, 0.06, 1];
      quad([-70, -0.05, 0], [70, -0.05, 0], [70, -0.05, 170], [-70, -0.05, 170], groundColor);
      quad([-5.8, 0, 0], [5.8, 0, 0], [7.4, 0, 170], [-7.4, 0, 170], roadColor);
      quad([-8.7, -0.02, 0], [-5.9, -0.02, 0], [-7.7, -0.02, 170], [-10.2, -0.02, 170], shade(groundColor, 0.72));
      quad([5.9, -0.02, 0], [8.7, -0.02, 0], [10.2, -0.02, 170], [7.7, -0.02, 170], shade(groundColor, 0.72));
      box(-6.25, 0.08, 84, 0.18, 0.05, 168, accent);
      box(6.25, 0.08, 84, 0.18, 0.05, 168, accent);
      for (let i = 0; i < 42; i += 1) {
        const z = wrapZ(i, 4.1, data.raceState.roadOffset, 0.16);
        const x = ((i * 1.37) % 10.6) - 5.3;
        const patch = i % 3 ? shade(roadColor, 0.78) : shade(roadColor, 1.18);
        box(x, 0.055, z, 0.38 + (i % 4) * 0.18, 0.025, 1.1 + (i % 5) * 0.28, patch);
      }
      for (let i = 0; i < 34; i += 1) {
        const z = wrapZ(i, 5.6, data.raceState.roadOffset, 0.14);
        box(-5.45, 0.09, z, 0.16, 0.06, 0.28, [0.94, 0.72, 0.34, 1]);
        box(5.45, 0.09, z, 0.16, 0.06, 0.28, [0.94, 0.72, 0.34, 1]);
      }
      for (let lane = -1; lane <= 1; lane += 1) {
        for (let i = 0; i < 24; i += 1) {
          const z = wrapZ(i, 7.2, data.raceState.roadOffset, 0.1);
          box(lane * 2.08, 0.07, z, 0.08, 0.05, 3.2, [0.86, 0.9, 0.86, 1]);
        }
      }
      for (let i = 0; i < 28; i += 1) {
        const z = wrapZ(i, 6.5, data.raceState.roadOffset, 0.13);
        const side = i % 2 ? -1 : 1;
        barrierRun(side * 8.4, z, i % 3 ? [0.78, 0.82, 0.78, 1] : accent);
        box(side * 6.55, 0.08, z + 1.9, 0.45, 0.05, 1.0, i % 2 ? [0.85, 0.86, 0.82, 1] : [0.72, 0.08, 0.06, 1]);
        box(side * 6.55, 0.08, z - 1.9, 0.45, 0.05, 1.0, i % 2 ? [0.72, 0.08, 0.06, 1] : [0.85, 0.86, 0.82, 1]);
      }
      if (place === "city" || place === "tokyo") {
        for (let i = 0; i < 10; i += 1) {
          const z = wrapZ(i, 18, data.raceState.roadOffset, 0.09);
          for (let stripe = -2; stripe <= 2; stripe += 1) {
            box(stripe * 1.15, 0.09, z, 0.72, 0.05, 1.2, [0.85, 0.86, 0.82, 1]);
          }
        }
      }
    }

    function addScenery(data) {
      const place = data.selectedRace.place;
      const theme = data.selectedRace.theme || ["#09100f", "#46d9ff", "#ffd166"];
      const accent = hexToRgba(theme[1], 1);
      const accent2 = hexToRgba(theme[2], 1);
      const offset = data.raceState.roadOffset;
      for (let i = 0; i < 30; i += 1) {
        const z = wrapZ(i, 8.4, offset, 0.045);
        const side = i % 2 ? -1 : 1;
        const x = side * (11 + (i % 5) * 3.4);
        if (place === "city" || place === "tokyo") {
          const height = 5 + (i % 7) * 2.2;
          taperedBox(x, height / 2, z, 2.6 + (i % 3), 2.1 + (i % 2), height, 2.8, place === "tokyo" ? [0.08, 0.06, 0.16, 1] : [0.08, 0.1, 0.11, 1]);
          box(x, height * 0.55, z - 1.42, 1.7, 0.14, 0.08, i % 2 ? accent : accent2);
          box(x, height * 0.32, z - 1.45, 0.24, 0.1, 0.1, i % 2 ? accent2 : accent);
          box(x, height * 0.72, z - 1.45, 0.24, 0.1, 0.1, i % 2 ? accent : accent2);
          if (i % 4 === 0) streetLight(side * 7.55, z + 1.1, place === "tokyo" ? accent2 : accent);
          if (i % 6 === 0) signPanel(x - side * 2.8, z + 1.5, place === "tokyo" ? accent2 : accent, [0.04, 0.05, 0.06, 1]);
          if (i % 8 === 0) spectatorCluster(side * 8.9, z + 2.4, accent, accent2);
        } else if (place === "farm") {
          box(x, 0.8, z, 2.2, 1.6, 2.4, i % 2 ? [0.5, 0.1, 0.08, 1] : [0.72, 0.66, 0.38, 1]);
          taperedBox(x, 1.95, z - 1.25, 2.45, 1.3, 0.6, 2.55, [0.44, 0.22, 0.12, 1]);
          box(side * 8.5, 0.35, z + 3, 0.12, 0.7, 4, [0.72, 0.56, 0.32, 1]);
          if (i % 4 === 0) roadsideTree(side * 10.8, z + 1.5, [0.12, 0.44, 0.14, 1]);
          if (i % 5 === 0) box(x + side * 3.4, 0.65, z - 1, 2.2, 1.3, 1.8, [0.86, 0.72, 0.34, 1]);
          if (i % 9 === 0) spectatorCluster(side * 9.4, z + 2, accent, accent2);
        } else if (place === "freight") {
          box(x, 0.9, z, 4.8, 1.8, 2.2, i % 2 ? [0.22, 0.25, 0.24, 1] : [0.68, 0.7, 0.72, 1]);
          box(x + side * 3.2, 1.4, z + 1.4, 1.1, 2.8, 1.1, [0.12, 0.14, 0.14, 1]);
          if (i % 4 === 0) signPanel(x - side * 4.1, z + 1.8, accent, [0.04, 0.07, 0.06, 1]);
          if (i % 7 === 0) box(side * 9.4, 0.9, z - 2.4, 3.6, 1.8, 1.9, [0.52, 0.08, 0.06, 1]);
          if (i % 8 === 0) streetLight(side * 7.7, z + 2.1, accent2);
        } else if (place === "desert" || place === "canyon") {
          lowMound(x, z, 4.2 + (i % 3) * 1.4, 1.2 + (i % 5) * 0.28, 3.3, place === "canyon" ? [0.55, 0.22, 0.12, 1] : [0.74, 0.48, 0.22, 1]);
          if (i % 6 === 0) lowMound(side * 18.5, z + 2.7, 7.5, 2.6, 5.2, place === "canyon" ? [0.64, 0.25, 0.13, 1] : [0.78, 0.5, 0.22, 1]);
          if (i % 10 === 0) signPanel(side * 10.2, z + 1.2, accent, [0.12, 0.08, 0.04, 1]);
        } else if (place === "rainforest") {
          taperedBox(x, 2.0, z, 0.7, 0.42, 4, 0.7, [0.12, 0.22, 0.12, 1]);
          taperedBox(x, 4.3, z, 3.6, 2.2, 1.8, 2.5, i % 2 ? [0.1, 0.42, 0.22, 1] : [0.18, 0.52, 0.18, 1]);
          if (i % 4 === 0) roadsideTree(side * 8.6, z + 1.8, [0.08, 0.38, 0.18, 1]);
          if (i % 11 === 0) spectatorCluster(side * 8.7, z + 1.4, accent, accent2);
        } else if (place === "snow" || place === "alpine" || place === "europe") {
          lowMound(x, z, 5.8 + (i % 4) * 1.3, 2.3 + (i % 5) * 0.5, 3.8, [0.74, 0.82, 0.84, 1]);
          if (i % 3 === 0) box(x + side * 2.5, 1.2, z + 2.2, 1.8, 2.4, 1.7, [0.08, 0.2, 0.16, 1]);
          if (i % 5 === 0) roadsideTree(side * 9.2, z + 1.5, [0.08, 0.24, 0.18, 1]);
          if (place === "europe" && i % 8 === 0) spectatorCluster(side * 8.8, z + 2.2, accent, accent2);
        } else if (place === "harbor" || place === "coast") {
          box(x, 0.22, z, 5.5, 0.25, 6.5, [0.04, 0.22, 0.28, 1]);
          box(x + side * 1.4, 0.9, z, 0.28, 1.8, 0.28, [0.58, 0.44, 0.26, 1]);
          if (i % 4 === 0) roadsideTree(side * 10.4, z + 0.9, [0.18, 0.48, 0.2, 1], "palm");
          if (i % 5 === 0) taperedBox(x - side * 2.8, 0.65, z + 1.6, 2.2, 1.1, 0.55, 3.1, accent2);
          if (i % 9 === 0) spectatorCluster(side * 9.1, z + 2.8, accent, accent2);
        } else if (place === "airfield") {
          box(x, 1.1, z, 4.4, 2.2, 3.4, [0.18, 0.18, 0.16, 1]);
          taperedBox(x, 2.35, z - 1.8, 4.8, 2.4, 0.6, 3.6, [0.24, 0.24, 0.22, 1]);
          if (i % 6 === 0) box(side * 8.8, 0.35, z + 2, 1.8, 0.7, 2.6, accent);
          if (i % 8 === 0) streetLight(side * 7.6, z + 1.7, accent2);
        }
      }
    }

    function addVehicle(type, x, z, colorHex, scale = 1, police = false) {
      const paint = police ? [0.9, 0.92, 0.9, 1] : hexToRgba(colorHex, 1);
      const dark = [0.01, 0.015, 0.014, 1];
      const red = [1, 0.08, 0.12, 1];
      const blue = [0.1, 0.55, 1, 1];
      if (type === "semi") {
        taperedBox(x, 0.8 * scale, z + 0.95 * scale, 1.75 * scale, 1.25 * scale, 1.2 * scale, 1.6 * scale, paint);
        taperedBox(x, 0.95 * scale, z - 1.25 * scale, 2.05 * scale, 1.78 * scale, 1.6 * scale, 3.2 * scale, shade(paint, 0.78));
        box(x, 1.14 * scale, z + 1.45 * scale, 0.95 * scale, 0.16 * scale, 0.08 * scale, [0.72, 0.86, 0.9, 1]);
      } else if (type === "tractor") {
        taperedBox(x, 0.7 * scale, z, 1.45 * scale, 0.95 * scale, 0.8 * scale, 1.55 * scale, paint);
        taperedBox(x, 1.25 * scale, z - 0.2 * scale, 1.0 * scale, 0.72 * scale, 0.9 * scale, 0.8 * scale, shade(paint, 0.9));
        box(x - 0.75 * scale, 0.45 * scale, z + 0.2 * scale, 0.35 * scale, 0.65 * scale, 0.75 * scale, dark);
        box(x + 0.75 * scale, 0.45 * scale, z + 0.2 * scale, 0.35 * scale, 0.65 * scale, 0.75 * scale, dark);
      } else if (type === "f1" || type === "prototype") {
        taperedBox(x, 0.36 * scale, z, 0.9 * scale, 0.36 * scale, 0.34 * scale, 2.5 * scale, paint);
        taperedBox(x, 0.54 * scale, z - 0.2 * scale, 0.58 * scale, 0.32 * scale, 0.32 * scale, 0.55 * scale, dark);
        box(x, 0.28 * scale, z + 1.0 * scale, 1.5 * scale, 0.12 * scale, 0.25 * scale, shade(paint, 0.7));
      } else if (type === "truck" || type === "monster" || type === "tank") {
        taperedBox(x, 0.75 * scale, z, 1.85 * scale, 1.35 * scale, type === "tank" ? 0.75 * scale : 1.0 * scale, 2.1 * scale, paint);
        taperedBox(x, 1.25 * scale, z - 0.25 * scale, 1.1 * scale, 0.78 * scale, 0.65 * scale, 0.9 * scale, shade(paint, 0.82));
        if (type === "tank") box(x, 1.55 * scale, z - 1.15 * scale, 0.22 * scale, 0.18 * scale, 1.8 * scale, shade(paint, 0.7));
      } else if (type === "boat" || type === "snowmobile") {
        taperedBox(x, 0.42 * scale, z, 1.45 * scale, 0.7 * scale, 0.36 * scale, 2.3 * scale, paint);
        taperedBox(x, 0.68 * scale, z - 0.25 * scale, 0.62 * scale, 0.35 * scale, 0.42 * scale, 0.75 * scale, dark);
      } else if (type === "airplane") {
        taperedBox(x, 0.7 * scale, z, 0.68 * scale, 0.38 * scale, 0.45 * scale, 2.9 * scale, paint);
        box(x, 0.66 * scale, z, 2.55 * scale, 0.13 * scale, 0.42 * scale, shade(paint, 0.88));
      } else if (type === "helicopter") {
        taperedBox(x, 0.95 * scale, z, 1.2 * scale, 0.78 * scale, 0.65 * scale, 1.45 * scale, paint);
        box(x, 1.45 * scale, z, 2.3 * scale, 0.08 * scale, 0.1 * scale, [0.9, 0.94, 0.94, 1]);
      } else {
        taperedBox(x, 0.55 * scale, z, 1.46 * scale, 0.9 * scale, 0.55 * scale, 2.1 * scale, paint);
        taperedBox(x, 0.95 * scale, z - 0.25 * scale, 0.88 * scale, 0.55 * scale, 0.45 * scale, 0.82 * scale, dark);
        box(x, 0.78 * scale, z + 0.8 * scale, 0.7 * scale, 0.08 * scale, 0.08 * scale, [0.86, 0.93, 1, 1]);
      }
      const groundVehicle = !["airplane", "helicopter"].includes(type);
      if (groundVehicle) {
        box(x - 0.42 * scale, 0.54 * scale, z + 1.04 * scale, 0.28 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
        box(x + 0.42 * scale, 0.54 * scale, z + 1.04 * scale, 0.28 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
        box(x, 0.46 * scale, z + 1.08 * scale, 0.58 * scale, 0.06 * scale, 0.08 * scale, shade(dark, 1.5));
        box(x - 0.82 * scale, 0.66 * scale, z - 0.16 * scale, 0.08 * scale, 0.36 * scale, 0.72 * scale, shade(paint, 0.72));
        box(x + 0.82 * scale, 0.66 * scale, z - 0.16 * scale, 0.08 * scale, 0.36 * scale, 0.72 * scale, shade(paint, 0.84));
        if (type === "f1" || type === "prototype" || type === "car") {
          box(x, 0.8 * scale, z - 1.16 * scale, 1.28 * scale, 0.1 * scale, 0.16 * scale, shade(paint, 0.65));
        }
      } else {
        box(x - 0.32 * scale, 0.78 * scale, z + 1.12 * scale, 0.18 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
        box(x + 0.32 * scale, 0.78 * scale, z + 1.12 * scale, 0.18 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
      }
      box(x - 0.64 * scale, 0.24 * scale, z + 0.72 * scale, 0.22 * scale, 0.32 * scale, 0.46 * scale, dark);
      box(x + 0.64 * scale, 0.24 * scale, z + 0.72 * scale, 0.22 * scale, 0.32 * scale, 0.46 * scale, dark);
      box(x - 0.64 * scale, 0.24 * scale, z - 0.72 * scale, 0.22 * scale, 0.32 * scale, 0.46 * scale, dark);
      box(x + 0.64 * scale, 0.24 * scale, z - 0.72 * scale, 0.22 * scale, 0.32 * scale, 0.46 * scale, dark);
      box(x - 0.32 * scale, 0.62 * scale, z - 1.15 * scale, 0.36 * scale, 0.08 * scale, 0.08 * scale, police ? blue : red);
      box(x + 0.32 * scale, 0.62 * scale, z - 1.15 * scale, 0.36 * scale, 0.08 * scale, 0.08 * scale, police ? red : red);
    }

    function addMovingObjects(data) {
      const defs = data.vehicleDefs || [];
      const getVehicle = (id) => defs.find((vehicle) => vehicle.id === id) || defs[0] || { type: "car", color: "#46d9ff" };
      const laneScale = 2.08;
      data.raceState.opponents.forEach((opponent) => {
        const delta = opponent.distance - data.raceState.distance;
        const z = 9 + delta * 0.08;
        if (z < 4 || z > 132) return;
        const vehicle = getVehicle(opponent.vehicleId);
        addVehicle(vehicle.type, opponent.lane * laneScale, z, opponent.color || vehicle.color, 0.95, false);
      });
      data.raceState.rivals.forEach((rival) => {
        const t = rival.y / Math.max(1, data.height);
        const z = 112 - t * 115;
        if (z < 4 || z > 132) return;
        addVehicle(rival.type || "car", rival.lane * laneScale, z, rival.color, rival.type === "semi" ? 1.08 : 0.9, false);
      });
      data.raceState.police.forEach((unit) => {
        const t = unit.y / Math.max(1, data.height);
        const z = 112 - t * 115;
        if (z < 4 || z > 132) return;
        addVehicle("car", unit.lane * laneScale, z, "#f4fbf8", 0.98, true);
      });
      data.raceState.coinsOnRoad.forEach((coin) => {
        const t = coin.y / Math.max(1, data.height);
        const z = 106 - t * 110;
        if (z < 4 || z > 132) return;
        box(coin.lane * laneScale, 0.52, z, 0.52, 0.72, 0.12, [1, 0.77, 0.26, 1]);
      });
      if (data.cameraMode === "chase") {
        addVehicle(data.selectedVehicle.type, data.raceState.lane * laneScale, 5.2, data.selectedVehicle.color, data.selectedVehicle.type === "semi" ? 1.2 : 1.05, false);
      } else if (data.cameraMode === "hood") {
        box(data.raceState.lane * laneScale, 0.22, 1.2, 2.2, 0.28, 2.3, hexToRgba(data.selectedVehicle.color, 1));
      }
    }

    function render(data) {
      vertices = [];
      const theme = data.selectedRace.theme || ["#09100f", "#46d9ff", "#ffd166"];
      const clear = hexToRgba(theme[0], 1);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(clear[0] * 0.72, clear[1] * 0.72, clear[2] * 0.72, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      const laneX = data.raceState.lane * 2.08;
      const shake = data.raceState.cameraShake || 0;
      const jitter = shake > 0 ? (Math.random() - 0.5) * shake * 0.012 : 0;
      let eye = [laneX * 0.65 + jitter, 3.2, -9.8];
      let target = [laneX * 0.22, 0.85, 18];
      if (data.cameraMode === "hood") {
        eye = [laneX * 0.42 + jitter, 2.1, -4.2];
        target = [laneX * 0.15, 0.75, 26];
      } else if (data.cameraMode === "cockpit") {
        eye = [laneX * 0.25 + jitter, 2.25, -2.1];
        target = [laneX * 0.08, 0.85, 32];
      }
      const view = lookAt(eye, target, [0, 1, 0]);
      const proj = perspective(Math.PI / (data.cameraMode === "cockpit" ? 2.25 : 2.55), data.width / Math.max(1, data.height), 0.1, 220);
      const mvp = multiply(proj, view);

      addRoad(data);
      addScenery(data);
      addMovingObjects(data);

      gl.useProgram(program);
      gl.uniformMatrix4fv(uMvp, false, new Float32Array(mvp));
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(aColor);
      gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 28, 12);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 7);
    }

    function resize(width, height) {
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    }

    return {
      ready: true,
      render,
      resize
    };
  }

  window.VelocityWebGLPipeline = VelocityWebGLPipeline;
}());
