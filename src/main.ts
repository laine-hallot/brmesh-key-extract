import { decryptBrmeshQR } from "./brmesh-qr-decrypt";
import {
  createStreamManager,
  getCameraStream,
  playCameraStreamAsVideo,
} from "./camera";
import { attachToDom, createDeviceDetailsElement, type Awa } from "./dom";
import { processFrame } from "./image-process";

const init = async () => {
  const domResult = attachToDom();
  if (domResult.ok) {
    const { cameraStart } = domResult.domElements;

    const clickHandler = createClickHandler(domResult.domElements);
    cameraStart.addEventListener("click", clickHandler);
  } else {
    document.body.innerHTML = `<div><h1>It seems like this world is fundamentally broken</h1><span>I'm not sure how but page elements that should be here just aren't. The app can't start like this.</span></div>`;
  }
};

const createClickHandler = ({
  meshKeyElement,
  canvasElement,
  loadingMessage,
  outputContainer,
  outputData,
  errorDisplay,
  errorReason,
  cameraStart,
  instructionContainer,
  instructionText,
}: Awa) => {
  return;
  return async (): Promise<void> => {
    errorDisplay.classList.add("hidden");
    const cameraResult = await getCameraStream();

    if (cameraResult.ok) {
      cameraStart.classList.add("hidden");
      const canvas = canvasElement.getContext("2d", {
        willReadFrequently: true,
      });
      if (canvas === null) {
        errorDisplay.classList.remove("hidden");
        errorReason.innerText =
          "There was some kind of error while creating the camera output display";
        return;
      }

      const {
        data: { stream, track },
      } = cameraResult;

      loadingMessage.innerText = "⌛ Loading video...";
      const videoResult = await playCameraStreamAsVideo(stream);
      if (!videoResult.ok) {
        errorDisplay.classList.remove("hidden");
        errorReason.innerText =
          "Some how your camera isn't returning a video feed";
        return;
      }
      const { data: video } = videoResult;

      const streamControls = createStreamManager(
        {
          loadingMessage,
          canvasElement,
          instructionContainer,
          instructionText,
        },
        video,
        canvas,
        (imageData) => {
          outputData.parentElement!.hidden = true;
          processFrame(imageData, async (code) => {
            instructionText.innerText = "Analyzing QR code";
            streamControls.drawBox(code.location, "yellow");
            try {
              const { meshKey, devices } = await decryptBrmeshQR(
                new Uint8Array(code.binaryData)
              );
              outputData.parentElement!.hidden = false;
              if (devices.ok) {
                outputData.innerHTML = "";
                devices.data.forEach((device) =>
                  outputData.appendChild(createDeviceDetailsElement(device))
                );
              }

              meshKeyElement.innerText = meshKey.toString(16).padStart(8, "0");

              instructionContainer.classList.add("hidden");
              instructionText.innerText = "";

              outputContainer.classList.remove("hidden");
              track.stop();
              stream.removeTrack(track);

              streamControls.shouldStop();

              streamControls.drawBox(code.location, "green");
            } catch {
              outputContainer.classList.add("hidden");
              instructionContainer.classList.add("hidden");

              errorDisplay.classList.remove("hidden");
              errorReason.innerText = "No BRmesh data found";
              streamControls.drawBox(code.location, "red");
            }
          });
        }
      );
      streamControls.start();
    } else {
      errorDisplay.classList.remove("hidden");
      errorReason.innerText =
        "I can't use the camera if you deny camera permission";
    }
  };
};

void init();
