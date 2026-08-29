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

        target_year = body.get('targetYear', '2026년')
        birthdate = body.get('birthdate')
        calendar_type = body.get('calendarType', 'solar')
        gender = body.get('gender')
        birth_hour = body.get('birthHour', '')

        if not birthdate:
            self._send_error(400, "생년월일(birthdate)은 필수 입력 항목입니다.")
            return
        if not gender:
            self._send_error(400, "성별(gender)을 선택해주세요.")
            return

        def calendar_label(value):
            if value == 'lunar':
                return '음력(평달)'
            if value == 'lunar-leap':
                return '음력(윤달)'
            return '양력'

        calendar_text = calendar_label(calendar_type)
        hour_text = f"태어난 시: {birth_hour}시" if birth_hour else "태어난 시: 미상(시간 모름)"
        gender_text = "남성" if gender == "male" else "여성" if gender == "female" else gender

        prompt = f"""
당신은 전통 사주 명리학과 토정비결의 지혜를 현대적인 통찰로 알기 쉽게 해석하는 20년 경력의 다정한 운세 전문가입니다.
특정 역사적 인물의 권위를 일방적으로 내세우지 않고, 내담자의 성향과 운의 흐름을 따뜻하고 현실적인 조언으로 풀어주세요.

[내담자 기본 정보]
- 운세 기준 연도: {target_year}
- 생년월일: {birthdate} ({calendar_text})
- 성별: {gender_text}
- {hour_text}

[해석 원칙 및 가이드라인]
1. 사주와 토정비결의 오행(목, 화, 토, 금, 수) 기운의 조화를 자연스럽게 녹여내어 풀이하세요.
2. 극단적이거나 공포·불안을 조장하는 단정적인 예언은 절대 하지 마세요.
3. 어려운 한자 명리학 용어는 누구나 이해할 수 있는 현대적이고 품격 있는 한국어로 쉽게 설명하세요.
4. 조심해야 할 운의 흐름이 있다면 비관하기보다 이를 현명하게 대처할 수 있는 실천적인 행동 팁을 함께 제공하세요.
5. 월별 운세는 {target_year}의 1월부터 12월까지 각 달의 핵심 테마와 실천 조언을 명확히 제시하세요.

[작성 포맷 - 반드시 아래 마크다운 양식을 엄격히 지켜 작성할 것]
### 🌟 {target_year} 종합 운세 총평
({target_year} 한 해를 관통하는 전반적인 흐름과 타고난 기운의 특징을 3~4문장으로 품격 있게 서술)

---

### 💼 커리어와 성취의 기운
(학업, 직장, 사업, 이직 등 성취와 목표 달성에 관한 현실적인 조언 2~3문장)

---

### 💰 재물과 재정 흐름
(수입, 지출 관리, 투자 및 자산 형성에 도움이 되는 지혜로운 가이드 2~3문장)

---

### 🌿 건강과 마음 에너지
(체력 관리, 스트레스 완화, 일상의 균형을 위한 현실적인 건강 조언 2~3문장)

---

### 🗓️ {target_year} 12개월 월별 운세 가이드
- **1월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **2월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **3월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **4월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **5월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **6월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **7월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **8월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **9월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **10월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **11월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)
- **12월**: (월별 핵심 흐름 및 실천 키워드 1~2문장)

---

### ✨ 토정 살롱이 전하는 올해의 지혜
({target_year}를 맞이하는 내담자에게 전하는 따뜻한 응원과 깊은 울림을 주는 마침 글귀 2~3문장)
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
                    "content": "당신은 전통 사주와 토정비결의 지혜를 따뜻하고 현대적인 시각으로 명쾌하게 풀어주는 전문 카운슬러입니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1500,
            "temperature": 0.75
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=25)
            data = response.json()

            if response.status_code != 200:
                error_msg = data.get("error", {}).get("message", "AI API 호출에 실패했습니다.")
                print(f"OpenAI API Error ({response.status_code}):", error_msg)
                self._send_error(response.status_code, f"AI 서비스 응답 실패: {error_msg}")
                return

            choices = data.get("choices", [])
            if not choices or not choices[0].get("message", {}).get("content"):
                self._send_error(500, "AI 응답 결과를 생성하지 못했습니다.")
                return

            result_content = choices[0]["message"]["content"]
            self._send_success({
                "result": result_content,
                "targetYear": target_year,
                "birthdate": birthdate,
                "calendarType": calendar_text,
                "gender": gender_text
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
