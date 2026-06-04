const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL is not supported in this browser.");
}

// Vertex shader
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

// Fragment shader
const fragmentShaderSource = `
precision mediump float;

varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// A 3D pyramid made from triangles.
// Each vertex: x, y, z, r, g, b
const vertices = new Float32Array([
  // Front face
   0.0,  0.8,  0.0,   1.0, 0.2, 0.2,
  -0.7, -0.6,  0.7,   1.0, 0.2, 0.2,
   0.7, -0.6,  0.7,   1.0, 0.2, 0.2,

  // Right face
   0.0,  0.8,  0.0,   0.2, 1.0, 0.2,
   0.7, -0.6,  0.7,   0.2, 1.0, 0.2,
   0.7, -0.6, -0.7,   0.2, 1.0, 0.2,

  // Back face
   0.0,  0.8,  0.0,   0.2, 0.4, 1.0,
   0.7, -0.6, -0.7,   0.2, 0.4, 1.0,
  -0.7, -0.6, -0.7,   0.2, 0.4, 1.0,

  // Left face
   0.0,  0.8,  0.0,   1.0, 1.0, 0.2,
  -0.7, -0.6, -0.7,   1.0, 1.0, 0.2,
  -0.7, -0.6,  0.7,   1.0, 1.0, 0.2,

  // Bottom face, triangle 1
  -0.7, -0.6,  0.7,   0.7, 0.7, 0.7,
  -0.7, -0.6, -0.7,   0.7, 0.7, 0.7,
   0.7, -0.6, -0.7,   0.7, 0.7, 0.7,

  // Bottom face, triangle 2
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

gl.vertexAttribPointer(
  aPosition,
  3,
  gl.FLOAT,
  false,
  stride,
  0
);
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

function multiplyMatrices(a, b) {
  const result = new Float32Array(16);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      result[col + row * 4] =
        a[row * 4 + 0] * b[col + 0] +
        a[row * 4 + 1] * b[col + 4] +
        a[row * 4 + 2] * b[col + 8] +
        a[row * 4 + 3] * b[col + 12];
    }
  }

  return result;
}

function perspectiveMatrix(fieldOfViewRadians, aspect, near, far) {
  const f = 1.0 / Math.tan(fieldOfViewRadians / 2);
  const rangeInv = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ]);
}

function translationMatrix(tx, ty, tz) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ]);
}

function rotationXMatrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]);
}

function rotationYMatrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

gl.enable(gl.DEPTH_TEST);

function render(time) {
  const seconds = time * 0.001;

  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = canvas.width / canvas.height;
  const projection = perspectiveMatrix(Math.PI / 3, aspect, 0.1, 100);
  const translation = translationMatrix(0, 0, -3.0);
  const rotationX = rotationXMatrix(seconds * 0.7);
  const rotationY = rotationYMatrix(seconds * 1.1);

  let matrix = projection;
  matrix = multiplyMatrices(matrix, translation);
  matrix = multiplyMatrices(matrix, rotationX);
  matrix = multiplyMatrices(matrix, rotationY);

  gl.useProgram(program);
  gl.uniformMatrix4fv(uMatrix, false, matrix);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
