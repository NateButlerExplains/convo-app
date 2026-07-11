import { useEffect, useRef } from "react";

export function Waveform({ stream, active }: { stream: MediaStream | null; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cctx = canvas.getContext("2d");
    if (!cctx) return;
    if (!stream || !active) {
      // idle flat line
      cctx.clearRect(0, 0, canvas.width, canvas.height);
      cctx.strokeStyle = "rgba(120,120,120,0.5)";
      cctx.beginPath(); cctx.moveTo(0, canvas.height/2); cctx.lineTo(canvas.width, canvas.height/2); cctx.stroke();
      return;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const draw = () => {
      analyser.getByteFrequencyData(data);
      cctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 28;
      const step = Math.floor(data.length / bars);
      const bw = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[i*step] / 255;
        const h = Math.max(2, v * canvas.height);
        cctx.fillStyle = "#2f7d8c";
        cctx.fillRect(i*bw+1, (canvas.height-h)/2, bw-2, h);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); source.disconnect(); audioCtx.close().catch(()=>{}); };
  }, [stream, active]);
  return <canvas ref={canvasRef} className="waveform" width={560} height={72} aria-hidden="true" />;
}
