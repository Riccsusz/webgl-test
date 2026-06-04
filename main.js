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

const vertices = new Float32Array([
  // x, y, z,        r, g, b

  // front face
   0.0,  0.8,  0.0,   1.0, 0.0, 0.0,
  -0.7, -0.6,  0.7,   1.0, 0.0, 0.0,
   0.7, -0.6,  0.7,   1.0, 0.0, 0.0,

  // right face
   0.0,  0.8,  0.0,   0.0, 1.0, 0.0,
   0.7, -0.6,  0.7,   0.0, 1.0, 0.0,
   0.7, -0.6, -0.7,   0.0, 1.0, 0.0,

  // back face
   0.0,  0.8,  0.0,   0.0, 0.3, 1.0,
   0.7, -0.6, -0.7,   0.0, 0.3, 1.0,
  -0.7, -0.6, -0.7,   0.0, 0.3, 1.0,

  // left face
   0.0,  0.8,  0.0,   1.0, 1.0, 0.0,
  -0.7, -0.6, -0.7,   1.0, 1.0, 0.0,
  -0.7, -0.6,  0.7,   1.0, 1.0, 0.0,
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
  const width = canvas.clientWidth || 600;
  const height = canvas.clientHeight || 400;

  canvas.width = width;
  canvas.height = height;

  gl.viewport(0, 0, canvas.width, canvas.height);
}

function multiply(a, b) {
  const out = new Float32Array(16);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out[i + j * 4] =
        a[0 + j * 4] * b[i + 0 * 4] +
        a[1 + j * 4] * b[i + 1 * 4] +
        a[2 + j * 4] * b[i + 2 * 4] +
        a[3 + j * 4] * b[i + 3 * 4];
    }
  }

  return out;
}

function perspective(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function translate(z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, z, 1,
  ]);
}

function rotateY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

function rotateX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

gl.enable(gl.DEPTH_TEST);
gl.useProgram(program);

function render(time) {
  const t = time * 0.001;

  resizeCanvas();

  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = canvas.width / canvas.height;

  const p = perspective(Math.PI / 3, aspect, 0.1, 100);
  const tr = translate(-3);
  const rx = rotateX(t * 0.7);
  const ry = rotateY(t * 1.2);

  let matrix = p;
  matrix = multiply(matrix, tr);
  matrix = multiply(matrix, rx);
  matrix = multiply(matrix, ry);

  gl.uniformMatrix4fv(uMatrix, false, matrix);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
