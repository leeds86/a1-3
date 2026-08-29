import os
import json
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
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            self._send_error(500, "OpenAI API 키(OPENAI_API_KEY)가 설정되지 않았습니다. 환경 변수를 확인해주세요.")
            return

        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            self._send_error(400, "요청 본문이 비어 있습니다.")
            return

        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8'))
        except Exception:
            self._send_error(400, "올바른 JSON 형식의 요청이 아닙니다.")
            return

        my_info = body.get('myInfo') or {}
        partner_info = body.get('partnerInfo') or {}
        relation_type = body.get('relationType', '연인')

        my_birthdate = my_info.get('birthdate')
        partner_birthdate = partner_info.get('birthdate')
        my_gender = my_info.get('gender', '미상')
        partner_gender = partner_info.get('gender', '미상')

        if not my_birthdate:
            self._send_error(400, "나의 생년월일을 입력해주세요.")
            return
        if not partner_birthdate:
            self._send_error(400, "상대방의 생년월일을 입력해주세요.")
            return

        def calendar_label(value):
            if value == 'lunar':
                return '음력(평달)'
            if value == 'lunar-leap':
                return '음력(윤달)'
            return '양력'

        my_calendar = calendar_label(my_info.get('calendarType'))
        partner_calendar = calendar_label(partner_info.get('calendarType'))
        my_gender_text = "남성" if my_gender == "male" else "여성" if my_gender == "female" else my_gender
        partner_gender_text = "남성" if partner_gender == "male" else "여성" if partner_gender == "female" else partner_gender

        prompt = f"""
당신은 전통 사주와 궁합의 관점을 현대적인 심리학 및 커뮤니케이션 지혜로 재해석하는 전문 상담가입니다.
두 사람의 관계를 '운명'이나 '천생연분/악연'으로 일방적으로 단정짓지 않고, 서로의 기운과 성향의 상호작용을 깊이 이해할 수 있도록 따뜻하고 유익하게 풀이하세요.

[관계 유형]
- {relation_type} 관계

[두 사람의 정보]
- [본인]: 생년월일 {my_birthdate} ({my_calendar}), 성별: {my_gender_text}
- [상대방]: 생년월일 {partner_birthdate} ({partner_calendar}), 성별: {partner_gender_text}

[해석 원칙]
1. 관계 유형({relation_type})의 역학에 맞추어 맞춤형 분석을 제공하세요.
2. 서로에게 긍정적으로 작용하는 시너지와, 오해가 생기기 쉬운 지점을 균형 있게 짚어주세요.
3. 갈등이나 조심할 점은 상대방에 대한 비난이 아닌, 건설적인 대화법과 소통의 팁으로 승화하세요.
4. 어려운 명리학 용어는 피하고 일상에서 실천할 수 있는 직관적인 언어로 작성하세요.

[작성 포맷 - 반드시 아래 마크다운 양식을 엄격히 지켜 작성할 것]
### 💫 두 분의 인연과 시너지 흐름
(두 사람의 전체적인 관계 분위기와 서로에게 끌리고 힘이 되는 핵심 포인트를 3~4문장으로 서술)

---

### 🌿 서로의 기운과 성향 비교
(본인과 상대방이 관계에서 보이는 독특한 성향적 차이와 특징을 3문장으로 분석)

---

### 💕 조화롭게 잘 맞는 강점 (Best Chemistry)
(함께 있을 때 서로를 북돋아주고 편안함을 느끼게 하는 조화의 요소 2~3문장)

---

### 🌙 갈등 예방 및 배려 포인트 (Mindfulness)
(성향 차이로 인해 생길 수 있는 작은 마찰이나 오해의 소지와 이를 부드럽게 넘기는 지혜 2~3문장)

---

### 🪞 토정 살롱이 전하는 관계의 황금 열쇠
({relation_type} 관계가 더 돈독해지고 지속 가능한 행복을 만들기 위한 현실적인 실천 팁 2문장)
"""

        model_name = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "당신은 두 사람의 관계를 따뜻하고 지혜롭게 통찰하는 궁합 전문 상담가입니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1400,
            "temperature": 0.75
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=25)
            data = response.json()

            if response.status_code != 200:
                error_msg = data.get("error", {}).get("message", "AI API 호출 실패")
                print(f"OpenAI Match API Error ({response.status_code}):", error_msg)
                self._send_error(response.status_code, f"궁합 분석 응답 실패: {error_msg}")
                return

            choices = data.get("choices", [])
            if not choices or not choices[0].get("message", {}).get("content"):
                self._send_error(500, "궁합 응답 결과를 생성하지 못했습니다.")
                return

            result_content = choices[0]["message"]["content"]
            self._send_success({
                "result": result_content,
                "relationType": relation_type,
                "myBirthdate": my_birthdate,
                "partnerBirthdate": partner_birthdate
            })

        except requests.exceptions.Timeout:
            self._send_error(504, "AI 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
        except Exception as e:
            print("Server Internal Error:", e)
            self._send_error(500, f"서버 처리 중 오류가 발생했습니다: {str(e)}")

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
