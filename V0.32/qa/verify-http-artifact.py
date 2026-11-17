#!/usr/bin/env python3
import hashlib
import sys
from pathlib import Path
from urllib.request import urlopen


def verify(url, artifact):
    with urlopen(url, timeout=3) as response:
        actual = hashlib.sha256(response.read()).digest()
    if actual != hashlib.sha256(Path(artifact).read_bytes()).digest():
        raise ValueError('HTTP content does not match the current artifact')


if __name__ == '__main__':
    verify(sys.argv[1], sys.argv[2])
