"""Find each turn's true start/end inside the generated dialogue blocks.

Text to Dialogue returns voice_segments / character alignment, but in practice their boundaries
lag the audio by up to a word or two, so cutting there splits sentences. This transcribes the raw
blocks once with ElevenLabs Speech to Text (all blocks in one request, separated by silence),
aligns the transcript words to the script words (sequence matching), and stores per turn the
first word's start and the last word's end in block time: audio_gen/cuts.json. assemble.py then
cuts each turn in the silence between those words.

Usage: python3 scripts/podcast/align_blocks.py episodes/<slug> [--reuse]
"""
import difflib, json, os, pathlib, re, subprocess, sys, uuid, urllib.request
import numpy as np

ep = pathlib.Path(sys.argv[1])
gen = ep / "audio_gen"
SR = 16000
SEP = 2.0
turns = json.load(open(ep / "dialogue.json", encoding="utf-8"))["turns"]
blocks = sorted(gen.glob("turns_*.json"))

# one file: all raw blocks, 2 s of silence between them
parts, offsets, t = [], [], 0.0
for bj in blocks:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(bj.with_suffix(".mp3")), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.int16)
    offsets.append((bj, t, len(a) / SR))
    parts += [a, np.zeros(int(SEP * SR), np.int16)]
    t += len(a) / SR + SEP
allwav = gen / "_blocks_concat.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(allwav)],
               input=np.concatenate(parts).tobytes(), check=True)

raw_path = gen / "blocks_stt.json"
if "--reuse" in sys.argv and raw_path.exists():
    res = json.load(open(raw_path))
else:
    boundary = uuid.uuid4().hex
    fields = {"model_id": "scribe_v1", "language_code": "deu", "timestamps_granularity": "word", "diarize": "false"}
    body = b"".join(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode() for k, v in fields.items())
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"blocks.wav\"\r\n"
             f"Content-Type: audio/wav\r\n\r\n").encode() + allwav.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body, method="POST",
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}",
                                          "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
    try:
        res = json.load(urllib.request.urlopen(req, timeout=900))
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()[:600]}")
    json.dump(res, open(raw_path, "w"), ensure_ascii=False)
allwav.unlink()

norm = lambda w: re.sub(r"[^a-z0-9äöüß]", "", w.lower())
stt = [w for w in res["words"] if w.get("type") == "word" and norm(w["text"])]
cuts = {}
for bj, off, dur in offsets:
    meta = json.load(open(bj))
    ids = meta["turns"]
    words = [w for w in stt if off - 0.05 <= w["start"] <= off + dur + 0.05]
    # script words, tagged with their turn
    sw = [(norm(x), i) for i in ids for x in re.sub(r"\[[^\]]+\]", " ", turns[i]["tts"]).split() if norm(x)]
    stem = lambda x: x[:5]  # tolerant of endings (Blutungen / Blutung, hätte / hätt)
    sm = difflib.SequenceMatcher(a=[stem(x) for x, _ in sw], b=[stem(norm(w["text"])) for w in words], autojunk=False)
    owner = [None] * len(words)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            owner[blk.b + k] = sw[blk.a + k][1]
    # unmatched STT words (spelling variants) inherit the neighbouring owner
    for k in range(len(owner)):
        if owner[k] is None:
            prev = next((owner[j] for j in range(k - 1, -1, -1) if owner[j] is not None), None)
            nxt = next((owner[j] for j in range(k + 1, len(owner)) if owner[j] is not None), None)
            owner[k] = prev if prev == nxt or nxt is None else (prev if prev is not None else nxt)
    for i in ids:
        ws = [w for w, o in zip(words, owner) if o == i]
        if not ws:
            sys.exit(f"turn {i} not found in the transcript of {bj.name}")
        cuts[i] = {"block": bj.stem, "start": round(ws[0]["start"] - off, 3), "end": round(ws[-1]["end"] - off, 3)}
json.dump(cuts, open(gen / "cuts.json", "w"), indent=1)
print(len(cuts), "turns located;", len(stt), "words transcribed")
