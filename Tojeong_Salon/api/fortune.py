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
            print("OPENAI_API_KEY is not configured")
            self._send_error(500, "OpenAI API 키가 설정되지 않았습니다.")
            return

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data)
        except json.JSONDecodeError:
            self._send_error(400, "잘못된 요청 형식입니다.")
            return

        target_year = body.get('targetYear')
        birthdate = body.get('birthdate')
        calendar_type = body.get('calendarType')
        gender = body.get('gender')
        birth_hour = body.get('birthHour')

        # 궁합 요청: 두 번째 사람의 정보가 함께 전달된 경우
        partner_birthdate = body.get('partnerBirthdate')
        partner_calendar_type = body.get('partnerCalendarType')
        partner_gender = body.get('partnerGender')
        partner_birth_hour = body.get('partnerBirthHour')
        is_compatibility = bool(partner_birthdate)

        if not birthdate or not gender:
            self._send_error(400, "필수 입력값이 없습니다.")
            return

        def calendar_label(value):
            if value == 'lunar':
                return '음력(평달)'
            if value == 'lunar-leap':
                return '음력(윤달)'
            return '양력'

        calendar_text = calendar_label(calendar_type)
        hour_text = f"태어난 시: {birth_hour}시" if birth_hour else "태어난 시: 미상"

        if is_compatibility:
            partner_calendar_text = calendar_label(partner_calendar_type)
            partner_hour_text = f"태어난 시: {partner_birth_hour}시" if partner_birth_hour else "태어난 시: 미상"

            prompt = f"""
당신은 전통 사주와 토정비결의 관점을 현대적으로 해석하는 운세 전문가입니다.
오래된 지혜를 오늘의 언어로 풀어내되, 특정 역사적 인물의 권위나 실제 발언을 인용하지 마세요.
두 사람의 관계를 운명처럼 단정하지 않고, 서로의 성향과 관계의 흐름을 이해하는 데 도움이 되는 따뜻하고 현실적인 궁합 해석을 제공하세요.

[두 사람의 정보]
[사람 A]
- 생년월일: {birthdate} ({calendar_text})
- 성별: {gender}
- {hour_text}

[사람 B]
- 생년월일: {partner_birthdate} ({partner_calendar_text})
- 성별: {partner_gender or '미상'}
- {partner_hour_text}

[해석 원칙]
- 위에 제공된 사주 계산 결과가 있다면 그것을 기준으로 해석하세요.
- 제공되지 않은 사주 정보를 임의로 계산하거나 만들어내지 마세요.
- 두 사람의 차이와 조화를 함께 살펴보세요.
- '천생연분', '운명', '반드시 헤어진다'처럼 관계의 결과를 확정적으로 단정하지 마세요.
- 점수나 확률만으로 관계를 판단하지 말고 구체적인 성향과 상호작용을 설명하세요.
- 어려운 명리학 용어는 가능한 한 쉬운 한국어로 설명하세요.
- 긍정적인 면과 주의할 점을 균형 있게 제시하세요.
- 갈등이 생길 수 있는 지점은 비난 없이 현실적인 대화와 행동 방법으로 풀어주세요.
- 이별, 결혼, 재물 등을 예언하거나 결정을 대신하지 마세요.
- 공포, 불안, 미신적 확신을 조장하지 마세요.
- 건강 관련 판단이나 진단은 하지 마세요.
- 같은 표현을 반복하지 말고 두 사람의 조합에 맞는 구체적인 내용을 작성하세요.

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
        else:
            prompt = f"""
당신은 전통 사주와 토정비결의 관점을 현대적으로 해석하는 운세 전문가입니다.
오래된 지혜를 오늘의 언어로 풀어내되, 특정 역사적 인물의 권위나 실제 발언을 인용하지 마세요.
따뜻하고 인문학적인 말투로 아래 정보를 바탕으로 토정비결식 운세를 풀어주세요.

[의뢰인 정보]
- 궁금한 시기: {target_year}
- 생년월일: {birthdate} ({calendar_text})
- 성별: {gender}
- {hour_text}

[해석 원칙]
- 위에 제공된 사주 계산 결과를 기준으로 해석하세요.
- 제공되지 않은 사주 정보를 임의로 계산하거나 만들어내지 마세요.
- {target_year}의 흐름과 타고난 성향을 연결해서 해석하세요.
- 어려운 명리학 용어는 가능한 한 쉬운 한국어로 설명하세요.
- 긍정적인 면과 주의할 점을 균형 있게 제시하세요.
- 미래를 확정적으로 단정하지 마세요.
- 공포, 불안, 미신적 확신을 조장하지 마세요.
- 건강은 생활 습관과 에너지 관리 수준의 조언만 제공하세요.
- 재물에 대해서는 투자나 금융상품을 특정하거나 권유하지 마세요.
- 같은 표현을 반복하지 말고 의뢰인의 사주 특징을 반영하세요.

[작성 형식 - 반드시 아래 구조와 순서를 지켜 작성]
**🔮 {target_year}의 전체적인 기운**
({target_year}의 전반적인 흐름을 2~3문장으로 요약)

(구분선 삽입)

**💼 일과 성취**
(업무, 학업, 목표 달성에 관한 흐름과 실천 조언을 2~3문장으로 작성)

**💕 관계와 인연**
(가족, 친구, 동료 및 새로운 인연에 관한 흐름과 관계 조언을 2~3문장으로 작성)

**💰 재물과 흐름**
(수입과 지출의 흐름, 계획적인 재정 관리에 관한 조언을 2~3문장으로 작성)

**🌿 건강과 에너지**
(생활 습관과 컨디션 관리에 관한 현실적인 조언을 1~2문장으로 작성)

(구분선 삽입)

**🗓️ {target_year} 월별 운세 흐름**
(각 월별로 1~2문장씩 작성하고, 각 달의 흐름과 실천 키워드를 포함)
•1월: (내용)
•2월: (내용)
•3월: (내용)
•4월: (내용)
•5월: (내용)
•6월: (내용)
•7월: (내용)
•8월: (내용)
•9월: (내용)
•10월: (내용)
•11월: (내용)
•12월: (내용)

(구분선 삽입)

**✨ 토정 살롱의 한마디**
({target_year}를 준비하는 데 도움이 되는 품위 있고 따뜻한 조언을 2~3문장으로 작성)
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
                    "content": "당신은 전통 사주와 토정비결을 현대적으로 해석하는 전문가입니다. 특정 역사적 인물의 권위를 내세우지 않고, 따뜻하고 통찰력 있는 해석을 제공합니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1200 if is_compatibility else 1000,
            "temperature": 0.8
        }

        try:
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()

            if response.status_code != 200:
                print("OpenAI Error:", data)
                self._send_error(500, "AI 호출 실패")
                return

            choices = data.get("choices", [])
            if not choices or not choices[0].get("message", {}).get("content"):
                print("OpenAI response did not include a result:", data)
                self._send_error(500, "AI 응답 형식이 올바르지 않습니다.")
                return

            result_content = choices[0]["message"]["content"]
            self._send_success({"result": result_content})

        except Exception as e:
            print("Server Error:", e)
            self._send_error(500, "서버 오류가 발생했습니다.")

    def _send_success(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def _send_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        error_data = {"error": message}
        self.wfile.write(json.dumps(error_data).encode('utf-8'))