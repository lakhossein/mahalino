#!/usr/bin/env python3
"""Bind before writing readiness; fail if another server owns the port."""
import argparse
import functools
import http.server
import json
from pathlib import Path


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--port', type=int, default=8731)
    p.add_argument('--directory', required=True)
    p.add_argument('--ready', required=True)
    args = p.parse_args()
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=args.directory)
    with http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        Path(args.ready).write_text(json.dumps({'port': server.server_port}))
        server.serve_forever()


if __name__ == '__main__':
    main()
