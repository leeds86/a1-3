import os
import json
import requests
from http.server import BaseHTTPRequestHandler


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
            self._send_error(500, "OpenAI API 키가 설정되지 않았습니다.")
            return

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data)
        except json.JSONDecodeError:
            self._send_error(400, "잘못된 요청 형식입니다.")
            return

        my_info = body.get('myInfo') or {}
        partner_info = body.get('partnerInfo') or {}
        relation_type = body.get('relationType') or '연인'

        my_birthdate = my_info.get('birthdate')
        partner_birthdate = partner_info.get('birthdate')
        my_gender = my_info.get('gender') or '미상'
        partner_gender = partner_info.get('gender') or '미상'

        if not my_birthdate or not partner_birthdate:
            self._send_error(400, "두 사람의 생년월일을 모두 입력해주세요.")
            return

        def calendar_label(value):
            if value == 'lunar':
                return '음력(평달)'
            if value == 'lunar-leap':
                return '음력(윤달)'
            return '양력'

        my_calendar = calendar_label(my_info.get('calendarType'))
        partner_calendar = calendar_label(partner_info.get('calendarType'))

        prompt = f"""
당신은 전통 사주와 토정비결의 관점을 현대적으로 해석하는 운세 전문가입니다.
오래된 지혜를 오늘의 언어로 풀어내되, 특정 역사적 인물의 권위나 실제 발언을 인용하지 마세요.
두 사람의 관계를 운명처럼 단정하지 않고, 서로의 성향과 관계의 흐름을 이해하는 데 도움이 되는 따뜻하고 현실적인 궁합 해석을 제공하세요.

[관계 유형]
{relation_type}

[사람 A]
- 생년월일: {my_birthdate} ({my_calendar})
- 성별: {my_gender}

[사람 B]
- 생년월일: {partner_birthdate} ({partner_calendar})
- 성별: {partner_gender}

[해석 원칙]
- 제공된 생년월일, 양력/음력, 성별 정보만 사용하세요.
- 태어난 시각은 궁합 해석에 사용하지 않습니다.
- 두 사람의 차이와 조화를 함께 살펴보세요.
- 관계 유형({relation_type})에 맞게 해석의 초점을 조절하세요.
- '천생연분', '운명', '반드시 헤어진다'처럼 관계의 결과를 확정적으로 단정하지 마세요.
- 점수나 확률만으로 관계를 판단하지 말고 구체적인 성향과 상호작용을 설명하세요.
- 어려운 명리학 용어는 가능한 한 쉬운 한국어로 설명하세요.
- 긍정적인 면과 주의할 점을 균형 있게 제시하세요.
- 갈등이 생길 수 있는 지점은 비난 없이 현실적인 대화와 행동 방법으로 풀어주세요.
- 이별, 결혼, 재물 등의 결정을 대신하거나 미래를 예언하지 마세요.
- 공포, 불안, 미신적 확신을 조장하지 마세요.
- 건강 관련 판단이나 진단은 하지 마세요.
- 같은 표현을 반복하지 말고 두 사람의 조합과 관계 유형을 반영하세요.

[작성 형식 - 반드시 아래 구조와 순서를 지켜 작성]
**💫 두 분의 인연**
두 사람의 전체적인 관계 분위기와 서로에게 끌리는 지점을 2~3문장으로 작성

(구분선 삽입)

**🌿 서로의 성향**
사람 A와 사람 B가 관계에서 보이기 쉬운 성향과 서로 다른 점을 2~3문장으로 작성

**💕 잘 맞는 점**
서로에게 긍정적인 영향을 주고 관계를 편안하게 만드는 요소를 2~3문장으로 작성

**🌙 조심하면 좋은 점**
오해나 갈등이 생기기 쉬운 지점과 관계를 위해 도움이 되는 현실적인 조언을 2~3문장으로 작성

**🪞 두 분의 관계를 위한 팁**
두 사람이 더 편안하고 건강하게 관계를 이어가기 위한 구체적인 행동이나 대화 방법을 2~3문장으로 작성

(구분선 삽입)

**✨ 토정 살롱의 한마디**
두 사람의 인연을 운명으로 단정하지 않으면서도 여운이 남는 따뜻한 조언을 2~3문장으로 작성
"""

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        payload = {
            "model": "gpt-4.1-nano",
            "messages": [
                {
                    "role": "system",
                    "content": "당신은 전통 사주와 토정비결을 현대적으로 해석하는 전문가입니다. 특정 역사적 인물의 권위를 내세우지 않고, 따뜻하고 통찰력 있는 궁합 해석을 제공합니다."
                },
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1200,
            "temperature": 0.8
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            data = response.json()

            if response.status_code != 200:
                print("OpenAI Error:", data)
                self._send_error(500, "AI 호출 실패")
                return

            choices = data.get("choices", [])
            if not choices or not choices[0].get("message", {}).get("content"):
                self._send_error(500, "AI 응답 형식이 올바르지 않습니다.")
                return

            self._send_success({"result": choices[0]["message"]["content"]})

        except Exception as e:
            print("Server Error:", e)
            self._send_error(500, "서버 오류가 발생했습니다.")

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
        self.wfile.write(json.dumps({"error": message}, ensure_ascii=False).encode('utf-8'))