const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL is not supported in this browser.");
}

// Vertex shader
const vertexShaderSource = `
attribute vec2 aPosition;
attribute vec3 aColor;

uniform float uAngle;

varying vec3 vColor;

void main() {
  float c = cos(uAngle);
  float s = sin(uAngle);

  vec2 rotatedPosition = vec2(
    aPosition.x * c - aPosition.y * s,
    aPosition.x * s + aPosition.y * c
  );

  gl_Position = vec4(rotatedPosition, 0.0, 1.0);
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

const vertices = new Float32Array([
  // x,     y,      r,   g,   b
   0.0,   0.6,     1.0, 0.0, 0.0,
  -0.6,  -0.5,     0.0, 1.0, 0.0,
   0.6,  -0.5,     0.0, 0.3, 1.0
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const aPosition = gl.getAttribLocation(program, "aPosition");
const aColor = gl.getAttribLocation(program, "aColor");
const uAngle = gl.getUniformLocation(program, "uAngle");

const stride = 5 * Float32Array.BYTES_PER_ELEMENT;

gl.vertexAttribPointer(
  aPosition,
  2,
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
  2 * Float32Array.BYTES_PER_ELEMENT
);
gl.enableVertexAttribArray(aColor);

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function render(time) {
  const angle = time * 0.001;

  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.uniform1f(uAngle, angle);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
