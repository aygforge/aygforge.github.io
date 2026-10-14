import sys, subprocess, time
sys.path.insert(0, '.')
from multiprocessing import Pool
import scenes
from scenes import *

def work(f):
    if scenes.PAPER_IMG is None:
        init()
    set_frame(f)
    surf = skia.Surface(W, H); cv = surf.getCanvas()
    render_frame(cv, f / FPS)
    return surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType).tobytes()

if __name__ == '__main__':
    out = sys.argv[1]
    nframes = int(round(VIDEO_END * FPS))
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', 'mix_raw.f32',
                           '-filter_complex', '[1:a]volume=0.8dB,alimiter=limit=0.84:level=false,aresample=48000[a]',
                           '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
                           '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                           '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', f'{nframes / FPS:.3f}', out], stdin=subprocess.PIPE)
    t0 = time.time()
    with Pool(4) as p:
        for i, buf in enumerate(p.imap(work, range(nframes), chunksize=2)):
            ff.stdin.write(buf)
            if i % 60 == 0:
                print(i, nframes, f'{time.time() - t0:.0f}s', flush=True)
    ff.stdin.close(); ff.wait()
    print('done', time.time() - t0)
