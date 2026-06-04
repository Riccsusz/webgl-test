const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL is not supported in this browser.");
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
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(error);
  }

  return shader;
}

function createProgram(vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(error);
  }

  return program;
}

const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(vertexShader, fragmentShader);

const vertices = new Float32Array([
  // x, y, z,       r, g, b

  // front
   0.0,  0.8,  0.0,   1.0, 0.2, 0.2,
  -0.7, -0.6,  0.7,   1.0, 0.2, 0.2,
   0.7, -0.6,  0.7,   1.0, 0.2, 0.2,

  // right
   0.0,  0.8,  0.0,   0.2, 1.0, 0.2,
   0.7, -0.6,  0.7,   0.2, 1.0, 0.2,
   0.7, -0.6, -0.7,   0.2, 1.0, 0.2,

  // back
   0.0,  0.8,  0.0,   0.2, 0.4, 1.0,
   0.7, -0.6, -0.7,   0.2, 0.4, 1.0,
  -0.7, -0.6, -0.7,   0.2, 0.4, 1.0,

  // left
   0.0,  0.8,  0.0,   1.0, 1.0, 0.2,
  -0.7, -0.6, -0.7,   1.0, 1.0, 0.2,
  -0.7, -0.6,  0.7,   1.0, 1.0, 0.2,

  // bottom 1
  -0.7, -0.6,  0.7,   0.7, 0.7, 0.7,
   0.7, -0.6, -0.7,   0.7, 0.7, 0.7,
  -0.7, -0.6, -0.7,   0.7, 0.7, 0.7,

  // bottom 2
  -0.7, -0.6,  0.7,   0.7, 0.7, 0.7,
   0.7, -0.6,  0.7,   0.7, 0.7, 0.7,
   0.7, -0.6, -0.7,   0.7, 0.7, 0.7,
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

function makeMatrix(angleX, angleY, aspect) {
  const fov = Math.PI / 3;
  const near = 0.1;
  const far = 100.0;
  const f = 1.0 / Math.tan(fov / 2);

  const sx = Math.sin(angleX);
  const cx = Math.cos(angleX);
  const sy = Math.sin(angleY);
  const cy = Math.cos(angleY);

  // Combined perspective + translation + rotation matrix.
  // Column-major order, as WebGL expects.
  return new Float32Array([
    (f / aspect) * cy,
    sx * sy,
    -cx * sy,
    0,

    0,
    f * cx,
    f * sx,
    0,

    (f / aspect) * sy,
    -sx * cy,
    cx * cy,
    0,

    0,
    0,
    3.0,
    1,
  ]);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

gl.enable(gl.DEPTH_TEST);
gl.useProgram(program);

function render(time) {
  const seconds = time * 0.001;

  resizeCanvas();

  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = canvas.width / canvas.height;
  const matrix = makeMatrix(seconds * 0.8, seconds * 1.2, aspect);

  gl.uniformMatrix4fv(uMatrix, false, matrix);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
