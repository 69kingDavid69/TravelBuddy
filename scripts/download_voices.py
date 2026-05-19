from huggingface_hub import hf_hub_download
import os
import shutil

FILES = [
    "es/es_MX/claude/high/es_MX-claude-high.onnx",
    "es/es_MX/claude/high/es_MX-claude-high.onnx.json",
    "en/en_US/amy/medium/en_US-amy-medium.onnx",
    "en/en_US/amy/medium/en_US-amy-medium.onnx.json",
]

target = "/data/voices"
os.makedirs(target, exist_ok=True)

for f in FILES:
    hf_hub_download(repo_id="rhasspy/piper-voices", filename=f, local_dir=target)

for subdir in ["es", "en"]:
    src = os.path.join(target, subdir)
    if os.path.isdir(src):
        for root, dirs, files in os.walk(src):
            for name in files:
                shutil.move(os.path.join(root, name), os.path.join(target, name))
        shutil.rmtree(src)
