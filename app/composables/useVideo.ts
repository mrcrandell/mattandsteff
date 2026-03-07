export function useVideo() {
  const generateVideoThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      video.preload = "metadata"; // important for mobile

      // Try to seek to 1 second to get a non-black frame
      // or if video is shorter, use 0
      const captureTime = 1;

      video.onloadeddata = () => {
        if (video.duration < captureTime) {
          video.currentTime = 0;
        } else {
          video.currentTime = captureTime;
        }
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Thumbnail generation failed"));
            }
            // Cleanup
            URL.revokeObjectURL(video.src);
            video.remove();
            canvas.remove();
          },
          "image/jpeg",
          0.85,
        );
      };

      video.onerror = (e) => {
        reject(e);
        URL.revokeObjectURL(video.src);
      };
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        reject(new Error("Invalid video file"));
        URL.revokeObjectURL(video.src);
      };
    });
  };

  return {
    generateVideoThumbnail,
    getVideoDuration,
  };
}
