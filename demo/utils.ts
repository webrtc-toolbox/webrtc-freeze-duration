export function createCanvasVideoTrack(canvas: HTMLCanvasElement) {
  // 创建canvas和获取2D上下文
  canvas = canvas || document.createElement("canvas");

  // 创建MediaStream
  const stream = canvas.captureStream();

  // 获取videoTrack
  const videoTrack = stream.getVideoTracks()[0];

  return videoTrack;
}

export function getRandomNumber(min = 100, max = 6000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function drawCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  color: string,
  num: number
) {
  // 设置背景色
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制计数器
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "30px Arial";
  ctx.fillText(num + "", canvas.width / 2, canvas.height / 2);
}
