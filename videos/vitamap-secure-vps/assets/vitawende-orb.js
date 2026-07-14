(function () {
  var TWO_PI = Math.PI * 2;
  var SEED_M = 3;
  var SEED_N1 = 34;
  var SEED_N2 = 72;
  var SEED_N3 = 72;
  var SEED_FACE_BULGE = 0.4;
  var SEED_RIDGE_OFFSET = Math.PI;
  var SEED_HALF_WIDTH = 1.54;
  var SEED_HEIGHT = 2.1;
  var SEED_VIEW_TILT = 1.0;
  var DOT_SPACING = 0.08;

  function map(value, start1, stop1, start2, stop2) {
    return start2 + ((stop2 - start2) * (value - start1)) / (stop1 - start1);
  }

  function supershape(theta, m, n1, n2, n3) {
    var t1 = Math.pow(Math.abs(Math.cos((m * theta) / 4)), n2);
    var t2 = Math.pow(Math.abs(Math.sin((m * theta) / 4)), n3);
    var value = Math.pow(t1 + t2, -1 / n1);
    return Number.isFinite(value) ? value : 0;
  }

  var seedExtrema = (function () {
    var max = 0;
    var min = Infinity;
    for (var i = 0; i < 2048; i += 1) {
      var theta = -Math.PI + (i / 2047) * TWO_PI;
      var r = supershape(theta, SEED_M, SEED_N1, SEED_N2, SEED_N3);
      if (r > max) max = r;
      if (r < min) min = r;
    }
    return { max: max, min: min };
  })();

  function smoothstep(edge0, edge1, value) {
    var x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
  }

  function seedCross(theta) {
    var sup = supershape(theta, SEED_M, SEED_N1, SEED_N2, SEED_N3);
    var faceness = (seedExtrema.max - sup) / (seedExtrema.max - seedExtrema.min);
    return (sup / seedExtrema.max) * (1 + SEED_FACE_BULGE * faceness);
  }

  function seedProfile(u) {
    var body = Math.pow(smoothstep(0, 0.7, u), 0.78);
    var shoulder = 1 - 0.45 * smoothstep(0.72, 1, u);
    var baseRound = 1 - Math.pow(smoothstep(0.9, 1, u), 1.6) * 0.9;
    return {
      scale: body * shoulder * baseRound,
      height: 0.92 - 1.58 * Math.pow(u, 1.04)
    };
  }

  function buildNodes(count, radius) {
    var nodes = [];
    for (var i = 0; i < count; i += 1) {
      var row = [];
      var theta = map(i, 0, count - 1, -Math.PI, Math.PI) + SEED_RIDGE_OFFSET;
      var ridge = seedCross(theta);
      for (var j = 0; j < count; j += 1) {
        var u = map(j, 0, count - 1, 0, 1);
        var profile = seedProfile(u);
        var crossRadius = radius * SEED_HALF_WIDTH * profile.scale * ridge;
        row.push({
          x: crossRadius * Math.cos(theta),
          y: -radius * SEED_HEIGHT * profile.height,
          z: crossRadius * Math.sin(theta)
        });
      }
      nodes.push(row);
    }
    return nodes;
  }

  function readCssVar(element, name, fallback) {
    var value = getComputedStyle(element).getPropertyValue(name).trim();
    return value || fallback;
  }

  function parseColor(input) {
    var match = input.match(/rgba?\(([^)]+)\)/i);
    if (!match) return [1, 1, 1, 1];
    var parts = match[1].split(",").map(function (part) {
      return parseFloat(part.trim());
    });
    return [
      (parts[0] == null ? 255 : parts[0]) / 255,
      (parts[1] == null ? 255 : parts[1]) / 255,
      (parts[2] == null ? 255 : parts[2]) / 255,
      parts[3] == null ? 1 : parts[3]
    ];
  }

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vsSource, fsSource) {
    var vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    var program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function getUniforms(gl, program, names) {
    var uniforms = {};
    names.forEach(function (name) {
      uniforms[name] = gl.getUniformLocation(program, name);
    });
    return uniforms;
  }

  var TRANSFORM_GLSL = [
    "float cy = cos(uRotY), sy = sin(uRotY), cx = cos(uRotX), sx = sin(uRotX);",
    "float x1 = aPos.x * cy - aPos.z * sy;",
    "float z1 = aPos.x * sy + aPos.z * cy;",
    "float y1 = aPos.y * cx - z1 * sx;",
    "float z2 = aPos.y * sx + z1 * cx;",
    "float scale = uPersp / (uPersp + z2);",
    "float depth = z2 / uRadius;",
    "float devX = uViewport.x * 0.5 + x1 * scale * uDpr;",
    "float devY = uViewport.y * 0.5 + y1 * scale * uDpr;",
    "gl_Position = vec4(devX / uViewport.x * 2.0 - 1.0, 1.0 - devY / uViewport.y * 2.0, 0.0, 1.0);"
  ].join("\n");

  var POINT_VS = [
    "attribute vec3 aPos;",
    "uniform float uRotX, uRotY, uRadius, uPersp, uDpr;",
    "uniform vec2 uViewport;",
    "varying float vFront;",
    "void main() {",
    TRANSFORM_GLSL,
    "vFront = clamp((depth + 1.4) / 2.8, 0.0, 1.0);",
    "gl_PointSize = max(1.0, (0.55 + vFront * 1.1) * scale * uDpr * 2.0);",
    "}"
  ].join("\n");

  var POINT_FS = [
    "precision mediump float;",
    "varying float vFront;",
    "uniform vec3 uLine;",
    "uniform float uLineA;",
    "uniform vec3 uSoft;",
    "uniform float uSoftA;",
    "void main() {",
    "float d = length(gl_PointCoord - 0.5) * 2.0;",
    "float mask = 1.0 - smoothstep(0.4, 1.0, d);",
    "if (mask <= 0.001) discard;",
    "float g = 0.11 + vFront * 0.46;",
    "float tone = smoothstep(0.1, 0.95, vFront);",
    "vec3 col = mix(uSoft, uLine, tone);",
    "float ca = mix(uSoftA, uLineA, tone);",
    "float a = ca * g * mask;",
    "gl_FragColor = vec4(col * a, a);",
    "}"
  ].join("\n");

  var SURFACE_VS = [
    "attribute vec3 aPos;",
    "uniform float uRotX, uRotY, uRadius, uPersp, uDpr;",
    "uniform vec2 uViewport;",
    "varying float vFront;",
    "void main() {",
    TRANSFORM_GLSL,
    "vFront = clamp((depth + 1.3) / 2.6, 0.0, 1.0);",
    "}"
  ].join("\n");

  var SURFACE_FS = [
    "precision mediump float;",
    "varying float vFront;",
    "uniform vec3 uSurf;",
    "uniform float uSurfA;",
    "void main() {",
    "float a = uSurfA * (0.08 + vFront * 0.2);",
    "gl_FragColor = vec4(uSurf * a, a);",
    "}"
  ].join("\n");

  function createFallback(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return { render: function () {} };
    return {
      render: function (progress) {
        var rect = canvas.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        var width = Math.max(1, rect.width);
        var height = Math.max(1, rect.height);
        var radius = Math.min(width, height) * 0.29;
        var count = width < 330 ? 25 : width < 430 ? 31 : 37;
        var nodes = buildNodes(count, radius);
        var rotX = SEED_VIEW_TILT - progress * 0.42;
        var rotY = 0.5 + progress * 0.8;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = readCssVar(canvas, "--orb-particle", "rgba(255, 178, 94, 1)");
        for (var i = 0; i < count; i += 1) {
          for (var j = 0; j < count; j += 1) {
            var p = nodes[i][j];
            var cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
            var x1 = p.x * cy - p.z * sy;
            var z1 = p.x * sy + p.z * cy;
            var y1 = p.y * cx - z1 * sx;
            var z2 = p.y * sx + z1 * cx;
            var scale = (radius * 4.6) / (radius * 4.6 + z2);
            var front = Math.max(0, Math.min(1, (z2 / radius + 1.4) / 2.8));
            ctx.globalAlpha = 0.08 + front * 0.36;
            ctx.beginPath();
            ctx.arc(width / 2 + x1 * scale, height / 2 + y1 * scale, (0.65 + front * 1.2) * scale, 0, TWO_PI);
            ctx.fill();
          }
        }
      }
    };
  }

  window.createVitaWendeOrb = function (canvas) {
    if (!canvas) return { render: function () {} };

    var gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      depth: false
    });
    var pointProgram = gl ? createProgram(gl, POINT_VS, POINT_FS) : null;
    var surfaceProgram = gl ? createProgram(gl, SURFACE_VS, SURFACE_FS) : null;
    if (!gl || !pointProgram || !surfaceProgram) return createFallback(canvas);

    var common = ["uRotX", "uRotY", "uRadius", "uPersp", "uDpr", "uViewport"];
    var pointU = getUniforms(gl, pointProgram, common.concat(["uLine", "uLineA", "uSoft", "uSoftA"]));
    var surfaceU = getUniforms(gl, surfaceProgram, common.concat(["uSurf", "uSurfA"]));
    var pointAttrib = gl.getAttribLocation(pointProgram, "aPos");
    var surfaceAttrib = gl.getAttribLocation(surfaceProgram, "aPos");
    var nodeBuffer = gl.createBuffer();
    var pointBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    var cache = null;

    function rebuild(count, radius) {
      var nodes = buildNodes(count, radius);
      var indices = new Uint16Array((count - 1) * (count - 1) * 6);
      var ii = 0;
      for (var i = 0; i < count - 1; i += 1) {
        for (var j = 0; j < count - 1; j += 1) {
          var a = i * count + j;
          var b = (i + 1) * count + j;
          var c = (i + 1) * count + (j + 1);
          var d = i * count + (j + 1);
          indices[ii++] = a; indices[ii++] = b; indices[ii++] = c;
          indices[ii++] = a; indices[ii++] = c; indices[ii++] = d;
        }
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

      var target = radius * DOT_SPACING;
      var aIdx = [];
      var bIdx = [];
      var pArr = [];
      var segments = function (na, nb) {
        return Math.max(1, Math.min(9, Math.round(Math.hypot(na.x - nb.x, na.y - nb.y, na.z - nb.z) / target)));
      };
      for (var x = 0; x < count - 1; x += 1) {
        for (var y = 0; y < count - 1; y += 1) {
          var aOff = (x * count + y) * 3;
          var rightOff = ((x + 1) * count + y) * 3;
          var downOff = (x * count + (y + 1)) * 3;
          var acrossN = segments(nodes[x][y], nodes[x + 1][y]);
          for (var k = 0; k <= acrossN; k += 1) {
            aIdx.push(aOff); bIdx.push(rightOff); pArr.push(k / acrossN);
          }
          var alongN = segments(nodes[x][y], nodes[x][y + 1]);
          for (var l = 0; l <= alongN; l += 1) {
            aIdx.push(aOff); bIdx.push(downOff); pArr.push(l / alongN);
          }
        }
      }
      return {
        count: count,
        radius: radius,
        nodes: nodes,
        indices: indices,
        aIdx: Int32Array.from(aIdx),
        bIdx: Int32Array.from(bIdx),
        pArr: Float32Array.from(pArr),
        nodePos: new Float32Array(count * count * 3),
        pointPos: new Float32Array(aIdx.length * 3)
      };
    }

    function setCommonUniforms(u, rotationX, rotationY, radius, dpr) {
      gl.uniform1f(u.uRotX, rotationX);
      gl.uniform1f(u.uRotY, rotationY);
      gl.uniform1f(u.uRadius, radius);
      gl.uniform1f(u.uPersp, radius * 4.6);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform2f(u.uViewport, canvas.width, canvas.height);
    }

    return {
      render: function (progress) {
        var rect = canvas.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        var width = Math.max(1, rect.width);
        var height = Math.max(1, rect.height);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        var count = width < 330 ? 25 : width < 430 ? 31 : 37;
        var radius = Math.min(width, height) * 0.29;
        if (!cache || cache.count !== count || Math.abs(cache.radius - radius) > 2) cache = rebuild(count, radius);

        var rotationX = SEED_VIEW_TILT - progress * 0.42;
        var rotationY = 0.5 + progress * 0.8;
        var pulse = 1 + Math.sin(progress * TWO_PI * 1.15) * 0.018;
        var p = 0;
        for (var i = 0; i < cache.count; i += 1) {
          for (var j = 0; j < cache.count; j += 1) {
            var node = cache.nodes[i][j];
            cache.nodePos[p++] = node.x * pulse;
            cache.nodePos[p++] = node.y * pulse;
            cache.nodePos[p++] = node.z * pulse;
          }
        }
        for (var s = 0; s < cache.aIdx.length; s += 1) {
          var a = cache.aIdx[s];
          var b = cache.bIdx[s];
          var t = cache.pArr[s];
          var o = s * 3;
          cache.pointPos[o] = cache.nodePos[a] + (cache.nodePos[b] - cache.nodePos[a]) * t;
          cache.pointPos[o + 1] = cache.nodePos[a + 1] + (cache.nodePos[b + 1] - cache.nodePos[a + 1]) * t;
          cache.pointPos[o + 2] = cache.nodePos[a + 2] + (cache.nodePos[b + 2] - cache.nodePos[a + 2]) * t;
        }

        var line = parseColor(readCssVar(canvas, "--orb-particle", "rgba(255, 178, 94, 1)"));
        var soft = parseColor(readCssVar(canvas, "--orb-particle-soft", "rgba(255, 111, 58, 0.78)"));
        var surf = parseColor(readCssVar(canvas, "--orb-surface", "rgba(238, 126, 64, 0.04)"));

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);

        gl.useProgram(surfaceProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cache.nodePos, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(surfaceAttrib);
        gl.vertexAttribPointer(surfaceAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        setCommonUniforms(surfaceU, rotationX, rotationY, radius, dpr);
        gl.uniform3f(surfaceU.uSurf, surf[0], surf[1], surf[2]);
        gl.uniform1f(surfaceU.uSurfA, surf[3]);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, cache.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.useProgram(pointProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, cache.pointPos, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(pointAttrib);
        gl.vertexAttribPointer(pointAttrib, 3, gl.FLOAT, false, 0, 0);
        setCommonUniforms(pointU, rotationX, rotationY, radius, dpr);
        gl.uniform3f(pointU.uLine, line[0], line[1], line[2]);
        gl.uniform1f(pointU.uLineA, line[3]);
        gl.uniform3f(pointU.uSoft, soft[0], soft[1], soft[2]);
        gl.uniform1f(pointU.uSoftA, soft[3]);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.drawArrays(gl.POINTS, 0, cache.aIdx.length);
      }
    };
  };
})();
