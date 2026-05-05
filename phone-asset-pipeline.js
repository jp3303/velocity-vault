"use strict";

(function () {
  const spriteCache = new Map();
  const textureCache = new Map();

  function makeCanvas(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function hexToRgb(hex) {
    if (!hex || typeof hex !== "string") return [70, 217, 255];
    const clean = hex.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const value = parseInt(full, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function shade(hex, amount) {
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${Math.max(0, Math.min(255, r + amount))}, ${Math.max(0, Math.min(255, g + amount))}, ${Math.max(0, Math.min(255, b + amount))})`;
  }

  function rgba(hex, alpha) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function pathVehicleBody(ctx, w, h, type) {
    const cx = w / 2;
    const top = h * 0.16;
    const bottom = h * 0.86;
    const narrow = type === "f1" || type === "prototype";
    const wide = type === "truck" || type === "monster" || type === "tank" || type === "semi";
    const upper = narrow ? w * 0.21 : wide ? w * 0.31 : w * 0.24;
    const shoulder = narrow ? w * 0.34 : wide ? w * 0.43 : w * 0.38;
    const lower = narrow ? w * 0.27 : wide ? w * 0.4 : w * 0.34;
    ctx.beginPath();
    ctx.moveTo(cx - upper, top);
    ctx.lineTo(cx + upper, top);
    ctx.quadraticCurveTo(cx + shoulder, h * 0.22, cx + shoulder, h * 0.42);
    ctx.lineTo(cx + lower, bottom);
    ctx.quadraticCurveTo(cx + lower * 0.72, h * 0.93, cx, h * 0.94);
    ctx.quadraticCurveTo(cx - lower * 0.72, h * 0.93, cx - lower, bottom);
    ctx.lineTo(cx - shoulder, h * 0.42);
    ctx.quadraticCurveTo(cx - shoulder, h * 0.22, cx - upper, top);
    ctx.closePath();
  }

  function drawWheel(ctx, x, y, rx, ry, accent) {
    ctx.save();
    ctx.fillStyle = "rgba(3,5,5,0.96)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(244,251,248,0.28)";
    ctx.lineWidth = Math.max(2, rx * 0.14);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, rx * 0.1);
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.62, y);
    ctx.lineTo(x + rx * 0.62, y);
    ctx.moveTo(x, y - ry * 0.62);
    ctx.lineTo(x, y + ry * 0.62);
    ctx.moveTo(x - rx * 0.42, y - ry * 0.42);
    ctx.lineTo(x + rx * 0.42, y + ry * 0.42);
    ctx.moveTo(x + rx * 0.42, y - ry * 0.42);
    ctx.lineTo(x - rx * 0.42, y + ry * 0.42);
    ctx.stroke();
    ctx.restore();
  }

  function drawPaintGrain(ctx, w, h, color) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 95; i += 1) {
      const x = (i * 37) % w;
      const y = (i * 61) % h;
      ctx.strokeStyle = i % 2 ? "rgba(255,255,255,0.28)" : rgba(color, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18 + (i % 5) * 4, y + 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDamage(ctx, w, h, damage) {
    if (!damage || damage < 12) return;
    ctx.save();
    const count = Math.min(9, Math.floor(damage / 12));
    ctx.strokeStyle = "rgba(3,5,5,0.72)";
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.lineCap = "round";
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 ? -1 : 1;
      const x = w * 0.5 + side * w * (0.08 + (i % 3) * 0.055);
      const y = h * (0.28 + (i % 5) * 0.1);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * w * 0.11, y + h * (0.02 + (i % 2) * 0.025));
      ctx.stroke();
    }
    if (damage > 58) {
      ctx.fillStyle = "rgba(255,91,107,0.46)";
      roundRect(ctx, w * 0.38, h * 0.18, w * 0.2, h * 0.045, 5);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBodyRealismDetails(ctx, w, h, type, color, police) {
    const paint = police ? "#f2f5f2" : color;
    ctx.save();
    pathVehicleBody(ctx, w, h, type === "semi" ? "truck" : type);
    ctx.clip();

    const sideShade = ctx.createLinearGradient(w * 0.12, 0, w * 0.88, 0);
    sideShade.addColorStop(0, "rgba(0,0,0,0.48)");
    sideShade.addColorStop(0.22, "rgba(255,255,255,0.08)");
    sideShade.addColorStop(0.5, "rgba(255,255,255,0.18)");
    sideShade.addColorStop(0.78, "rgba(255,255,255,0.06)");
    sideShade.addColorStop(1, "rgba(0,0,0,0.46)");
    ctx.fillStyle = sideShade;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.18);
    ctx.bezierCurveTo(w * 0.42, h * 0.34, w * 0.33, h * 0.56, w * 0.28, h * 0.82);
    ctx.moveTo(w * 0.64, h * 0.18);
    ctx.bezierCurveTo(w * 0.58, h * 0.34, w * 0.67, h * 0.56, w * 0.72, h * 0.82);
    ctx.stroke();

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = rgba(paint, 0.8);
    ctx.lineWidth = Math.max(1, w * 0.006);
    for (let i = 0; i < 18; i += 1) {
      const y = h * (0.18 + i * 0.038);
      ctx.beginPath();
      ctx.moveTo(w * 0.22, y);
      ctx.lineTo(w * 0.78, y + h * 0.012);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(3,5,5,0.68)";
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(w * 0.26, h * 0.34);
    ctx.lineTo(w * 0.2, h * 0.78);
    ctx.moveTo(w * 0.74, h * 0.34);
    ctx.lineTo(w * 0.8, h * 0.78);
    ctx.moveTo(w * 0.37, h * 0.7);
    ctx.lineTo(w * 0.63, h * 0.7);
    ctx.stroke();
    ctx.fillStyle = "rgba(2,4,4,0.88)";
    roundRect(ctx, w * 0.24, h * 0.17, w * 0.1, h * 0.04, 5);
    ctx.fill();
    roundRect(ctx, w * 0.66, h * 0.17, w * 0.1, h * 0.04, 5);
    ctx.fill();
    ctx.restore();
  }

  function drawAirWaterRealismDetails(ctx, w, h, type) {
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = Math.max(2, w * 0.01);
    if (type === "airplane") {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.12);
      ctx.lineTo(w * 0.5, h * 0.86);
      ctx.moveTo(w * 0.18, h * 0.52);
      ctx.lineTo(w * 0.82, h * 0.52);
      ctx.stroke();
    } else if (type === "helicopter") {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.18);
      ctx.lineTo(w * 0.5, h * 0.84);
      ctx.moveTo(w * 0.28, h * 0.38);
      ctx.lineTo(w * 0.72, h * 0.38);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.12);
      ctx.bezierCurveTo(w * 0.38, h * 0.38, w * 0.34, h * 0.66, w * 0.42, h * 0.86);
      ctx.moveTo(w * 0.5, h * 0.12);
      ctx.bezierCurveTo(w * 0.62, h * 0.38, w * 0.66, h * 0.66, w * 0.58, h * 0.86);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpriteContact(ctx, w, h, type) {
    const air = type === "airplane" || type === "helicopter";
    const water = type === "boat";
    const snow = type === "snowmobile";
    ctx.save();
    const baseY = h * (air ? 0.68 : water ? 0.78 : 0.84);
    const contact = ctx.createRadialGradient(w * 0.5, baseY - h * 0.03, w * 0.06, w * 0.5, baseY, w * 0.48);
    contact.addColorStop(0, air ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.62)");
    contact.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = contact;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, baseY, w * 0.42, h * (air ? 0.045 : 0.075), 0, 0, Math.PI * 2);
    ctx.fill();

    if (!air && !water) {
      ctx.fillStyle = snow ? "rgba(244,251,248,0.42)" : "rgba(3,5,5,0.82)";
      ctx.beginPath();
      ctx.ellipse(w * 0.29, h * 0.4, w * 0.09, h * 0.025, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.71, h * 0.4, w * 0.09, h * 0.025, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.29, h * 0.8, w * 0.11, h * 0.034, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.71, h * 0.8, w * 0.11, h * 0.034, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = water ? "rgba(70,217,255,0.48)" : snow ? "rgba(244,251,248,0.52)" : "rgba(3,5,5,0.5)";
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.3, baseY - h * 0.035);
    ctx.lineTo(w * 0.18, baseY + h * 0.075);
    ctx.moveTo(w * 0.7, baseY - h * 0.035);
    ctx.lineTo(w * 0.82, baseY + h * 0.075);
    ctx.stroke();
    ctx.restore();
  }

  function drawCarLike(ctx, w, h, type, color, police, damage) {
    const paint = police ? "#f2f5f2" : color;
    const accent = police ? "rgba(70,217,255,0.45)" : rgba(color, 0.45);
    const wide = type === "truck" || type === "monster" || type === "tank";
    const narrow = type === "f1" || type === "prototype";
    const semi = type === "semi";
    const tractor = type === "tractor";

    const wheelRX = w * (tractor ? 0.09 : narrow ? 0.075 : wide ? 0.095 : 0.078);
    const wheelRY = h * (tractor ? 0.13 : narrow ? 0.08 : wide ? 0.115 : 0.105);
    const wheelX = w * (wide ? 0.2 : 0.18);
    drawWheel(ctx, w * 0.5 - wheelX, h * 0.38, wheelRX, wheelRY, accent);
    drawWheel(ctx, w * 0.5 + wheelX, h * 0.38, wheelRX, wheelRY, accent);
    drawWheel(ctx, w * 0.5 - wheelX, h * 0.76, wheelRX, wheelRY, "rgba(255,209,102,0.34)");
    drawWheel(ctx, w * 0.5 + wheelX, h * 0.76, wheelRX, wheelRY, "rgba(255,209,102,0.34)");

    if (semi) {
      const trailer = ctx.createLinearGradient(w * 0.18, h * 0.36, w * 0.82, h * 0.88);
      trailer.addColorStop(0, shade(paint, 32));
      trailer.addColorStop(0.55, shade(paint, -12));
      trailer.addColorStop(1, shade(paint, -42));
      ctx.fillStyle = trailer;
      roundRect(ctx, w * 0.18, h * 0.36, w * 0.64, h * 0.5, 14);
      ctx.fill();
      ctx.fillStyle = "rgba(244,251,248,0.22)";
      for (let i = 0; i < 3; i += 1) {
        roundRect(ctx, w * 0.24, h * (0.46 + i * 0.11), w * 0.52, h * 0.025, 4);
        ctx.fill();
      }
    }

    const body = ctx.createLinearGradient(w * 0.18, h * 0.14, w * 0.82, h * 0.9);
    body.addColorStop(0, shade(paint, 52));
    body.addColorStop(0.3, paint);
    body.addColorStop(0.68, shade(paint, -26));
    body.addColorStop(1, shade(paint, -58));
    ctx.fillStyle = body;
    pathVehicleBody(ctx, w, h, semi ? "truck" : type);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = Math.max(2, w * 0.01);
    ctx.stroke();
    drawBodyRealismDetails(ctx, w, h, semi ? "semi" : type, color, police);

    if (type === "tank") {
      ctx.fillStyle = shade(paint, -30);
      roundRect(ctx, w * 0.35, h * 0.42, w * 0.3, h * 0.2, 8);
      ctx.fill();
      roundRect(ctx, w * 0.47, h * 0.12, w * 0.06, h * 0.35, 4);
      ctx.fill();
    }

    if (type === "f1" || type === "prototype") {
      ctx.fillStyle = shade(paint, -42);
      roundRect(ctx, w * 0.18, h * 0.8, w * 0.64, h * 0.05, 5);
      ctx.fill();
      ctx.fillStyle = "rgba(4,6,6,0.9)";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.42, w * 0.11, h * 0.085, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tractor) {
      ctx.fillStyle = shade(paint, -30);
      roundRect(ctx, w * 0.28, h * 0.48, w * 0.44, h * 0.26, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,209,102,0.55)";
      ctx.lineWidth = Math.max(3, w * 0.018);
      ctx.beginPath();
      ctx.moveTo(w * 0.27, h * 0.79);
      ctx.lineTo(w * 0.73, h * 0.79);
      ctx.stroke();
    }

    const glass = ctx.createLinearGradient(0, h * 0.18, 0, h * 0.58);
    glass.addColorStop(0, "rgba(222,249,255,0.78)");
    glass.addColorStop(0.38, "rgba(53,83,90,0.78)");
    glass.addColorStop(1, "rgba(3,6,7,0.96)");
    ctx.fillStyle = glass;
    roundRect(ctx, w * 0.32, h * 0.22, w * 0.36, h * 0.15, 10);
    ctx.fill();
    if (!narrow) {
      roundRect(ctx, w * 0.28, h * 0.46, w * 0.44, h * 0.2, 12);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(244,251,248,0.24)";
    ctx.lineWidth = Math.max(2, w * 0.008);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.17);
    ctx.lineTo(w * 0.5, h * 0.86);
    ctx.moveTo(w * 0.31, h * 0.43);
    ctx.lineTo(w * 0.69, h * 0.43);
    ctx.stroke();

    ctx.fillStyle = shade(paint, -48);
    roundRect(ctx, w * 0.18, h * 0.38, w * 0.085, h * 0.035, 5);
    ctx.fill();
    roundRect(ctx, w * 0.735, h * 0.38, w * 0.085, h * 0.035, 5);
    ctx.fill();

    ctx.fillStyle = "rgba(255,248,214,0.95)";
    roundRect(ctx, w * 0.32, h * 0.18, w * 0.12, h * 0.035, 5);
    ctx.fill();
    roundRect(ctx, w * 0.56, h * 0.18, w * 0.12, h * 0.035, 5);
    ctx.fill();
    ctx.fillStyle = police ? "#46d9ff" : "#ff3348";
    roundRect(ctx, w * 0.31, h * 0.78, w * 0.15, h * 0.038, 5);
    ctx.fill();
    ctx.fillStyle = "#ff3348";
    roundRect(ctx, w * 0.54, h * 0.78, w * 0.15, h * 0.038, 5);
    ctx.fill();

    if (police) {
      ctx.fillStyle = "rgba(5,8,7,0.86)";
      roundRect(ctx, w * 0.3, h * 0.42, w * 0.4, h * 0.045, 5);
      ctx.fill();
      ctx.fillStyle = "#f4fbf8";
      ctx.font = `900 ${Math.max(12, w * 0.055)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("POLICE", w * 0.5, h * 0.62);
      ctx.fillStyle = "#ff3348";
      roundRect(ctx, w * 0.4, h * 0.32, w * 0.08, h * 0.032, 4);
      ctx.fill();
      ctx.fillStyle = "#46d9ff";
      roundRect(ctx, w * 0.52, h * 0.32, w * 0.08, h * 0.032, 4);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(244,251,248,0.7)";
    roundRect(ctx, w * 0.42, h * 0.82, w * 0.16, h * 0.03, 5);
    ctx.fill();
    drawPaintGrain(ctx, w, h, paint);
    drawDamage(ctx, w, h, damage);
  }

  function drawAirOrWater(ctx, w, h, type, color, damage) {
    const paint = ctx.createLinearGradient(w * 0.26, h * 0.12, w * 0.74, h * 0.9);
    paint.addColorStop(0, shade(color, 48));
    paint.addColorStop(0.55, color);
    paint.addColorStop(1, shade(color, -44));
    ctx.fillStyle = paint;
    ctx.beginPath();
    if (type === "airplane") {
      ctx.moveTo(w * 0.5, h * 0.08);
      ctx.lineTo(w * 0.62, h * 0.86);
      ctx.lineTo(w * 0.5, h * 0.92);
      ctx.lineTo(w * 0.38, h * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.52);
      ctx.lineTo(w * 0.88, h * 0.52);
      ctx.lineTo(w * 0.62, h * 0.63);
      ctx.lineTo(w * 0.38, h * 0.63);
      ctx.closePath();
      ctx.fill();
    } else if (type === "helicopter") {
      roundRect(ctx, w * 0.3, h * 0.26, w * 0.4, h * 0.42, 24);
      ctx.fill();
      ctx.fillStyle = "rgba(244,251,248,0.72)";
      roundRect(ctx, w * 0.13, h * 0.13, w * 0.74, h * 0.035, 5);
      ctx.fill();
      ctx.fillStyle = shade(color, -34);
      roundRect(ctx, w * 0.47, h * 0.64, w * 0.06, h * 0.25, 5);
      ctx.fill();
    } else {
      ctx.moveTo(w * 0.5, h * 0.1);
      ctx.quadraticCurveTo(w * 0.82, h * 0.5, w * 0.62, h * 0.88);
      ctx.lineTo(w * 0.38, h * 0.88);
      ctx.quadraticCurveTo(w * 0.18, h * 0.5, w * 0.5, h * 0.1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(3,6,7,0.86)";
    roundRect(ctx, w * 0.39, h * 0.35, w * 0.22, h * 0.18, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255,248,214,0.86)";
    roundRect(ctx, w * 0.43, h * 0.18, w * 0.14, h * 0.035, 5);
    ctx.fill();
    drawAirWaterRealismDetails(ctx, w, h, type);
    drawPaintGrain(ctx, w, h, color);
    drawDamage(ctx, w, h, damage);
  }

  function drawRearWheel(ctx, x, groundY, rx, ry, accent, heavy = false) {
    ctx.save();
    const cy = groundY - ry;
    ctx.fillStyle = "rgba(2,4,4,0.98)";
    ctx.beginPath();
    ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(244,251,248,0.22)";
    ctx.lineWidth = Math.max(2, rx * 0.13);
    ctx.stroke();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, rx * 0.12);
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.62, cy + i * ry * 0.26);
      ctx.lineTo(x + rx * 0.62, cy + i * ry * 0.26);
      ctx.stroke();
    }
    ctx.globalAlpha = heavy ? 0.52 : 0.34;
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    ctx.beginPath();
    ctx.ellipse(x, groundY + ry * 0.08, rx * 1.12, ry * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRearGroundVehicle(ctx, w, h, type, color, police, damage) {
    const paint = police ? "#f2f5f2" : color;
    const accent = police ? "rgba(70,217,255,0.56)" : rgba(color, 0.58);
    const semi = type === "semi";
    const tractor = type === "tractor";
    const tank = type === "tank";
    const monster = type === "monster";
    const truck = type === "truck";
    const f1 = type === "f1" || type === "prototype";
    const snow = type === "snowmobile";
    const wide = semi || tractor || tank || monster || truck;
    const groundY = h * (snow ? 0.88 : 0.9);

    ctx.save();
    const contact = ctx.createRadialGradient(w * 0.5, groundY - h * 0.025, w * 0.07, w * 0.5, groundY, w * 0.55);
    contact.addColorStop(0, snow ? "rgba(244,251,248,0.42)" : "rgba(0,0,0,0.72)");
    contact.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = contact;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, groundY, w * (wide ? 0.52 : 0.44), h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    if (snow) {
      ctx.strokeStyle = "rgba(244,251,248,0.82)";
      ctx.lineWidth = Math.max(7, w * 0.036);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w * 0.26, groundY);
      ctx.lineTo(w * 0.43, groundY - h * 0.02);
      ctx.moveTo(w * 0.57, groundY - h * 0.02);
      ctx.lineTo(w * 0.74, groundY);
      ctx.stroke();
    } else if (tank) {
      ctx.fillStyle = "rgba(1,2,2,0.98)";
      roundRect(ctx, w * 0.11, h * 0.44, w * 0.22, groundY - h * 0.44, 14);
      ctx.fill();
      roundRect(ctx, w * 0.67, h * 0.44, w * 0.22, groundY - h * 0.44, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(244,251,248,0.16)";
      ctx.lineWidth = Math.max(2, w * 0.012);
      for (let i = 0; i < 7; i += 1) {
        const y = h * 0.49 + i * h * 0.052;
        ctx.beginPath();
        ctx.moveTo(w * 0.14, y);
        ctx.lineTo(w * 0.3, y);
        ctx.moveTo(w * 0.7, y);
        ctx.lineTo(w * 0.86, y);
        ctx.stroke();
      }
    } else {
      const rx = w * (monster ? 0.105 : semi || tractor ? 0.088 : f1 ? 0.074 : 0.082);
      const ry = h * (monster ? 0.155 : semi || tractor ? 0.14 : f1 ? 0.09 : 0.125);
      const left = w * (wide ? 0.2 : 0.24);
      const right = w - left;
      drawRearWheel(ctx, left, groundY, rx, ry, accent, wide);
      drawRearWheel(ctx, right, groundY, rx, ry, accent, wide);
      if (semi || tractor || truck) {
        drawRearWheel(ctx, left + w * 0.08, groundY - h * 0.01, rx * 0.78, ry * 0.8, "rgba(255,209,102,0.28)", true);
        drawRearWheel(ctx, right - w * 0.08, groundY - h * 0.01, rx * 0.78, ry * 0.8, "rgba(255,209,102,0.28)", true);
      }
    }

    const body = ctx.createLinearGradient(w * 0.18, h * 0.14, w * 0.82, groundY);
    body.addColorStop(0, shade(paint, 54));
    body.addColorStop(0.34, paint);
    body.addColorStop(0.7, shade(paint, -30));
    body.addColorStop(1, shade(paint, -62));
    ctx.fillStyle = body;

    if (f1) {
      ctx.fillStyle = shade(paint, -38);
      roundRect(ctx, w * 0.12, h * 0.73, w * 0.76, h * 0.075, 9);
      ctx.fill();
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.28);
      ctx.lineTo(w * 0.68, h * 0.5);
      ctx.lineTo(w * 0.61, h * 0.82);
      ctx.lineTo(w * 0.39, h * 0.82);
      ctx.lineTo(w * 0.32, h * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(4,6,6,0.92)";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.53, w * 0.12, h * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (semi) {
      roundRect(ctx, w * 0.19, h * 0.33, w * 0.62, h * 0.43, 18);
      ctx.fill();
      ctx.fillStyle = shade(paint, 18);
      roundRect(ctx, w * 0.24, h * 0.17, w * 0.52, h * 0.26, 16);
      ctx.fill();
      ctx.fillStyle = "rgba(4,7,8,0.9)";
      roundRect(ctx, w * 0.31, h * 0.22, w * 0.38, h * 0.12, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(244,251,248,0.28)";
      for (let i = 0; i < 3; i += 1) {
        roundRect(ctx, w * 0.27, h * (0.48 + i * 0.1), w * 0.46, h * 0.026, 4);
        ctx.fill();
      }
    } else if (tractor) {
      roundRect(ctx, w * 0.3, h * 0.25, w * 0.4, h * 0.24, 14);
      ctx.fill();
      ctx.fillStyle = shade(paint, -28);
      roundRect(ctx, w * 0.23, h * 0.48, w * 0.54, h * 0.26, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,209,102,0.58)";
      ctx.lineWidth = Math.max(4, w * 0.022);
      ctx.beginPath();
      ctx.moveTo(w * 0.23, h * 0.77);
      ctx.lineTo(w * 0.77, h * 0.77);
      ctx.stroke();
    } else if (tank) {
      roundRect(ctx, w * 0.24, h * 0.32, w * 0.52, h * 0.46, 9);
      ctx.fill();
      ctx.fillStyle = shade(paint, -34);
      roundRect(ctx, w * 0.34, h * 0.38, w * 0.32, h * 0.2, 8);
      ctx.fill();
      ctx.fillRect(w * 0.47, h * 0.18, w * 0.06, h * 0.26);
    } else {
      const topHalf = w * (truck || monster ? 0.24 : 0.2);
      const shoulder = w * (truck || monster ? 0.38 : 0.34);
      const lower = w * (truck || monster ? 0.43 : 0.37);
      const top = h * (snow ? 0.3 : 0.18);
      const belly = groundY - h * 0.055;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - topHalf, top);
      ctx.lineTo(w * 0.5 + topHalf, top);
      ctx.quadraticCurveTo(w * 0.5 + shoulder, h * 0.26, w * 0.5 + shoulder, h * 0.48);
      ctx.lineTo(w * 0.5 + lower, belly);
      ctx.quadraticCurveTo(w * 0.5 + lower * 0.7, groundY - h * 0.015, w * 0.5, groundY - h * 0.012);
      ctx.quadraticCurveTo(w * 0.5 - lower * 0.7, groundY - h * 0.015, w * 0.5 - lower, belly);
      ctx.lineTo(w * 0.5 - shoulder, h * 0.48);
      ctx.quadraticCurveTo(w * 0.5 - shoulder, h * 0.26, w * 0.5 - topHalf, top);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.stroke();

    ctx.fillStyle = "rgba(5,8,7,0.9)";
    roundRect(ctx, w * 0.31, h * (semi ? 0.46 : 0.32), w * 0.38, h * 0.13, 10);
    ctx.fill();
    if (!f1 && !semi && !tractor && !tank) {
      roundRect(ctx, w * 0.27, h * 0.55, w * 0.46, h * 0.19, 12);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(222,249,255,0.24)";
    roundRect(ctx, w * 0.34, h * (semi ? 0.49 : 0.35), w * 0.14, h * 0.026, 4);
    ctx.fill();
    roundRect(ctx, w * 0.52, h * (semi ? 0.49 : 0.35), w * 0.14, h * 0.026, 4);
    ctx.fill();

    if (police) {
      ctx.fillStyle = "rgba(5,8,7,0.88)";
      roundRect(ctx, w * 0.29, h * 0.53, w * 0.42, h * 0.052, 5);
      ctx.fill();
      ctx.fillStyle = "#f4fbf8";
      ctx.font = `900 ${Math.max(16, w * 0.07)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("POLICE", w * 0.5, h * 0.65);
      ctx.fillStyle = "#ff3348";
      roundRect(ctx, w * 0.4, h * 0.27, w * 0.08, h * 0.034, 4);
      ctx.fill();
      ctx.fillStyle = "#46d9ff";
      roundRect(ctx, w * 0.52, h * 0.27, w * 0.08, h * 0.034, 4);
      ctx.fill();
    }

    ctx.fillStyle = "#ff3348";
    roundRect(ctx, w * 0.28, groundY - h * 0.12, w * 0.17, h * 0.048, 5);
    ctx.fill();
    roundRect(ctx, w * 0.55, groundY - h * 0.12, w * 0.17, h * 0.048, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(244,251,248,0.68)";
    roundRect(ctx, w * 0.43, groundY - h * 0.085, w * 0.14, h * 0.028, 4);
    ctx.fill();

    ctx.strokeStyle = "rgba(5,8,7,0.46)";
    ctx.lineWidth = Math.max(2, w * 0.016);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.2);
    ctx.lineTo(w * 0.5, groundY - h * 0.08);
    ctx.stroke();

    drawPaintGrain(ctx, w, h, paint);
    drawDamage(ctx, w, h, damage);
    ctx.restore();
  }

  function getVehicleSprite(type = "car", color = "#46d9ff", options = {}) {
    const police = Boolean(options.police);
    const damage = Math.max(0, Math.min(100, Number(options.damage) || 0));
    const damageBucket = Math.floor(damage / 14);
    const key = `${type}|${color}|${police ? 1 : 0}|${damageBucket}`;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const canvas = makeCanvas(384, 552);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;

    if (["boat", "airplane", "helicopter"].includes(type)) {
      const shadow = ctx.createRadialGradient(192, 422, 26, 192, 422, 176);
      shadow.addColorStop(0, "rgba(0,0,0,0.52)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(192, 422, 168, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSpriteContact(ctx, 384, 552, type);
      drawAirOrWater(ctx, 384, 552, type, police ? "#f4fbf8" : color, damage);
    } else {
      drawRearGroundVehicle(ctx, 384, 552, type, color, police, damage);
    }

    spriteCache.set(key, canvas);
    return canvas;
  }

  function getRoadTexture(place = "city", theme = ["#09100f", "#46d9ff", "#ffd166"]) {
    const key = `${place}|${theme.join("|")}`;
    if (textureCache.has(key)) return textureCache.get(key);
    const canvas = makeCanvas(512, 512);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = place === "snow" ? "rgba(205,222,224,0.14)" : place === "desert" || place === "canyon" ? "rgba(156,92,42,0.13)" : "rgba(244,251,248,0.08)";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 420; i += 1) {
      const x = (i * 47) % 512;
      const y = (i * 83) % 512;
      const len = 8 + (i % 9) * 7;
      ctx.globalAlpha = 0.08 + (i % 5) * 0.018;
      ctx.strokeStyle = i % 3 ? "rgba(255,255,255,0.55)" : rgba(theme[1], 0.75);
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (i % 2 ? 2 : -2));
      ctx.stroke();
    }
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = place === "snow" ? "rgba(244,251,248,0.9)" : "rgba(0,0,0,0.85)";
    ctx.lineCap = "round";
    for (let i = 0; i < 54; i += 1) {
      const x = (i * 109) % 512;
      const y = (i * 67) % 512;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 24, y + 9, x - 18, y + 31, x + 38, y + 45);
      ctx.stroke();
    }
    ctx.globalAlpha = place === "tokyo" || place === "city" || place === "harbor" || place === "rainforest" ? 0.22 : 0.1;
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 131) % 512;
      const y = (i * 191) % 512;
      const glow = ctx.createRadialGradient(x, y, 4, x, y, 92);
      glow.addColorStop(0, rgba(theme[1], 0.9));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 96, y - 96, 192, 192);
    }
    ctx.globalAlpha = 1;
    textureCache.set(key, canvas);
    return canvas;
  }

  function isPhoneViewport() {
    return window.matchMedia && (window.matchMedia("(pointer: coarse)").matches || Math.min(window.innerWidth, window.innerHeight) < 720);
  }

  window.VelocityPhoneAssets = {
    getVehicleSprite,
    getRoadTexture,
    isPhoneViewport,
    ready: true
  };
})();
