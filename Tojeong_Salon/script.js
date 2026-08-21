// ========================================
// 화면 전환
// ========================================
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}


// ========================================
// 다크모드 토글
// ========================================
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});


// ========================================
// 운세 보기 메인 함수
// ========================================
async function startReading() {

    // 1. 입력값 가져오기
    const targetYear   = document.getElementById('targetYear').value; // 추가됨
    const birthdate    = document.getElementById('birthDate').value;
    const calendarType = document.getElementById('calendarType').value;
    const genderEl     = document.querySelector('input[name="gender"]:checked');
    const birthHour    = document.getElementById('birthHour').value;

    // 2. 검증
    if (!birthdate) {
        alert('생년월일을 입력해주세요 🙏');
        return;
    }
    if (!genderEl) {
        alert('성별을 선택해주세요 🙏');
        return;
    }

    const gender = genderEl.value;

    // 3. 결과 카드 보여주기 + 로딩 상태 표시
    const resultCard    = document.getElementById('resultCard');
    const loadingState  = document.getElementById('loadingState');
    const resultContent = document.getElementById('resultContent');
    const resultText    = document.getElementById('resultText');
    const resultTitle   = document.getElementById('resultTitle');

    resultCard.style.display    = 'block';   // 카드 표시
    loadingState.style.display  = 'block';   // 로딩 표시
    resultContent.style.display = 'none';    // 결과 숨김

    // 결과 카드로 스크롤
    resultCard.scrollIntoView({ behavior: 'smooth' });

    // 4. API 호출
    try {
        const response = await fetch('/api/fortune', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetYear, // 추가됨
                birthdate,
                calendarType,
                gender,
                birthHour
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '오류가 발생했습니다.');
        }

        // 5. 결과 출력
        resultTitle.textContent     = `${targetYear} 운세 리포트`;
        resultText.innerHTML        = formatResult(data.result);
        loadingState.style.display  = 'none';   // 로딩 숨김
        resultContent.style.display = 'block';  // 결과 표시

    } catch (error) {
        loadingState.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <p style="font-size:18px;">😢 오류가 발생했습니다</p>
                <p style="opacity:0.6; margin-top:8px;">${error.message}</p>
            </div>
        `;
    }
}


// ========================================
// 결과 텍스트 포맷팅 (마크다운 → HTML)
// ========================================
function formatResult(text) {
    return text
        .replace(/## (.*)/g, '<h2 style="font-size:20px; font-weight:600; margin-bottom:20px;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p style="margin-top:16px;">')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}


// ========================================
// 공유 버튼
// ========================================
document.getElementById('shareBtn').addEventListener('click', async () => {
    const title = document.getElementById('resultTitle').textContent;
    const result = document.getElementById('resultText').innerText;
    const shareText = `${title}\n\n${result}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: '토정 살롱 - 나의 운세',
                text: shareText
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                alert('공유에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        }
        return;
    }

    try {
        await navigator.clipboard.writeText(shareText);
        alert('운세 결과가 복사되었습니다! 📋');
    } catch {
        alert('공유 기능을 사용할 수 없습니다.');
    }
});