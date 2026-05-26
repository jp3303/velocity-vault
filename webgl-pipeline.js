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
    let lastProjection = null;

    function visualLaneValue(data) {
      const state = data && data.raceState ? data.raceState : {};
      const visualLane = Number(state.visualLane);
      if (Number.isFinite(visualLane)) return visualLane;
      return Number(state.lane) || 0;
    }

    function laneToWorldX(lane) {
      return Number(lane) * 2.08;
    }

    function cameraProjection(data) {
      const laneX = laneToWorldX(visualLaneValue(data));
      const shake = data.raceState.cameraShake || 0;
      const curve = roadCurveValue(data);
      const jitter = shake > 0 ? (Math.random() - 0.5) * shake * 0.012 : 0;
      const phoneFrame = data.width <= 940 || data.height <= 540;
      let eye = phoneFrame ? [laneX * 0.08 - curve * 0.78 + jitter, 1.62, -15.8] : [laneX * 0.06 - curve * 0.9 + jitter, 2.1, -14.6];
      let target = phoneFrame ? [laneX * 0.015 + curve * 3.45, 1.24, 62] : [laneX * 0.015 + curve * 3.4, 1.96, 50];
      if (data.cameraMode === "hood") {
        eye = phoneFrame ? [laneX * 0.3 - curve * 0.56 + jitter, 1.18, -7.8] : [laneX * 0.34 - curve * 0.62 + jitter, 1.42, -7.4];
        target = phoneFrame ? [laneX * 0.08 + curve * 3.65, 1.02, 64] : [laneX * 0.1 + curve * 3.6, 1.38, 52];
      } else if (data.cameraMode === "cockpit") {
        eye = [laneX * 0.2 - curve * 0.5 + jitter, 1.58, -3.8];
        target = [laneX * 0.05 + curve * 3.8, 1.52, 56];
      }
      const view = lookAt(eye, target, [0, 1, 0]);
      const fov = phoneFrame && data.cameraMode !== "cockpit" ? 2.28 : data.cameraMode === "cockpit" ? 2.25 : 2.55;
      const proj = perspective(Math.PI / fov, data.width / Math.max(1, data.height), 0.1, 220);
      return {
        mvp: multiply(proj, view),
        width: data.width,
        height: data.height,
        raceDistance: data.raceState.distance,
        roadTurn: curve,
        roadOffset: data.raceState.roadOffset || 0,
        cameraMode: data.cameraMode
      };
    }

    function projectPoint(projection, x, y, z) {
      const m = projection.mvp;
      const clipX = m[0] * x + m[4] * y + m[8] * z + m[12];
      const clipY = m[1] * x + m[5] * y + m[9] * z + m[13];
      const clipW = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (!Number.isFinite(clipW) || clipW <= 0.02) return null;
      const ndcX = clipX / clipW;
      const ndcY = clipY / clipW;
      if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY)) return null;
      const screenY = (0.5 - ndcY * 0.5) * projection.height;
      const t = Math.max(0, Math.min(1.16, screenY / Math.max(1, projection.height)));
      return {
        x: (ndcX * 0.5 + 0.5) * projection.width,
        y: screenY,
        scale: Math.max(0.34, Math.min(1.24, 0.42 + t * 0.78)),
        clipW,
        z
      };
    }

    function screenYFromRoadDistance(data, distance) {
      return data.height * 0.68 - (distance - data.raceState.distance) * 0.11;
    }

    function zFromRoadScreenY(data, y) {
      const t = Math.max(0.32, Math.min(1.02, y / Math.max(1, data.height)));
      return 116 - t * 108;
    }

    function zFromRoadDistance(data, distance) {
      return zFromRoadScreenY(data, screenYFromRoadDistance(data, distance));
    }

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

    function animalGroup(x, z, species = "dog", side = 1) {
      const count = species === "birds" || species === "sheep" ? 3 : 2;
      for (let j = 0; j < count; j += 1) {
        const px = x + side * (j * 0.75 - 0.45);
        const pz = z + (j % 2) * 0.34;
        const large = species === "cow" || species === "horse" || species === "camel";
        const body = species === "cow" || species === "sheep" || species === "birds" ? [0.84, 0.84, 0.76, 1]
          : species === "deer" || species === "horse" || species === "dog" ? [0.48, 0.28, 0.16, 1]
            : species === "camel" ? [0.76, 0.52, 0.28, 1]
              : [0.25, 0.34, 0.2, 1];
        if (species === "birds") {
          box(px, 0.24, pz, 0.32, 0.12, 0.18, body);
          box(px + side * 0.18, 0.34, pz, 0.12, 0.12, 0.12, body);
          box(px - side * 0.08, 0.16, pz, 0.04, 0.24, 0.04, [0.08, 0.08, 0.06, 1]);
          box(px + side * 0.08, 0.16, pz, 0.04, 0.24, 0.04, [0.08, 0.08, 0.06, 1]);
        } else {
          box(px, large ? 0.42 : 0.3, pz, large ? 0.92 : 0.62, large ? 0.42 : 0.3, large ? 0.36 : 0.26, body);
          box(px + side * (large ? 0.52 : 0.36), large ? 0.54 : 0.4, pz - 0.04, large ? 0.24 : 0.18, large ? 0.26 : 0.2, large ? 0.22 : 0.16, body);
          box(px - side * 0.28, 0.12, pz + 0.14, 0.08, 0.24, 0.08, [0.06, 0.045, 0.035, 1]);
          box(px + side * 0.22, 0.12, pz + 0.14, 0.08, 0.24, 0.08, [0.06, 0.045, 0.035, 1]);
          if (species === "deer") {
            box(px + side * 0.6, 0.78, pz - 0.08, 0.05, 0.34, 0.05, [0.9, 0.76, 0.48, 1]);
            box(px + side * 0.42, 0.78, pz - 0.08, 0.05, 0.3, 0.05, [0.9, 0.76, 0.48, 1]);
          }
        }
      }
    }

    function livingCrowdLine(x, z, side, accent, accent2, kind = "crowd") {
      const rail = kind === "farm" ? [0.58, 0.42, 0.22, 1] : [0.76, 0.8, 0.76, 1];
      box(x, 0.25, z + 0.72, 3.1, 0.12, 0.14, rail);
      box(x, 0.42, z + 0.72, 0.1, 0.46, 0.16, rail);
      box(x - 1.25, 0.42, z + 0.72, 0.1, 0.46, 0.16, rail);
      box(x + 1.25, 0.42, z + 0.72, 0.1, 0.46, 0.16, rail);
      const count = kind === "stadium" ? 7 : 4;
      for (let j = 0; j < count; j += 1) {
        const px = x + (j - (count - 1) / 2) * 0.46;
        const pz = z + (j % 2) * 0.22;
        person(px, pz, j % 2 ? accent : accent2, kind === "stadium" ? 0.68 : 0.62);
      }
      if (kind === "stadium") box(x, 1.1, z + 1.16, 3.7, 1.2, 0.22, [0.08, 0.09, 0.08, 1]);
    }

    function cyclistPair(x, z, side, accent, accent2) {
      for (let j = 0; j < 2; j += 1) {
        const px = x + side * (j * 0.95 - 0.45);
        const paint = j % 2 ? accent : accent2;
        box(px - side * 0.22, 0.18, z, 0.24, 0.12, 0.08, [0.02, 0.025, 0.02, 1]);
        box(px + side * 0.22, 0.18, z, 0.24, 0.12, 0.08, [0.02, 0.025, 0.02, 1]);
        box(px, 0.34, z, 0.62, 0.08, 0.08, paint);
        person(px, z - 0.06, paint, 0.48);
      }
      box(x, 0.06, z + 0.48, 2.1, 0.04, 0.12, [0.78, 0.82, 0.78, 1]);
    }

    function serviceCrew(x, z, side, accent, accent2, heavy = false) {
      const body = heavy ? [0.74, 0.56, 0.14, 1] : accent;
      box(x, 0.34, z, heavy ? 1.4 : 1.0, 0.58, heavy ? 0.9 : 0.68, body);
      box(x + side * 0.34, 0.74, z - 0.05, 0.36, 0.42, 0.42, shade(body, 0.76));
      box(x - 0.34, 0.08, z + 0.38, 0.24, 0.1, 0.18, [0.02, 0.025, 0.02, 1]);
      box(x + 0.34, 0.08, z + 0.38, 0.24, 0.1, 0.18, [0.02, 0.025, 0.02, 1]);
      person(x + side * 1.05, z + 0.2, accent2, 0.6);
      person(x + side * 1.48, z + 0.42, accent, 0.58);
      box(x + side * 1.4, 0.28, z + 0.75, 1.4, 0.08, 0.12, [0.78, 0.82, 0.78, 1]);
    }

    function pastureLine(x, z, side, species, accent, accent2) {
      box(x, 0.32, z + 0.72, 4.2, 0.12, 0.12, [0.58, 0.42, 0.22, 1]);
      for (let j = -2; j <= 2; j += 1) box(x + j * 0.82, 0.42, z + 0.72, 0.08, 0.62, 0.1, [0.58, 0.42, 0.22, 1]);
      animalGroup(x - side * 0.8, z - 0.2, species, side);
      if (species === "sheep") animalGroup(x + side * 0.95, z + 0.35, "sheep", side);
      person(x + side * 1.9, z + 0.2, accent2, 0.58);
    }

    function waterEdgeLife(x, z, side, accent, accent2) {
      box(x, 0.08, z, 3.8, 0.12, 1.7, [0.1, 0.36, 0.42, 1]);
      box(x, 0.24, z + 0.84, 3.6, 0.12, 0.14, [0.52, 0.34, 0.16, 1]);
      for (let j = -1; j <= 1; j += 1) person(x + j * 0.56, z + 0.36, j % 2 ? accent : accent2, 0.58);
      animalGroup(x + side * 1.6, z - 0.2, "birds", side);
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

    function isAirType(type) {
      return ["airplane", "helicopter", "fighterjet", "bomber", "drone"].includes(type);
    }

    function groundContactPad(type, x, z, scale, paint) {
      const air = isAirType(type);
      const water = type === "boat";
      const wide = type === "semi" || type === "monster" || type === "tank" || type === "truck";
      const shadow = water ? [0.02, 0.18, 0.22, 1] : [0.006, 0.008, 0.007, 1];
      const dust = water ? [0.1, 0.5, 0.62, 1] : shade(paint, 0.24);
      const padW = (air ? 1.65 : wide ? 2.45 : 1.95) * scale;
      const padD = (air ? 2.1 : wide ? 3.2 : 2.75) * scale;
      box(x, 0.012 * scale, z, padW, 0.024 * scale, padD, shadow);
      box(x, 0.018 * scale, z + 0.42 * scale, padW * 0.72, 0.014 * scale, padD * 0.32, shade(shadow, 1.4));
      if (air || water) {
        box(x, 0.045 * scale, z + 0.88 * scale, padW * 0.58, 0.018 * scale, 0.36 * scale, dust);
        return;
      }
      const tireX = wide ? 0.86 : 0.64;
      const rearZ = wide ? 1.0 : 0.78;
      const frontZ = wide ? -0.95 : -0.82;
      box(x - tireX * scale, 0.044 * scale, z + rearZ * scale, 0.42 * scale, 0.03 * scale, 0.34 * scale, shadow);
      box(x + tireX * scale, 0.044 * scale, z + rearZ * scale, 0.42 * scale, 0.03 * scale, 0.34 * scale, shadow);
      box(x - tireX * scale, 0.044 * scale, z + frontZ * scale, 0.36 * scale, 0.03 * scale, 0.3 * scale, shadow);
      box(x + tireX * scale, 0.044 * scale, z + frontZ * scale, 0.36 * scale, 0.03 * scale, 0.3 * scale, shadow);
      box(x - tireX * 0.72 * scale, 0.038 * scale, z + (rearZ + 0.54) * scale, 0.13 * scale, 0.025 * scale, 0.9 * scale, shade(shadow, 1.25));
      box(x + tireX * 0.72 * scale, 0.038 * scale, z + (rearZ + 0.54) * scale, 0.13 * scale, 0.025 * scale, 0.9 * scale, shade(shadow, 1.25));
    }

    function wrapZ(index, spacing, offset, speed = 0.07) {
      const total = spacing * 22;
      let z = index * spacing - ((offset * speed * 2.35) % total);
      while (z < 0) z += total;
      return z + 8;
    }

    function roadCurveValue(data) {
      const state = data && data.raceState ? data.raceState : {};
      return Math.max(-1.34, Math.min(1.34, Number(state.roadTurn || state.roadCurve || 0)));
    }

    function roadWorldXFor(turn, offset, x, z) {
      const depth = Math.max(0, Math.min(1.12, Number(z) / 150));
      const sweep = turn * depth * depth * 8.4;
      const surfaceWave = Math.sin((Number(z) || 0) * 0.035 + (Number(offset) || 0) * 0.0028) * Math.abs(turn) * depth * 0.72;
      return x + sweep + surfaceWave;
    }

    function roadWorldX(data, x, z) {
      return roadWorldXFor(roadCurveValue(data), data.raceState.roadOffset || 0, x, z);
    }

    function addRoad(data) {
      const place = data.selectedRace.place;
      const theme = data.selectedRace.theme || ["#09100f", "#46d9ff", "#ffd166"];
      const accent = hexToRgba(theme[1], 1);
      const accent2 = hexToRgba(theme[2], 1);
      const turn = roadCurveValue(data);
      const phoneFrame = data.width <= 940 || data.height <= 540;
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
      let roadColor = roadColors[place] || [0.14, 0.16, 0.15, 1];
      let groundColor = groundColors[place] || [0.04, 0.08, 0.06, 1];
      let roadMark = [0.78, 0.82, 0.78, 1];
      let roadMarkDim = [0.48, 0.52, 0.5, 1];
      if (phoneFrame) {
        roadColor = shade(roadColor, place === "snow" ? 0.56 : 0.38);
        groundColor = shade(groundColor, 0.34);
        roadMark = [0.34, 0.37, 0.36, 1];
        roadMarkDim = [0.18, 0.2, 0.2, 1];
      }
      quad([-70, -0.05, 0], [70, -0.05, 0], [70, -0.05, 170], [-70, -0.05, 170], groundColor);
      quad([roadWorldX(data, -5.8, 0), 0, 0], [roadWorldX(data, 5.8, 0), 0, 0], [roadWorldX(data, 7.4, 170), 0, 170], [roadWorldX(data, -7.4, 170), 0, 170], roadColor);
      for (let segment = 0; segment < 12; segment += 1) {
        const z0 = segment * 14.2;
        const z1 = (segment + 1) * 14.2;
        const t0 = z0 / 170;
        const t1 = z1 / 170;
        const half0 = 5.8 + t0 * 1.6;
        const half1 = 5.8 + t1 * 1.6;
        const tone = phoneFrame ? (segment % 2 ? 0.82 : 0.92) : (segment % 2 ? 0.98 : 1.06);
        quad(
          [roadWorldX(data, -half0, z0), 0.006, z0],
          [roadWorldX(data, half0, z0), 0.006, z0],
          [roadWorldX(data, half1, z1), 0.006, z1],
          [roadWorldX(data, -half1, z1), 0.006, z1],
          shade(roadColor, tone)
        );
      }
      quad([roadWorldX(data, -8.7, 0), -0.02, 0], [roadWorldX(data, -5.9, 0), -0.02, 0], [roadWorldX(data, -7.7, 170), -0.02, 170], [roadWorldX(data, -10.2, 170), -0.02, 170], shade(groundColor, 0.72));
      quad([roadWorldX(data, 5.9, 0), -0.02, 0], [roadWorldX(data, 8.7, 0), -0.02, 0], [roadWorldX(data, 10.2, 170), -0.02, 170], [roadWorldX(data, 7.7, 170), -0.02, 170], shade(groundColor, 0.72));
      for (let i = 0; i < 42; i += 1) {
        const z = wrapZ(i, 4.1, data.raceState.roadOffset, 0.16);
        const x = ((i * 1.37) % 10.6) - 5.3;
        const patch = phoneFrame ? (i % 3 ? shade(roadColor, 0.72) : shade(roadColor, 0.98)) : (i % 3 ? shade(roadColor, 0.78) : shade(roadColor, 1.18));
        box(roadWorldX(data, x, z), 0.026, z, 0.38 + (i % 4) * 0.18, 0.014, 1.1 + (i % 5) * 0.28, patch);
      }
      for (let i = 0; i < 36; i += 1) {
        const z = wrapZ(i, 5.1, data.raceState.roadOffset, 0.16);
        const color = i % 2 ? roadMarkDim : shade(roadMarkDim, 0.72);
        box(roadWorldX(data, -6.25, z), 0.046, z, 0.16, 0.016, 1.05, color);
        box(roadWorldX(data, 6.25, z), 0.046, z, 0.16, 0.016, 1.05, color);
      }
      for (let i = 0; i < 34; i += 1) {
        const z = wrapZ(i, 5.6, data.raceState.roadOffset, 0.14);
        box(roadWorldX(data, -5.45, z), 0.04, z, 0.14, 0.018, 0.24, roadMark);
        box(roadWorldX(data, 5.45, z), 0.04, z, 0.14, 0.018, 0.24, roadMark);
      }
      for (let lane = -1; lane <= 1; lane += 1) {
        for (let i = 0; i < 24; i += 1) {
          const z = wrapZ(i, 7.2, data.raceState.roadOffset, 0.1);
          box(roadWorldX(data, lane * 2.08, z), 0.034, z, 0.1, 0.016, 1.55, [0.86, 0.9, 0.86, 1]);
        }
      }
      for (let i = 0; i < 28; i += 1) {
        const z = wrapZ(i, 6.5, data.raceState.roadOffset, 0.13);
        const side = i % 2 ? -1 : 1;
        barrierRun(roadWorldX(data, side * 8.4, z), z, i % 3 ? roadMark : roadMarkDim);
        box(roadWorldX(data, side * 6.55, z + 1.9), 0.08, z + 1.9, 0.45, 0.05, 1.0, i % 2 ? [0.85, 0.86, 0.82, 1] : [0.72, 0.08, 0.06, 1]);
        box(roadWorldX(data, side * 6.55, z - 1.9), 0.08, z - 1.9, 0.45, 0.05, 1.0, i % 2 ? [0.72, 0.08, 0.06, 1] : [0.85, 0.86, 0.82, 1]);
      }
      if (Math.abs(turn) > 0.22) {
        const side = turn > 0 ? 1 : -1;
        for (let i = 0; i < 12; i += 1) {
          const z = wrapZ(i, 9.2, data.raceState.roadOffset, 0.14);
          box(roadWorldX(data, side * 7.25, z), 0.75, z, 0.18, 1.0, 0.12, roadMarkDim);
          box(roadWorldX(data, side * 7.05, z - 0.18), 1.32, z - 0.18, 1.2, 0.34, 0.12, i % 2 ? accent : accent2);
          box(roadWorldX(data, side * 7.05, z - 0.34), 1.32, z - 0.34, 0.48, 0.08, 0.14, [0.9, 0.94, 0.88, 1]);
        }
      }
      if (place === "city" || place === "tokyo") {
        for (let i = 0; i < 10; i += 1) {
          const z = wrapZ(i, 18, data.raceState.roadOffset, 0.09);
          for (let stripe = -2; stripe <= 2; stripe += 1) {
            box(roadWorldX(data, stripe * 1.15, z), 0.034, z, 0.72, 0.018, 1.2, [0.85, 0.86, 0.82, 1]);
          }
        }
      }
      if (["city", "tokyo", "coast", "harbor", "rainforest"].includes(place)) {
        for (let i = 0; i < 22; i += 1) {
          const z = wrapZ(i, 7.8, data.raceState.roadOffset, 0.12);
          box(roadWorldX(data, Math.sin(i * 1.7) * 1.6, z), 0.032, z, 1.0 + (i % 4) * 0.42, 0.012, 0.16, i % 2 ? roadMarkDim : roadMark);
        }
      }
      if (["city", "tokyo", "europe", "freight"].includes(place)) {
        for (let i = 0; i < 8; i += 1) {
          const z = wrapZ(i, 22, data.raceState.roadOffset, 0.08);
          box(-6.8, 3.1, z, 0.22, 6.2, 0.22, [0.34, 0.36, 0.34, 1]);
          box(6.8, 3.1, z, 0.22, 6.2, 0.22, [0.34, 0.36, 0.34, 1]);
          box(0, 6.12, z, 13.8, 0.22, 0.3, [0.34, 0.36, 0.34, 1]);
          box(-2.8, 5.72, z - 0.18, 2.4, 0.3, 0.16, i % 2 ? accent : [0.08, 0.1, 0.1, 1]);
          box(2.8, 5.72, z - 0.18, 2.4, 0.3, 0.16, i % 2 ? [0.08, 0.1, 0.1, 1] : accent);
        }
      }
    }

    function addScenery(data) {
      const place = data.selectedRace.place;
      const theme = data.selectedRace.theme || ["#09100f", "#46d9ff", "#ffd166"];
      const accent = hexToRgba(theme[1], 1);
      const accent2 = hexToRgba(theme[2], 1);
      const offset = data.raceState.roadOffset;
      const phoneFrame = data.width <= 940 || data.height <= 540;
      const count = phoneFrame ? 12 : 18;
      for (let i = 0; i < count; i += 1) {
        const z = wrapZ(i, 12.6, offset, 0.038);
        const side = i % 2 ? -1 : 1;
        const x = roadWorldX(data, side * (phoneFrame ? 9.8 + (i % 4) * 2.2 : 11.2 + (i % 5) * 3.2), z);
        if (place === "city" || place === "tokyo") {
          const height = 5 + (i % 7) * 2.2;
          taperedBox(x, height / 2, z, 2.6 + (i % 3), 2.1 + (i % 2), height, 2.8, place === "tokyo" ? [0.08, 0.06, 0.16, 1] : [0.08, 0.1, 0.11, 1]);
          box(x, height * 0.55, z - 1.42, 1.7, 0.14, 0.08, i % 2 ? accent : accent2);
          box(x, height * 0.32, z - 1.45, 0.24, 0.1, 0.1, i % 2 ? accent2 : accent);
          box(x, height * 0.72, z - 1.45, 0.24, 0.1, 0.1, i % 2 ? accent : accent2);
          if (place === "tokyo" && i % 5 === 0) {
            box(side * 6.6, 3.1, z + 1.2, 0.2, 4.5, 0.18, accent2);
            box(side * 6.95, 3.1, z + 1.2, 0.2, 4.5, 0.18, accent);
          }
          if (i % 4 === 0) streetLight(side * 7.55, z + 1.1, place === "tokyo" ? accent2 : accent);
          if (i % 14 === 0) signPanel(x - side * 2.8, z + 1.5, place === "tokyo" ? accent2 : accent, [0.04, 0.05, 0.06, 1]);
          if (i % 9 === 0) spectatorCluster(side * 8.9, z + 2.4, accent, accent2);
          if (i % 13 === 0) animalGroup(side * 9.8, z + 2.9, "dog", side);
          if (i % 5 === 0) livingCrowdLine(roadWorldX(data, side * 9.6, z + 1.7), z + 1.7, side, accent, accent2, place === "tokyo" ? "stadium" : "crowd");
          if (i % 6 === 0) cyclistPair(roadWorldX(data, side * 8.25, z + 0.7), z + 0.7, side, accent, accent2);
        } else if (place === "farm") {
          box(x, 0.8, z, 2.2, 1.6, 2.4, i % 2 ? [0.5, 0.1, 0.08, 1] : [0.72, 0.66, 0.38, 1]);
          taperedBox(x, 1.95, z - 1.25, 2.45, 1.3, 0.6, 2.55, [0.44, 0.22, 0.12, 1]);
          box(side * 8.5, 0.35, z + 3, 0.12, 0.7, 4, [0.72, 0.56, 0.32, 1]);
          if (i % 4 === 0) roadsideTree(side * 10.8, z + 1.5, [0.12, 0.44, 0.14, 1]);
          if (i % 5 === 0) box(x + side * 3.4, 0.65, z - 1, 2.2, 1.3, 1.8, [0.86, 0.72, 0.34, 1]);
          if (i % 9 === 0) spectatorCluster(side * 9.4, z + 2, accent, accent2);
          if (i % 6 === 0) animalGroup(side * 11.6, z + 2.8, i % 12 === 0 ? "cow" : "sheep", side);
          if (i % 4 === 0) pastureLine(roadWorldX(data, side * 12.2, z + 2.8), z + 2.8, side, i % 8 === 0 ? "cow" : "sheep", accent, accent2);
          if (i % 7 === 0) serviceCrew(roadWorldX(data, side * 9.6, z - 1.2), z - 1.2, side, accent, accent2, true);
        } else if (place === "freight" || place === "interstate") {
          box(x, 0.9, z, 4.8, 1.8, 2.2, i % 2 ? [0.22, 0.25, 0.24, 1] : [0.68, 0.7, 0.72, 1]);
          box(x + side * 3.2, 1.4, z + 1.4, 1.1, 2.8, 1.1, [0.12, 0.14, 0.14, 1]);
          if (i % 14 === 0) signPanel(x - side * 4.1, z + 1.8, accent, [0.04, 0.07, 0.06, 1]);
          if (i % 7 === 0) box(side * 9.4, 0.9, z - 2.4, 3.6, 1.8, 1.9, [0.52, 0.08, 0.06, 1]);
          if (i % 8 === 0) streetLight(side * 7.7, z + 2.1, accent2);
          if (i % 5 === 0) serviceCrew(roadWorldX(data, side * 10.6, z + 1.4), z + 1.4, side, accent, accent2, i % 10 === 0);
          if (place === "interstate" && i % 6 === 0) livingCrowdLine(roadWorldX(data, side * 11.4, z - 1.2), z - 1.2, side, accent, accent2, "crowd");
        } else if (place === "desert" || place === "canyon") {
          lowMound(x, z, 4.2 + (i % 3) * 1.4, 1.2 + (i % 5) * 0.28, 3.3, place === "canyon" ? [0.55, 0.22, 0.12, 1] : [0.74, 0.48, 0.22, 1]);
          if (i % 6 === 0) lowMound(side * 18.5, z + 2.7, 7.5, 2.6, 5.2, place === "canyon" ? [0.64, 0.25, 0.13, 1] : [0.78, 0.5, 0.22, 1]);
          if (i % 16 === 0) box(side * 10.2, 0.6, z + 1.2, 2.2, 1.2, 1.2, [0.12, 0.08, 0.04, 1]);
          if (i % 11 === 0) animalGroup(side * 10.8, z + 2.4, place === "desert" ? "camel" : "deer", side);
          if (i % 9 === 0) livingCrowdLine(roadWorldX(data, side * 10.4, z + 1.8), z + 1.8, side, accent, accent2, "crowd");
        } else if (place === "rainforest") {
          taperedBox(x, 2.0, z, 0.7, 0.42, 4, 0.7, [0.12, 0.22, 0.12, 1]);
          taperedBox(x, 4.3, z, 3.6, 2.2, 1.8, 2.5, i % 2 ? [0.1, 0.42, 0.22, 1] : [0.18, 0.52, 0.18, 1]);
          if (i % 4 === 0) roadsideTree(side * 8.6, z + 1.8, [0.08, 0.38, 0.18, 1]);
          if (i % 11 === 0) spectatorCluster(side * 8.7, z + 1.4, accent, accent2);
          if (i % 9 === 0) animalGroup(side * 10.5, z + 2.4, "monkey", side);
          if (i % 7 === 0) livingCrowdLine(roadWorldX(data, side * 9.8, z + 1.2), z + 1.2, side, accent, accent2, "crowd");
        } else if (place === "snow" || place === "alpine" || place === "europe") {
          lowMound(x, z, 5.8 + (i % 4) * 1.3, 2.3 + (i % 5) * 0.5, 3.8, [0.74, 0.82, 0.84, 1]);
          if (i % 3 === 0) box(x + side * 2.5, 1.2, z + 2.2, 1.8, 2.4, 1.7, [0.08, 0.2, 0.16, 1]);
          if (i % 5 === 0) roadsideTree(side * 9.2, z + 1.5, [0.08, 0.24, 0.18, 1]);
          if (place === "europe" && i % 8 === 0) spectatorCluster(side * 8.8, z + 2.2, accent, accent2);
          if (i % 10 === 0) animalGroup(side * 10.4, z + 2.5, place === "europe" ? "sheep" : "deer", side);
          if (place === "europe" && i % 5 === 0) cyclistPair(roadWorldX(data, side * 8.4, z + 0.8), z + 0.8, side, accent, accent2);
          if (i % 6 === 0) livingCrowdLine(roadWorldX(data, side * 9.7, z + 1.8), z + 1.8, side, accent, accent2, place === "europe" ? "crowd" : "farm");
        } else if (place === "harbor" || place === "coast") {
          box(x, 0.22, z, 5.5, 0.25, 6.5, [0.04, 0.22, 0.28, 1]);
          box(x + side * 1.4, 0.9, z, 0.28, 1.8, 0.28, [0.58, 0.44, 0.26, 1]);
          if (i % 6 === 0) {
            box(side * 14.2, 2.1, z, 0.24, 4.2, 0.24, [0.72, 0.48, 0.2, 1]);
            box(side * 12.4, 4.0, z - 0.6, 3.8, 0.22, 0.24, [0.72, 0.48, 0.2, 1]);
            taperedBox(side * 15.4, 0.5, z + 1.8, 2.4, 1.5, 0.72, 3.2, accent2);
          }
          if (i % 4 === 0) roadsideTree(side * 10.4, z + 0.9, [0.18, 0.48, 0.2, 1], "palm");
          if (i % 5 === 0) taperedBox(x - side * 2.8, 0.65, z + 1.6, 2.2, 1.1, 0.55, 3.1, accent2);
          if (i % 9 === 0) spectatorCluster(side * 9.1, z + 2.8, accent, accent2);
          if (i % 10 === 0) animalGroup(side * 9.8, z + 2.2, "birds", side);
          if (i % 5 === 0) waterEdgeLife(roadWorldX(data, side * 10.8, z + 1.6), z + 1.6, side, accent, accent2);
          if (place === "coast" && i % 7 === 0) cyclistPair(roadWorldX(data, side * 8.3, z + 0.6), z + 0.6, side, accent, accent2);
        } else if (place === "airfield") {
          box(x, 1.1, z, 4.4, 2.2, 3.4, [0.18, 0.18, 0.16, 1]);
          taperedBox(x, 2.35, z - 1.8, 4.8, 2.4, 0.6, 3.6, [0.24, 0.24, 0.22, 1]);
          if (i % 6 === 0) box(side * 8.8, 0.35, z + 2, 1.8, 0.7, 2.6, accent);
          if (i % 8 === 0) streetLight(side * 7.6, z + 1.7, accent2);
          if (i % 5 === 0) serviceCrew(roadWorldX(data, side * 9.6, z + 1.4), z + 1.4, side, accent, accent2, false);
          if (i % 9 === 0) livingCrowdLine(roadWorldX(data, side * 10.8, z + 2.1), z + 2.1, side, accent, accent2, "crowd");
        } else if (place === "monsterpark" || place === "military" || place === "skybase" || place === "pursuit") {
          const baseColor = place === "military" ? [0.16, 0.2, 0.12, 1] : place === "monsterpark" ? [0.32, 0.17, 0.08, 1] : [0.12, 0.14, 0.16, 1];
          box(x, 0.78, z, 4.6, 1.55, 2.4, baseColor);
          if (place === "monsterpark" && i % 4 === 0) livingCrowdLine(roadWorldX(data, side * 9.8, z + 1.6), z + 1.6, side, accent, accent2, "stadium");
          if (place === "military" && i % 5 === 0) serviceCrew(roadWorldX(data, side * 10.2, z + 1.4), z + 1.4, side, accent, accent2, true);
          if (place === "skybase" && i % 5 === 0) serviceCrew(roadWorldX(data, side * 9.8, z + 1.4), z + 1.4, side, accent, accent2, false);
          if (place === "pursuit" && i % 6 === 0) livingCrowdLine(roadWorldX(data, side * 9.6, z + 1.8), z + 1.8, side, accent, accent2, "crowd");
        }
      }
    }

    function addVehicle(type, x, z, colorHex, scale = 1, police = false, damage = 0) {
      const paint = police ? [0.9, 0.92, 0.9, 1] : hexToRgba(colorHex, 1);
      const dark = [0.01, 0.015, 0.014, 1];
      const red = [1, 0.08, 0.12, 1];
      const blue = [0.1, 0.55, 1, 1];
      const glass = [0.52, 0.72, 0.78, 1];
      const chrome = [0.76, 0.82, 0.78, 1];
      groundContactPad(type, x, z, scale, paint);
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
      } else if (type === "airplane" || type === "fighterjet" || type === "bomber") {
        const bomber = type === "bomber";
        const fighter = type === "fighterjet";
        taperedBox(x, 0.7 * scale, z, (bomber ? 0.92 : fighter ? 0.58 : 0.68) * scale, 0.38 * scale, 0.45 * scale, (bomber ? 3.3 : 2.9) * scale, paint);
        box(x, 0.66 * scale, z, (bomber ? 3.2 : fighter ? 2.8 : 2.55) * scale, 0.13 * scale, 0.42 * scale, shade(paint, 0.88));
        if (fighter) {
          box(x - 0.52 * scale, 0.72 * scale, z + 1.1 * scale, 0.34 * scale, 0.08 * scale, 0.58 * scale, shade(paint, 0.72));
          box(x + 0.52 * scale, 0.72 * scale, z + 1.1 * scale, 0.34 * scale, 0.08 * scale, 0.58 * scale, shade(paint, 0.72));
        }
      } else if (type === "helicopter") {
        taperedBox(x, 0.95 * scale, z, 1.2 * scale, 0.78 * scale, 0.65 * scale, 1.45 * scale, paint);
        box(x, 1.45 * scale, z, 2.3 * scale, 0.08 * scale, 0.1 * scale, [0.9, 0.94, 0.94, 1]);
      } else if (type === "drone") {
        taperedBox(x, 0.72 * scale, z, 0.74 * scale, 0.3 * scale, 0.48 * scale, 0.74 * scale, paint);
        box(x - 0.72 * scale, 0.8 * scale, z - 0.62 * scale, 0.52 * scale, 0.04 * scale, 0.16 * scale, [0.9, 0.94, 0.94, 1]);
        box(x + 0.72 * scale, 0.8 * scale, z - 0.62 * scale, 0.52 * scale, 0.04 * scale, 0.16 * scale, [0.9, 0.94, 0.94, 1]);
        box(x - 0.72 * scale, 0.8 * scale, z + 0.62 * scale, 0.52 * scale, 0.04 * scale, 0.16 * scale, [0.9, 0.94, 0.94, 1]);
        box(x + 0.72 * scale, 0.8 * scale, z + 0.62 * scale, 0.52 * scale, 0.04 * scale, 0.16 * scale, [0.9, 0.94, 0.94, 1]);
      } else {
        taperedBox(x, 0.55 * scale, z, 1.46 * scale, 0.9 * scale, 0.55 * scale, 2.1 * scale, paint);
        taperedBox(x, 0.95 * scale, z - 0.25 * scale, 0.88 * scale, 0.55 * scale, 0.45 * scale, 0.82 * scale, dark);
        box(x, 0.78 * scale, z + 0.8 * scale, 0.7 * scale, 0.08 * scale, 0.08 * scale, [0.86, 0.93, 1, 1]);
      }
      const groundVehicle = !isAirType(type);
      if (groundVehicle) {
        box(x - 0.42 * scale, 0.54 * scale, z + 1.04 * scale, 0.28 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
        box(x + 0.42 * scale, 0.54 * scale, z + 1.04 * scale, 0.28 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
        box(x, 0.46 * scale, z + 1.08 * scale, 0.58 * scale, 0.06 * scale, 0.08 * scale, shade(dark, 1.5));
        box(x - 0.82 * scale, 0.66 * scale, z - 0.16 * scale, 0.08 * scale, 0.36 * scale, 0.72 * scale, shade(paint, 0.72));
        box(x + 0.82 * scale, 0.66 * scale, z - 0.16 * scale, 0.08 * scale, 0.36 * scale, 0.72 * scale, shade(paint, 0.84));
        box(x - 0.96 * scale, 0.88 * scale, z + 0.34 * scale, 0.18 * scale, 0.1 * scale, 0.2 * scale, shade(paint, 0.64));
        box(x + 0.96 * scale, 0.88 * scale, z + 0.34 * scale, 0.18 * scale, 0.1 * scale, 0.2 * scale, shade(paint, 0.72));
        box(x, 1.02 * scale, z + 0.38 * scale, 0.72 * scale, 0.08 * scale, 0.36 * scale, glass);
        box(x, 0.94 * scale, z - 0.66 * scale, 0.86 * scale, 0.08 * scale, 0.28 * scale, shade(glass, 0.6));
        box(x, 0.52 * scale, z - 1.22 * scale, 0.36 * scale, 0.055 * scale, 0.07 * scale, chrome);
        box(x, 0.42 * scale, z + 1.12 * scale, 0.78 * scale, 0.055 * scale, 0.08 * scale, dark);
        box(x - 0.46 * scale, 0.82 * scale, z - 0.22 * scale, 0.05 * scale, 0.52 * scale, 1.42 * scale, chrome);
        box(x + 0.46 * scale, 0.82 * scale, z - 0.22 * scale, 0.05 * scale, 0.52 * scale, 1.42 * scale, chrome);
        if (type === "f1" || type === "prototype" || type === "car") {
          box(x, 0.8 * scale, z - 1.16 * scale, 1.28 * scale, 0.1 * scale, 0.16 * scale, shade(paint, 0.65));
        }
        if (type === "semi" || type === "truck") {
          box(x, 1.25 * scale, z - 0.86 * scale, 1.55 * scale, 0.06 * scale, 0.12 * scale, chrome);
          box(x, 0.72 * scale, z - 1.84 * scale, 1.45 * scale, 0.08 * scale, 0.1 * scale, shade(paint, 1.18));
        }
        if (type === "policecar") {
          box(x - 0.2 * scale, 1.19 * scale, z - 0.18 * scale, 0.28 * scale, 0.08 * scale, 0.16 * scale, red);
          box(x + 0.2 * scale, 1.19 * scale, z - 0.18 * scale, 0.28 * scale, 0.08 * scale, 0.16 * scale, blue);
          box(x, 0.73 * scale, z - 1.0 * scale, 0.72 * scale, 0.055 * scale, 0.08 * scale, [0.94, 0.96, 0.96, 1]);
        }
      } else {
        box(x - 0.32 * scale, 0.78 * scale, z + 1.12 * scale, 0.18 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
        box(x + 0.32 * scale, 0.78 * scale, z + 1.12 * scale, 0.18 * scale, 0.08 * scale, 0.08 * scale, [1, 0.92, 0.62, 1]);
      }
      if (damage > 18) {
        const dent = [0.02, 0.022, 0.02, 1];
        box(x - 0.28 * scale, 1.04 * scale, z - 0.34 * scale, 0.48 * scale, 0.035 * scale, 0.16 * scale, dent);
        box(x + 0.34 * scale, 0.86 * scale, z + 0.18 * scale, 0.42 * scale, 0.035 * scale, 0.14 * scale, dent);
        if (damage > 52) box(x - 0.1 * scale, 0.72 * scale, z + 0.9 * scale, 0.36 * scale, 0.06 * scale, 0.1 * scale, [1, 0.18, 0.16, 1]);
        if (damage > 76) box(x + 0.18 * scale, 1.2 * scale, z - 0.86 * scale, 0.28 * scale, 0.08 * scale, 0.18 * scale, [0.05, 0.05, 0.045, 1]);
      }
      box(x - 0.64 * scale, 0.17 * scale, z + 0.72 * scale, 0.24 * scale, 0.34 * scale, 0.5 * scale, dark);
      box(x + 0.64 * scale, 0.17 * scale, z + 0.72 * scale, 0.24 * scale, 0.34 * scale, 0.5 * scale, dark);
      box(x - 0.64 * scale, 0.17 * scale, z - 0.72 * scale, 0.24 * scale, 0.34 * scale, 0.5 * scale, dark);
      box(x + 0.64 * scale, 0.17 * scale, z - 0.72 * scale, 0.24 * scale, 0.34 * scale, 0.5 * scale, dark);
      box(x - 0.64 * scale, 0.2 * scale, z + 0.72 * scale, 0.1 * scale, 0.055 * scale, 0.2 * scale, chrome);
      box(x + 0.64 * scale, 0.2 * scale, z + 0.72 * scale, 0.1 * scale, 0.055 * scale, 0.2 * scale, chrome);
      box(x - 0.64 * scale, 0.2 * scale, z - 0.72 * scale, 0.1 * scale, 0.055 * scale, 0.2 * scale, chrome);
      box(x + 0.64 * scale, 0.2 * scale, z - 0.72 * scale, 0.1 * scale, 0.055 * scale, 0.2 * scale, chrome);
      box(x - 0.32 * scale, 0.62 * scale, z - 1.15 * scale, 0.36 * scale, 0.08 * scale, 0.08 * scale, police ? blue : red);
      box(x + 0.32 * scale, 0.62 * scale, z - 1.15 * scale, 0.36 * scale, 0.08 * scale, 0.08 * scale, police ? red : red);
    }

    function addMovingObjects(data) {
      const defs = data.vehicleDefs || [];
      const getVehicle = (id) => defs.find((vehicle) => vehicle.id === id) || defs[0] || { type: "car", color: "#46d9ff" };
      const screenYFromRoadDistance = (distance) => data.height * 0.68 - (distance - data.raceState.distance) * 0.11;
      const distanceFromScreenY = (y) => {
        const clampedY = Math.max(data.height * 0.34, Math.min(data.height * 0.98, Number(y) || data.height * 0.34));
        return data.raceState.distance + (data.height * 0.68 - clampedY) / 0.11;
      };
      const zFromRoadDistance = (distance) => {
        const y = screenYFromRoadDistance(distance);
        const t = Math.max(0.32, Math.min(1.02, y / Math.max(1, data.height)));
        return 116 - t * 108;
      };
      const projectRoadObject = (object) => {
        const distance = Number.isFinite(Number(object.distance)) ? Number(object.distance) : distanceFromScreenY(object.y);
        const y = screenYFromRoadDistance(distance);
        if (y < data.height * 0.32 || y > data.height * 1.08) return null;
        return { distance, z: zFromRoadDistance(distance) };
      };
      data.raceState.opponents.forEach((opponent) => {
        const projected = projectRoadObject(opponent);
        if (!projected) return;
        const z = projected.z;
        if (z < 4 || z > 132) return;
        const vehicle = getVehicle(opponent.vehicleId);
        addVehicle(vehicle.type, roadWorldX(data, laneToWorldX(opponent.lane), z), z, opponent.color || vehicle.color, opponent.wrecked ? 0.9 : 0.95, false, opponent.damage || 0);
      });
      data.raceState.rivals.forEach((rival) => {
        const projected = projectRoadObject(rival);
        if (!projected) return;
        const z = projected.z;
        if (z < 4 || z > 132) return;
        addVehicle(rival.type || "car", roadWorldX(data, laneToWorldX(rival.lane), z), z, rival.color, rival.type === "semi" ? 1.08 : 0.9, false, rival.damage || 0);
      });
      data.raceState.police.forEach((unit) => {
        const projected = projectRoadObject(unit);
        if (!projected) return;
        const z = projected.z;
        if (z < 4 || z > 132) return;
        addVehicle("car", roadWorldX(data, laneToWorldX(unit.lane), z), z, "#f4fbf8", 0.98, true, unit.damage || 0);
      });
      data.raceState.coinsOnRoad.forEach((coin) => {
        const projected = projectRoadObject(coin);
        if (!projected) return;
        const z = projected.z;
        if (z < 4 || z > 132) return;
        box(roadWorldX(data, laneToWorldX(coin.lane), z), 0.52, z, 0.52, 0.72, 0.12, [1, 0.77, 0.26, 1]);
      });
      if (data.cameraMode === "chase") {
        addVehicle(data.selectedVehicle.type, roadWorldX(data, laneToWorldX(data.raceState.lane), 5.2), 5.2, data.selectedVehicle.color, data.selectedVehicle.type === "semi" ? 1.2 : 1.05, false, data.raceState.damage || 0);
      } else if (data.cameraMode === "hood") {
        const hoodX = roadWorldX(data, laneToWorldX(data.raceState.lane), 1.2);
        box(hoodX, 0.22, 1.2, 2.2, 0.28, 2.3, hexToRgba(data.selectedVehicle.color, 1));
        if ((data.raceState.damage || 0) > 25) box(hoodX - 0.5, 0.39, 1.68, 0.5, 0.04, 0.16, [0.02, 0.022, 0.02, 1]);
      }
    }

    function render(data) {
      vertices = [];
      const theme = data.selectedRace.theme || ["#09100f", "#46d9ff", "#ffd166"];
      const clear = hexToRgba(theme[0], 1);
      const phoneFrame = data.width <= 940 || data.height <= 540;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(clear[0] * 0.72, clear[1] * 0.72, clear[2] * 0.72, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      const projection = cameraProjection(data);
      const mvp = projection.mvp;
      lastProjection = {
        ...projection,
        data
      };

      addRoad(data);
      addScenery(data);

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

    function projectRoadPoint(lane, distance) {
      if (!lastProjection || !lastProjection.data) return null;
      const data = lastProjection.data;
      const z = zFromRoadDistance(data, Number(distance));
      return projectPoint(lastProjection, roadWorldXFor(lastProjection.roadTurn || 0, lastProjection.roadOffset || 0, laneToWorldX(lane), z), 0, z);
    }

    function projectWorldRoadPoint(lane, z) {
      if (!lastProjection) return null;
      return projectPoint(lastProjection, roadWorldXFor(lastProjection.roadTurn || 0, lastProjection.roadOffset || 0, laneToWorldX(lane), z), 0, z);
    }

    return {
      ready: true,
      render,
      resize,
      projectRoadPoint,
      projectWorldRoadPoint
    };
  }

  window.VelocityWebGLPipeline = VelocityWebGLPipeline;
}());
