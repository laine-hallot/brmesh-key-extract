import type { Awa } from "./dom";
import type { QRCode } from "jsqr";

const getMediaDevice = async (): Promise<
  { ok: true; data: MediaStream } | { ok: false }
> => {
  try {
    return {
      ok: true,
      data: await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      }),
    };
  } catch (_err) {
    return {
      ok: false,
    };
  }
};

export const getCameraStream = async (): Promise<
  | { ok: true; data: { stream: MediaStream; track: MediaStreamTrack } }
  | { ok: false; error: string }
> => {
  const streamResult = await getMediaDevice();
  if (!streamResult.ok) {
    return { ok: false, error: "" };
  }
  const { data: stream } = streamResult;
  const track = stream.getVideoTracks()[0];
  if (track === undefined) {
    return {
      ok: false,
      error: "Some how your camera isn't returning a video feed",
    };
  }
  track.applyConstraints({});
  return { ok: true, data: { stream, track } };
};

export const playCameraStreamAsVideo = async (
  stream: MediaStream
): Promise<
  | {
      ok: true;
      data: HTMLVideoElement & {
        readyState: HTMLVideoElement["HAVE_ENOUGH_DATA"];
      };
    }
  | { ok: false; error: string }
> => {
  const video = document.createElement("video");
  video.srcObject = stream;

  video.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
  video.play();

  return new Promise((resolve) => {
    video.addEventListener("loadeddata", () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA)
        resolve({
          ok: true,
          data: video as HTMLVideoElement & {
            readyState: HTMLVideoElement["HAVE_ENOUGH_DATA"];
          },
        });
    });
  });
};

export type StreamControls = {
  start: () => void;
  shouldStop: () => void;
  drawBox: (
    location: QRCode["location"],
    color: keyof typeof boxColors
  ) => void;
};

export const createStreamManager = (
  {
    canvasElement,
  }: Pick<
    Awa,
    | "loadingMessage"
    | "instructionContainer"
    | "canvasElement"
    | "instructionText"
  >,
  video: HTMLVideoElement & {
    readyState: HTMLVideoElement["HAVE_ENOUGH_DATA"];
  },
  canvas: CanvasRenderingContext2D,
  eachFrame: (
    imageData: ImageData,
    streamControls: Omit<StreamControls, "start">
  ) => void
): StreamControls => {
  let shouldRender = true;

  const boxDraws: {
    location: QRCode["location"];
    color: keyof typeof boxColors;
  }[] = [];

  const stuff = {
    start: () => {
      requestAnimationFrame(tick);
    },
    shouldStop: () => {
      video.pause();
      shouldRender = false;
    },
    drawBox: (location: QRCode["location"], color: keyof typeof boxColors) => {
      boxDraws.push({ location, color });
    },
  };

  const processFrame = (): void => {
    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    const imageData = canvas.getImageData(
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    boxDraws.forEach((item) => {
      draw2dBox(canvas, item.location, item.color);
    });
    eachFrame(imageData, {
      shouldStop: stuff.shouldStop,
      drawBox: stuff.drawBox,
    });
  };

  const tick = () => {
    processFrame();

    if (shouldRender) {
      requestAnimationFrame(tick);
    }
  };
  return stuff;
};

const boxColors = {
  green: "oklch(79.2% 0.209 151.711)",
  red: "oklch(63.7% 0.237 25.331)",
  yellow: "oklch(90.5% 0.182 98.111)",
};

const draw2dBox = (
  canvas: CanvasRenderingContext2D,
  location: QRCode["location"],
  color: keyof typeof boxColors
) => {
  drawLine(
    canvas,
    location.topLeftCorner,
    location.topRightCorner,
    boxColors[color]
  );
  drawLine(
    canvas,
    location.topRightCorner,
    location.bottomRightCorner,
    boxColors[color]
  );
  drawLine(
    canvas,
    location.bottomRightCorner,
    location.bottomLeftCorner,
    boxColors[color]
  );
  drawLine(
    canvas,
    location.bottomLeftCorner,
    location.topLeftCorner,
    boxColors[color]
  );
};

const drawLine = (
  canvas: CanvasRenderingContext2D,
  begin: { x: number; y: number },
  end: { x: number; y: number },
  color: CanvasFillStrokeStyles["strokeStyle"]
) => {
  canvas.beginPath();
  canvas.moveTo(begin.x, begin.y);
  canvas.lineTo(end.x, end.y);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
};
