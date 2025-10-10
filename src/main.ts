import { decryptBrmeshQR } from "./brmesh-qr-decrypt";
import { createStreamManager } from "./camera";
import { attachToDom, createDeviceDetailsElement } from "./dom";

const init = () => {
  const domResult = attachToDom();
  if (domResult.ok) {
    const {
      meshKeyElement,
      canvasElement,
      loadingMessage,
      outputContainer,
      outputMessage,
      outputData,
    } = domResult.domElements;

    const canvas = canvasElement.getContext("2d", { willReadFrequently: true });
    if (canvas === null) {
      return "none";
    }
    const video = document.createElement("video");

    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(function (stream) {
        const track = stream.getVideoTracks()[0];
        if (track !== undefined) {
          track.applyConstraints({});
          video.srcObject = stream;

          video.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
          video.play();
          const tick = createStreamManager(
            {
              meshKeyElement,
              loadingMessage,
              outputContainer,
              canvasElement,
              outputData,
              outputMessage,
            },
            video,
            canvas,
            async (code) => {
              const { meshKey, devices } = await decryptBrmeshQR(code.data);
              outputMessage.hidden = true;
              outputData.parentElement!.hidden = false;
              devices.forEach((device) =>
                outputData.appendChild(createDeviceDetailsElement(device))
              );

              meshKeyElement.innerText = meshKey.toString(16).padStart(8, "0");

              console.log("mesh_key =", meshKey);
              console.log("devices  =", devices);
              video.pause();
              track.stop();
              stream.removeTrack(track);
            }
          );
          requestAnimationFrame(tick);
        }
      });
  } else {
    document.body.innerHTML = `<div><h1>It seems like this world is fundamentally broken</h1><span>I'm not sure how but page elements that should be here just aren't. The app can't start like this.</span></div>`;
  }
};
init();
