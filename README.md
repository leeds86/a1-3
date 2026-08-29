# 🏛️ 토정 살롱 (Tojeong Salon)
> **사주와 토정비결로 만나는 AI 현대 명리 웹 서비스**  
> 🌐 **배포 URL**: [https://tojeong-salon.vercel.app](https://tojeong-salon.vercel.app)  
> 📁 **GitHub Repository**: [https://github.com/leeds86/a1-3](https://github.com/leeds86/a1-3)  
> 조선 명리학의 지혜와 최신 생성형 AI를 결합하여 따뜻하고 품격 있는 운세와 인연 궁합을 제공합니다.

---

## 📌 1. 서비스 소개

**토정 살롱**은 맹목적인 미신이나 공포를 조장하는 대신, 삶의 방향을 점검하고 마음의 위안을 얻을 수 있는 현대적 감성의 AI 운세 & 궁합 서비스입니다.

* 🔮 **내 운세 보기**: 기준 연도(2026/2027), 생년월일, 양/음력, 태어난 시를 기반으로 1년 총평, 커리어, 재물, 건강, 1~12월 월별 운세를 종합 분석합니다.
* 💞 **인연 궁합**: 연인, 썸, 친구, 직장 동료 등 관계 유형에 맞춘 시너지와 갈등 예방 대화법을 제공합니다.
* 📜 **나의 운세 서재**: 내가 조회한 운세 결과를 로컬 브라우저에 자동 저장하고 언제든 다시 열람할 수 있습니다.
* 📨 **살롱 문의하기**: 1:1 심층 상담 신청 및 건의사항 접수 시 실시간 알림 연동을 지원합니다.

---

## 🛠️ 2. 기술 스택 및 아키텍처

### 🎨 Frontend
* **HTML5 / CSS3**: 반응형 웹 디자인 (모바일, 태블릿, 데스크톱 최적화)
* **Vanilla JavaScript**: 프레임워크 없는 순수 바닐라 JS, 비동기 `fetch` API, LocalStorage 연동

### ⚙️ Backend
* **Python 3.9+**: Vercel Serverless Functions (`http.server.BaseHTTPRequestHandler`)
* **OpenAI API**: `gpt-4o-mini` 모델 기반 프롬프트 엔지니어링

```text
[ 사용자 브라우저 ] (HTML / CSS / Vanilla JS)
       │
       ▼  fetch('/api/fortune', '/api/match', '/api/inquiry')
[ Vercel Serverless Functions ] (Python API Handlers)
       │
       ├─► [ OpenAI API ] (운세 및 궁합 AI 추론)
       └─► [ Webhook ] (운영진 Discord/Slack 실시간 문의 알림)
```

---

## 📂 3. 프로젝트 폴더 구조

```text
a1-3/
├── api/
│   ├── fortune.py         # 개인 운세 분석 Serverless API (OpenAI 연동)
│   ├── match.py           # 인연 궁합 분석 Serverless API (OpenAI 연동)
│   └── inquiry.py         # 문의 접수 및 Webhook 연동 API (보너스 1)
├── assets/
│   └── tojeong-bg.webp    # 수묵화 무드 글래스모피즘 배경 이미지
├── index.html             # 메인 화면 (운세, 궁합, FAQ, 문의, 서재)
├── style.css              # Pretendard + 마루부리 글래스모피즘 반응형 스타일
├── script.js              # 네비게이션, API fetch, LocalStorage, 공유/복사
├── server.py              # 로컬 개발 및 원클릭 테스트 서버
├── requirements.txt       # Python 의존 패키지 (requests, python-dotenv)
├── .env.example           # 환경 변수 설정 템플릿
├── .gitignore             # API Key 및 비밀 키 보호
├── SERVICE_PLAN.md        # [필수 4] 서비스 기획서
└── README.md              # [필수 3] 프로젝트 설명서
```

---

## 🚀 4. 로컬 실행 방법

### 1) 의존성 설치
```bash
pip install -r requirements.txt
```

### 2) 환경 변수 설정
프로젝트 루트 경로에 `.env` 파일을 생성하고 API 키를 입력합니다.
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key
# (선택) 문의 접수 Webhook URL
INQUIRY_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3) 로컬 서버 구동
```bash
python server.py
```
브라우저에서 `http://localhost:8000` 으로 접속하여 테스트할 수 있습니다.

---

## 🌐 5. Vercel 배포 방법

1. GitHub 저장소에 코드를 푸시합니다.
2. [Vercel 대시보드](https://vercel.com)에서 해당 저장소를 Import합니다.
3. **Environment Variables** 설정에서 `OPENAI_API_KEY` 환경 변수를 추가합니다.
4. **Deploy** 버튼을 누르면 약 1분 이내에 전 세계에 배포됩니다.

* **배포 URL**: [https://tojeong-salon.vercel.app](https://tojeong-salon.vercel.app)

---

## ⭐ 6. 보너스 과제 구현 사항

| 구분 | 기능 명칭 | 구현 세부 내용 |
| :--- | :--- | :--- |
| **보너스 1** | **데이터 저장 & 운영 자동화** | • **나의 운세 서재**: LocalStorage에 최근 운세 영구 저장 & 재열람 & 원클릭 전체 복사/공유<br>• **문의 알림 자동화**: `/api/inquiry`로 접수된 문의를 Discord/Slack Webhook으로 실시간 전달 |
| **보너스 2** | **UX & 인터랙션 고도화 (마이크로 인터랙션)** | • **FAQ `+` 회전 아코디언**: 45도 회전 및 부드러운 슬라이드 인터랙션<br>• **로딩 펄스 & 지연 안내 전환**: 분석 중 펄스 애니메이션 및 3.5초 후 안내 문구 자동 전환<br>• **플로팅 토스트 팝업**: 복사, 공유, 기록 조회 시 실시간 알림 피드백<br>• **글래스 카드 호버 리프트**: 마우스 인터랙션 피드백 |

---

## ✅ 7. 미션 필수 요구사항 충족 자가진단표

| 필수 평가 항목 | 구현 현황 | 세부 위치 및 설명 |
| :--- | :---: | :--- |
| **1. 3개 이상의 페이지/섹션** | ✅ 충족 | 홈(내 운세 보기), 인연 궁합, FAQ, 살롱 문의 (총 4개 섹션 + 운세 서재) |
| **2. 반응형 웹 디자인** | ✅ 충족 | 모바일, 태블릿, PC 완벽 반응형 그리드 & 전용 타이포그래피 스케일 적용 |
| **3. AI 기능 연동 (입력→출력)** | ✅ 충족 | 생년월일/시 사주 입력 → OpenAI `gpt-4o-mini` → 마크다운 운세 리포트 출력 |
| **4. 백엔드 API 분리 구조** | ✅ 충족 | 프론트엔드(HTML/CSS/JS) + Vercel Serverless Functions(Python `/api/*.py`) |
| **5. 환경 변수 보안 관리** | ✅ 충족 | `OPENAI_API_KEY`, `INQUIRY_WEBHOOK_URL`은 `.gitignore` 처리 및 Vercel Secrets로 관리 |
| **6. 예외 및 실패 처리** | ✅ 충족 | 빈 값 유효성 검사, 네트워크 타임아웃 방어, 로딩 지연 상태 안내, 에러 카드 재시도 UI |
| **7. 제출 패키지 5종 완비** | ✅ 충족 | 배포 URL, GitHub 레포, README.md, SERVICE_PLAN.md, 증빙 스크린샷 캡처 |
