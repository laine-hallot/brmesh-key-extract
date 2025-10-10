import type { Awa } from "./dom";
import type { QRCode } from "jsqr";
import jsQR from "jsqr";

export const createStreamManager = (
  {
    loadingMessage,
    outputContainer,
    canvasElement,
    outputData,
    outputMessage,
  }: Awa,
  video: HTMLVideoElement,
  canvas: CanvasRenderingContext2D,
  onDetect: (data: QRCode) => Promise<void>
): (() => void) => {
  const awa = (): "detected" | "none" => {
    console.log("frame");
    loadingMessage.innerText = "⌛ Loading video...";
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      loadingMessage.hidden = true;
      canvasElement.hidden = false;
      outputContainer.hidden = false;

      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      var imageData = canvas.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      var code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        drawBox(canvas, code.location);
        void onDetect(code);
        return "detected";
      } else {
        outputMessage.hidden = false;
        outputData.parentElement!.hidden = true;
      }
    }
    return "none";
  };
  const tick = () => {
    if (awa() !== "detected") {
      requestAnimationFrame(tick);
    }
  };
  return tick;
};

const drawBox = (
  canvas: CanvasRenderingContext2D,
  location: QRCode["location"]
) => {
  drawLine(canvas, location.topLeftCorner, location.topRightCorner, "#FF3B58");
  drawLine(
    canvas,
    location.topRightCorner,
    location.bottomRightCorner,
    "#FF3B58"
  );
  drawLine(
    canvas,
    location.bottomRightCorner,
    location.bottomLeftCorner,
    "#FF3B58"
  );
  drawLine(
    canvas,
    location.bottomLeftCorner,
    location.topLeftCorner,
    "#FF3B58"
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
