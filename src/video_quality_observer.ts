/**
 * 参照chromium video_quality_observer2.cc;
 */

import { EventEmitter } from "./event";
import { sumArray } from "./helper";
import { visibilityWatcher } from "./visibility_watcher";

const kMinFrameSamplesToDetectFreeze = 5;
const kAvgInterframeDelaysWindowSizeFrames = 30;
const kMinIncreaseForFreezeMs = 150;
const kMinFreezeMs = 500;

class VideoQualityObserver extends EventEmitter {
  public _renderFreezeAccTime: number = 0;
  public _renderFreezeDurations: number[] = [];

  private _was_freeze: boolean = false;
  private _lastExtendedVideoFrameMetadata:
    | (VideoFrameCallbackMetadata & { timestamp: DOMHighResTimeStamp })
    | undefined;

  private _render_interframe_delays: number[] = [];
  private _render_interframe_delays_sizes: number[] = [];
  // 最近 30个样本 的平均delay
  private _avg_interframe_delay: number = 0;

  private _min_interframe_delay: number = kMinIncreaseForFreezeMs;

  public OnRenderedFrame(
    now: DOMHighResTimeStamp,
    metadata: VideoFrameCallbackMetadata
  ) {
    if (this._lastExtendedVideoFrameMetadata) {
      this._addSample(metadata, this._lastExtendedVideoFrameMetadata);
      this._min_interframe_delay = Math.min(
        this._avg_interframe_delay,
        this._min_interframe_delay
      );
      const _interframe_delay_ms = getInterframeDelay(
        metadata,
        this._lastExtendedVideoFrameMetadata,
        this._min_interframe_delay
      );
      this._was_freeze = false;

      const curSumSize = sumArray(this._render_interframe_delays_sizes);
      if (
        _interframe_delay_ms &&
        curSumSize >= kMinFrameSamplesToDetectFreeze
      ) {
        this._was_freeze =
          _interframe_delay_ms >=
          Math.max(
            3 * this._avg_interframe_delay,
            this._avg_interframe_delay + kMinIncreaseForFreezeMs
          );

        if (
          this._was_freeze &&
          visibilityWatcher.lastVisibleTime >=
            visibilityWatcher.lastHiddenTime &&
          this._lastExtendedVideoFrameMetadata.timestamp >
            visibilityWatcher.lastVisibleTime &&
          this._lastExtendedVideoFrameMetadata.timestamp >
            visibilityWatcher.lastHiddenTime
        ) {
          this._renderFreezeAccTime += _interframe_delay_ms;
        }
      }
    }

    this._lastExtendedVideoFrameMetadata = { ...metadata, timestamp: now };
  }

  public wasFreeze() {
    return this._was_freeze;
  }

  private _addSample(
    metadata: VideoFrameCallbackMetadata,
    _lastExtendedVideoFrameMetadata: VideoFrameCallbackMetadata & {
      timestamp: DOMHighResTimeStamp;
    }
  ) {
    this._render_interframe_delays_sizes.push(
      metadata.presentedFrames - _lastExtendedVideoFrameMetadata.presentedFrames
    );
    this._render_interframe_delays.push(
      metadata.presentationTime -
        _lastExtendedVideoFrameMetadata.presentationTime
    );
    const curSumSize = sumArray(this._render_interframe_delays_sizes);
    const unshiftedSumSize =
      curSumSize - this._render_interframe_delays_sizes[0];

    if (
      curSumSize > kAvgInterframeDelaysWindowSizeFrames &&
      unshiftedSumSize > kMinFrameSamplesToDetectFreeze
    ) {
      this._render_interframe_delays_sizes.shift();
      this._render_interframe_delays.shift();
    }

    this._avg_interframe_delay = GetAverageRoundedDown(
      this._render_interframe_delays_sizes,
      this._render_interframe_delays
    );

    return this._avg_interframe_delay;
  }
}

function GetAverageRoundedDown(delaySizes: number[], delays: number[]): number {
  const sumSizes = sumArray(delaySizes);
  const sumDelays = sumArray(delays);

  return Math.min(Math.floor(sumDelays / sumSizes), kMinFreezeMs);
}

function getInterframeDelay(
  metadata: VideoFrameCallbackMetadata,
  _lastExtendedVideoFrameMetadata: VideoFrameCallbackMetadata & {
    timestamp: DOMHighResTimeStamp;
  },
  _min_interframe_delay: number
) {
  const deltaTimes =
    metadata.presentationTime -
    _lastExtendedVideoFrameMetadata.presentationTime;
  const deltaFrames =
    metadata.presentedFrames - _lastExtendedVideoFrameMetadata.presentedFrames;
  const delay =
    deltaTimes -
    (deltaFrames - 1) *
      Math.min(_min_interframe_delay, kMinIncreaseForFreezeMs);

  return delay;
}

export { VideoQualityObserver };
