import type { QRCode } from "jsqr";

import jsQR from "jsqr";

export const processFrame = (
  imageData: ImageData,
  onDetect: (data: QRCode) => Promise<void>
) => {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  });
  if (code) {
    onDetect(code);
  }
};
