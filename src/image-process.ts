import type { QRCode } from "jsqr";
import type { StreamControls } from "./camera";

import jsQR from "jsqr";

export const qrMeow = (
  onDetect: (
    data: QRCode,
    streamControls: Omit<StreamControls, "start">
  ) => Promise<void>,
  onQrLeave: () => void
) => {
  let lastCode: undefined | string = undefined;
  return (
    imageData: ImageData,
    streamControls: Omit<StreamControls, "start">
  ) => {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      onDetect(code, streamControls);
      lastCode = code.data;
    } else if (code === null && lastCode !== undefined) {
      onQrLeave();
    }
  };
};
