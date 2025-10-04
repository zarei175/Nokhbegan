#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP Server for Student Registration System
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    # Change to script directory
    os.chdir(Path(__file__).parent)
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("🚀 سرور محلی راه‌اندازی شد!")
        print("=" * 60)
        print(f"\n📍 آدرس: http://localhost:{PORT}")
        print(f"📁 پوشه: {os.getcwd()}")
        print("\n✅ مرورگر خودکار باز می‌شود...")
        print("\n⚠️  برای توقف سرور: Ctrl+C")
        print("=" * 60)
        print("\n")
        
        # Open browser automatically
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 سرور متوقف شد.")
            print("=" * 60)

if __name__ == "__main__":
    main()
