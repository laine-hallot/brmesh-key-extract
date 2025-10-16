import { decryptBrmeshQR } from "./brmesh-qr-decrypt";
import {
  createStreamManager,
  getCameraStream,
  playCameraStreamAsVideo,
} from "./camera";
import {
  attachToDom,
  buttonsCanvas,
  createDeviceDetailsElement,
  dataComponent,
  type Awa,
} from "./dom";
import { qrMeow } from "./image-process";

const init = async () => {
  const domResult = attachToDom();
  if (domResult.ok) {
    const { cameraStartBtn: cameraStart } = domResult.domElements;

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
  cameraStartBtn,
  instructionContainer,
  instructionText,
}: Awa) => {
  return async (): Promise<void> => {
    const detailsView = dataComponent({
      errorDisplay,
      instructionContainer,
      outputContainer,
    });
    const cameraView = buttonsCanvas({
      cameraStartBtn,
      canvasElement,
      loadingMessage,
    });
    const cameraResult = await getCameraStream();

    if (!cameraResult.ok) {
      detailsView("error");
      errorReason.innerText =
        "I can't use the camera if you deny camera permission";
      return;
    }
    const canvas = canvasElement.getContext("2d", {
      willReadFrequently: true,
    });
    if (canvas === null) {
      detailsView("error");
      errorReason.innerText =
        "There was some kind of error while creating the camera output display";
      return;
    }

    const {
      data: { stream, track },
    } = cameraResult;
    cameraView("loading");
    const videoResult = await playCameraStreamAsVideo(stream);
    cameraView("canvas");
    if (!videoResult.ok) {
      detailsView("error");
      errorReason.innerText =
        "Some how your camera isn't returning a video feed";
      return;
    }
    const { data: video } = videoResult;
    detailsView("instruction");
    instructionText.innerText = "Point your camera at your BRmesh QR code";

    const qrReader = qrMeow(
      async (code, streamControls) => {
        detailsView("instruction");
        instructionText.innerText = "Analyzing QR code";
        streamControls.drawBox(code.location, "yellow");

        const decryptResult = await decryptBrmeshQR(code.data);

        if (!decryptResult.ok) {
          detailsView("error");
          errorReason.innerText = "No BRmesh data found";
          streamControls.drawBox(code.location, "red");
        } else {
          const { meshKey, devices } = decryptResult.data;

          if (devices.ok) {
            outputData.innerHTML = "";
            devices.data.forEach((device) =>
              outputData.appendChild(createDeviceDetailsElement(device))
            );
          }

          meshKeyElement.innerText = meshKey.toString(16).padStart(8, "0");

          detailsView("output");
          instructionText.innerText = "";

          track.stop();
          stream.removeTrack(track);

          streamControls.drawBox(code.location, "green");
          streamControls.shouldStop();
        }
      },
      () => {
        instructionText.innerText = "Point your camera at your BRmesh QR code";
      }
    );

    const { start: startStream } = createStreamManager(
      {
        loadingMessage,
        canvasElement,
        instructionContainer,
        instructionText,
      },
      video,
      canvas,
      qrReader
    );
    startStream();
  };
};

void init();
