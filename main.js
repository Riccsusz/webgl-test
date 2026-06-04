const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  throw new Error("WebGL not supported");
}

const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aColor;

uniform mat4 uMatrix;

varying vec3 vColor;

void main() {
  gl_Position = uMatrix * vec4(aPosition, 1.0);
  vColor = aColor;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    throw new Error("Shader compile failed");
  }

  return shader;
}

function createProgram(vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error("Program link failed");
  }

  return program;
}

const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(vertexShader, fragmentShader);

gl.useProgram(program);

// Pyramid: 4 side faces + base (2 triangles)
// Each vertex: x, y, z, r, g, b
const vertices = new Float32Array([
  // Front
   0.0,  0.8,  0.0,   1.0, 0.0, 0.0,
  -0.7, -0.6,  0.7,   1.0, 0.0, 0.0,
   0.7, -0.6,  0.7,   1.0, 0.0, 0.0,

  // Right
   0.0,  0.8,  0.0,   0.0, 1.0, 0.0,
   0.7, -0.6,  0.7,   0.0, 1.0, 0.0,
   0.7, -0.6, -0.7,   0.0, 1.0, 0.0,

  // Back
   0.0,  0.8,  0.0,   0.0, 0.4, 1.0,
   0.7, -0.6, -0.7,   0.0, 0.4, 1.0,
  -0.7, -0.6, -0.7,   0.0, 0.4, 1.0,

  // Left
   0.0,  0.8,  0.0,   1.0, 1.0, 0.0,
  -0.7, -0.6, -0.7,   1.0, 1.0, 0.0,
  -0.7, -0.6,  0.7,   1.0, 1.0, 0.0,

  // Base triangle 1
  -0.7, -0.6,  0.7,   0.7, 0.7, 0.7,
  -0.7, -0.6, -0.7,   0.7, 0.7, 0.7,
   0.7, -0.6, -0.7,   0.7, 0.7, 0.7,

  // Base triangle 2
  -0.7, -0.6,  0.7,   0.7, 0.7, 0.7,
   0.7, -0.6, -0.7,   0.7, 0.7, 0.7,
   0.7, -0.6,  0.7,   0.7, 0.7, 0.7,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const aPosition = gl.getAttribLocation(program, "aPosition");
const aColor = gl.getAttribLocation(program, "aColor");
const uMatrix = gl.getUniformLocation(program, "uMatrix");

const stride = 6 * Float32Array.BYTES_PER_ELEMENT;

gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);
gl.enableVertexAttribArray(aPosition);

gl.vertexAttribPointer(
  aColor,
  3,
  gl.FLOAT,
  false,
  stride,
  3 * Float32Array.BYTES_PER_ELEMENT
);
gl.enableVertexAttribArray(aColor);

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

// Column-major 4x4 matrix multiply: out = a * b
function multiply(a, b) {
  const out = new Float32Array(16);

  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }

  return out;
}

function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0
  ]);
}

function translation(tx, ty, tz) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ]);
}

function rotationX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]);
}

function rotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);

function render(time) {
  const t = time * 0.001;

  resizeCanvas();

  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = canvas.width / canvas.height;

  const p = perspective(Math.PI / 3, aspect, 0.1, 100);
  const tr = translation(0, 0, -3);
  const rx = rotationX(t * 0.8);
  const ry = rotationY(t * 1.2);

  let matrix = multiply(p, tr);
  matrix = multiply(matrix, ry);
  matrix = multiply(matrix, rx);

  gl.uniformMatrix4fv(uMatrix, false, matrix);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
