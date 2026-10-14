"""Find when a phrase is spoken: python3 scripts/cue.py transcript.json "phrase" [after_seconds]
Prints the start time of the phrase's first word (and that minus 0.2 s)."""
import json, re, sys
data = json.load(open(sys.argv[1]))
words = [(w['text'], w['start_time']) for s in data['segments'] for w in s['words'] if w['text'].strip() and not w['text'].startswith('[')]
norm = lambda t: re.sub(r'[^\wäöüß°-]', '', t.lower())
toks = [norm(w) for w, _ in words]
def find(phrase, after=0.0):
    q = [norm(x) for x in phrase.split()]
    for i in range(len(toks) - len(q) + 1):
        if words[i][1] >= after and all(toks[i + k].startswith(q[k]) for k in range(len(q))):
            return words[i][1]
    return None
if __name__ == '__main__':
    t = find(sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 0)
    print(t, None if t is None else round(t - 0.2, 2))
