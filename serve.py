#!/usr/bin/env python3
"""Local preview server for ringcay. Run: python3 serve.py  then open http://localhost:4173

It only serves the files in ./app and tells the browser not to cache them,
so an edit shows up on the next reload.
"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"ringcay is at http://localhost:{PORT}")
        httpd.serve_forever()
