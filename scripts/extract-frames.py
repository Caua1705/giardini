import cv2
from pathlib import Path

# CONFIG
VIDEO_PATH = Path(__file__).parent / "teste2.mp4"
OUTPUT_DIR = Path(__file__).parent.parent / "references" / "image-frames" / "reservation-mobile"
TOTAL_FRAMES = 150
FRAME_WIDTH = 1280
WEBP_QUALITY = 82

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

cap = cv2.VideoCapture(str(VIDEO_PATH))

if not cap.isOpened():
    print(f"ERRO: não foi possível abrir {VIDEO_PATH}")
else:
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration_s = total_video_frames / fps

    print(f"Vídeo: {total_video_frames} frames | {fps:.1f} fps | {duration_s:.1f}s")
    print(f"Extraindo {TOTAL_FRAMES} frames → {OUTPUT_DIR}")

    step = total_video_frames / TOTAL_FRAMES

    for i in range(TOTAL_FRAMES):
        frame_index = int(i * step)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = cap.read()

        if not ret:
            print(f"  aviso: frame {frame_index} não lido, pulando")
            continue

        h, w = frame.shape[:2]
        new_w = FRAME_WIDTH
        new_h = int(h * new_w / w)
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

        out_path = OUTPUT_DIR / f"frame_{i:04d}.webp"
        cv2.imwrite(str(out_path), resized, [cv2.IMWRITE_WEBP_QUALITY, WEBP_QUALITY])

        if i % 20 == 0 or i == TOTAL_FRAMES - 1:
            print(f"  [{i+1:3d}/{TOTAL_FRAMES}] frame_{i:04d}.webp")

    cap.release()

    total_kb = sum(f.stat().st_size for f in OUTPUT_DIR.glob("*.webp")) / 1024
    print(f"\nConcluído! {TOTAL_FRAMES} frames → {total_kb:.0f} KB total ({total_kb/1024:.1f} MB)")
    print(f"Pasta: {OUTPUT_DIR}")