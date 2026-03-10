export function useVideo() {
  const generateVideoThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      // Timeout safety
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Thumbnail generation timed out"));
      }, 5000); // Increased to 5s for slower devices

      // Logic
      const run = async () => {
        try {
          // Play triggers loading on mobile
          await video.play().catch(() => {});
          video.pause();

          if (video.readyState < 2) {
            await new Promise((r) => {
              video.onloadeddata = r;
            });
          }

          video.currentTime = Math.min(
            1.0,
            video.duration > 0 ? video.duration / 2 : 0,
          );

          await new Promise((r) => {
            video.onseeked = r;
          });

          const canvas = document.createElement("canvas");
          const MAX_DIM = 640; // Smaller is faster and safer
          let w = video.videoWidth;
          let h = video.videoHeight;

          if (w > MAX_DIM || h > MAX_DIM) {
            const scale = MAX_DIM / Math.max(w, h);
            w *= scale;
            h *= scale;
          }

          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            canvas.toBlob(
              (b) => {
                clearTimeout(timeoutId);
                cleanup();
                if (b) resolve(b);
                else reject(new Error("Blob failed"));
              },
              "image/jpeg",
              0.7,
            );
          } else {
            throw new Error("Canvas context failed");
          }
        } catch (e) {
          clearTimeout(timeoutId);
          cleanup();
          reject(e);
        }
      };

      run();
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
