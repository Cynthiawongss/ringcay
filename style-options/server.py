#!/usr/bin/env python3
"""Throwaway helper for the style boards: serves this folder and saves the rendered boards into ./out."""
import http.server, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4174


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        m = re.fullmatch(r"/save/([a-z0-9_-]{1,60}\.(?:jpg|png))", self.path)
        size = int(self.headers.get("Content-Length", "0"))
        if not m or size <= 0 or size > 12_000_000:
            self.send_error(400)
            return
        with open(os.path.join(ROOT, "out", m.group(1)), "wb") as f:
            f.write(self.rfile.read(size))
        self.send_response(204)
        self.end_headers()


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        httpd.serve_forever()
