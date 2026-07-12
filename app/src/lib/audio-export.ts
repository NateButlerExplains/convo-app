import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { todayStamp } from "./formatters";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportAudioMp3(source: Blob, baseName = `conversation-recording-${todayStamp()}`) {
  const ffmpeg = await getFFmpeg();
  const inputName = "recording.webm";
  const outputName = "recording.mp3";
  await ffmpeg.writeFile(inputName, await fetchFile(source));
  await ffmpeg.exec(["-i", inputName, "-vn", "-codec:a", "libmp3lame", "-q:a", "2", outputName]);
  const data = await ffmpeg.readFile(outputName) as unknown;
  const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array(data as unknown as ArrayBuffer);
  const mp3Blob = new Blob([bytes], { type: "audio/mpeg" });
  downloadBlob(mp3Blob, `${baseName}.mp3`);
  try { await ffmpeg.deleteFile(inputName); } catch { /* ignore */ }
  try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }
}
