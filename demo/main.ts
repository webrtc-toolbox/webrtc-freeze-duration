import "./style.css";
import { VideoQualityObserver } from "../src/index";
import { createCanvasVideoTrack, drawCanvas, getRandomNumber } from "./utils";
import { createTimeline } from "webrtc-tools";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Test Video Quality</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <div class="card">
      <section class="player-card">
        <div class="card-header">
          Origin Canvas
        </div>
        <div class="card-body">
        <canvas id="origin" class="player" autoplay muted width="700" height="400">
        </canvas>
      </section>
      <section class="player-card">
        <div class="card-header">
          Play in Video
        </div>
        <div class="card-body">
        <video id="player" class="player" autoplay muted width="700" height="400">
        </video>
      </section>
    </div>

    <div class="card">
      <section class="player-card">
        <div class="card-header">
          Canvas Freeze
        </div>
        <div class="card-body">
        <canvas id="canvas-freeze" class="player" autoplay muted width="700" height="400">
        </canvas>
      </section>
      <section class="player-card">
        <div class="card-header">
          Video Freeze
        </div>
        <div class="card-body">
        <canvas id="video-freeze" class="player" autoplay muted width="700" height="400">
        </canvas>
      </section>
    </div>
  </div>
`;

let delay = 0;
const observer = new VideoQualityObserver();
const video = document.querySelector<HTMLVideoElement>("#player")!;
if (video) {
  const vfc = (timeStamp: number, metadata: VideoFrameCallbackMetadata) => {
    observer.OnRenderedFrame(timeStamp, metadata);
    video.requestVideoFrameCallback(vfc);
  };

  video.requestVideoFrameCallback(vfc);
}

function createOriginCanvas() {
  const canvas = document.querySelector<HTMLCanvasElement>("#origin")!;
  const track = createCanvasVideoTrack(canvas);
  video.srcObject = new MediaStream([track]);
}

function createView() {
  const canvas = document.querySelector<HTMLCanvasElement>("#origin")!;
  const canvasFreeze =
    document.querySelector<HTMLCanvasElement>("#canvas-freeze")!;
  const videoFreeze =
    document.querySelector<HTMLCanvasElement>("#video-freeze")!;

  const canvasGraph = createTimeline("canvas-freeze", canvasFreeze.id);
  const videoGraph = createTimeline("video-freeze", videoFreeze.id);
  canvasGraph.addGraphPoint(delay);

  let freezeCount = 0;
  let normalCount = 0;
  let normalMaxCount = getRandomNumber(300, 500);
  let freezeMaxCount = getRandomNumber(5, 30);
  let isFreeze = false;

  // 计数器
  let drawCounter = 0;

  const func = () => {
    if (isFreeze) {
      if (++freezeCount < freezeMaxCount) {
        delay = getRandomNumber(100, 6000);
      } else {
        isFreeze = false;
        normalCount = 0;
      }
    } else {
      if (++normalCount < normalMaxCount) {
        delay = 66;
      } else {
        isFreeze = true;
        freezeCount = 0;
      }
    }
    setTimeout(() => {
      drawCanvas(canvas, canvas.getContext("2d")!, "red", drawCounter++);
      canvasGraph.addGraphPoint(delay);
      videoGraph.addGraphPoint(observer._renderFreezeAccTime);
      observer._renderFreezeAccTime = 0;
      func();
    }, delay);
  };
  func();
}

function main() {
  createOriginCanvas();
  createView();
}

main();
