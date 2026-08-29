import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import importlib.util

# .env 로드
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("🌿 [.env] 환경 변수를 성공적으로 로드했습니다.")
except ImportError:
    print("ℹ️ [알림] python-dotenv 패키지가 없습니다. 시스템 환경 변수를 사용합니다.")

PORT = int(os.environ.get("PORT", 8000))

# API 핸들러 모듈 동적 로드
def load_handler(module_rel_path):
    module_path = os.path.join(os.path.dirname(__file__), module_rel_path)
    spec = importlib.util.spec_from_file_location("api_module", module_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.handler

class DevServerHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(200, "ok")
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
        else:
            super().do_OPTIONS()

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        api_mapping = {
            "/api/fortune": "api/fortune.py",
            "/api/match": "api/match.py",
            "/api/inquiry": "api/inquiry.py"
        }

        if clean_path in api_mapping:
            try:
                handler_class = load_handler(api_mapping[clean_path])
                # 핸들러 실행
                handler_instance = handler_class(self.request, self.client_address, self.server)
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(f'{{"error": "로컬 핸들러 실행 오류: {str(e)}"}}'.encode('utf-8'))
                return

        self.send_error(404, "API 엔드포인트를 찾을 수 없습니다.")

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, DevServerHandler)
    print("\n=======================================================")
    print(" 🏛️ [토정 살롱] 로컬 개발 및 테스트 서버 실행 중")
    print(f" 🌐 접속 주소: http://localhost:{PORT}")
    print(" 💡 종료하려면 터미널에서 Ctrl + C 를 누르세요.")
    print("=======================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.")

if __name__ == '__main__':
    run()
