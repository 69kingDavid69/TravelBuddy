"""Download Piper TTS voice models from Hugging Face Hub.

Fetches the Spanish (es_MX-claude-high) and English (en_US-amy-medium) ONNX
voice models along with their config files, then flattens the nested directory
structure into a single target directory for easy access by the TTS client.

Usage:
    python scripts/download_voices.py
"""

from huggingface_hub import hf_hub_download
import os
import shutil

# Voice model paths relative to the Hugging Face piper-voices repository
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

# Flatten the nested locale directories (es/, en/) so model files sit directly
# in the target directory — the TTS client expects flat filenames like
# "es_MX-claude-high.onnx", not nested paths.
for subdir in ["es", "en"]:
    src = os.path.join(target, subdir)
    if os.path.isdir(src):
        for root, dirs, files in os.walk(src):
            for name in files:
                shutil.move(os.path.join(root, name), os.path.join(target, name))
        shutil.rmtree(src)
