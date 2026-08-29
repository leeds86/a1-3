import os
import json
import time
import uuid
import datetime
import requests
from http.server import BaseHTTPRequestHandler

# 로컬 개발 환경용 .env 로드
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            self._send_error(400, "요청 내용이 없습니다.")
            return

        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8'))
        except Exception:
            self._send_error(400, "올바른 JSON 형식이 아닙니다.")
            return

        name = body.get('name', '').strip()
        contact = body.get('contact', '').strip()
        category = body.get('category', '일반 문의').strip()
        message = body.get('message', '').strip()

        if not name:
            self._send_error(400, "이름 또는 닉네임을 입력해주세요.")
            return
        if not contact:
            self._send_error(400, "연락처(이메일 또는 전화번호)를 입력해주세요.")
            return
        if not message:
            self._send_error(400, "문의/남기실 내용을 작성해주세요.")
            return

        inquiry_id = f"TJ-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # [보너스 1] 운영 자동화: 외부 Webhook(Discord/Slack/Zapier 등) 연동 처리
        webhook_url = os.environ.get('INQUIRY_WEBHOOK_URL')
        webhook_status = "not_configured"

        if webhook_url:
            try:
                # Discord 및 Slack 범용 페이로드 구성
                payload = {
                    "content": f"📬 **[토정 살롱] 새 문의 접수 (`{inquiry_id}`)**\n- **작성자**: {name} ({contact})\n- **분류**: {category}\n- **일시**: {timestamp}\n- **내용**: {message}",
                    "text": f"[토정 살롱] 새 문의 접수 ({inquiry_id}): {name} ({category}) - {message}"
                }
                wh_res = requests.post(webhook_url, json=payload, timeout=5)
                webhook_status = f"dispatched ({wh_res.status_code})"
            except Exception as ex:
                print("Webhook dispatch failed:", ex)
                webhook_status = f"failed: {str(ex)}"

        # 성공 응답 반환
        self._send_success({
            "success": True,
            "inquiryId": inquiry_id,
            "receivedAt": timestamp,
            "category": category,
            "name": name,
            "webhookStatus": webhook_status,
            "message": "문의가 성공적으로 접수되었습니다. 토정 살롱 매니저가 확인 후 연락드리겠습니다."
        })

    def _send_success(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _send_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        error_data = {"error": message, "statusCode": status_code}
        self.wfile.write(json.dumps(error_data, ensure_ascii=False).encode('utf-8'))
