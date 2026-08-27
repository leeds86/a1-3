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
    const targetYear = document.getElementById('targetYear').value;
    const birthdate = document.getElementById('birthDate').value;
    const calendarType = document.getElementById('calendarType').value;
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const birthHour = document.getElementById('birthHour').value;

    if (!birthdate) {
        alert('생년월일을 입력해주세요 🙏');
        return;
    }
    if (!genderEl) {
        alert('성별을 선택해주세요 🙏');
        return;
    }

    const gender = genderEl.value;
    const resultCard = document.getElementById('resultCard');
    const loadingState = document.getElementById('loadingState');
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const resultTitle = document.getElementById('resultTitle');

    resultCard.style.display = 'block';
    loadingState.style.display = 'block';
    resultContent.style.display = 'none';
    resultCard.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch('/api/fortune', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetYear, birthdate, calendarType, gender, birthHour })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '오류가 발생했습니다.');

        resultTitle.textContent = `${targetYear} 운세 리포트`;
        resultText.innerHTML = formatResult(data.result);
        loadingState.style.display = 'none';
        resultContent.style.display = 'block';
    } catch (error) {
        loadingState.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <p style="font-size:18px;">😢 오류가 발생했습니다</p>
                <p style="opacity:0.6; margin-top:8px;">${error.message}</p>
            </div>`;
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
            await navigator.share({ title: '토정 살롱 - 나의 운세', text: shareText });
        } catch (error) {
            if (error.name !== 'AbortError') alert('공유에 실패했습니다. 잠시 후 다시 시도해주세요.');
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

// ========================================
// 인연 궁합 메인 함수
// ========================================
async function startMatchReading() {
    const myBirthDate = document.getElementById('myBirthDate').value;
    const myCalendarType = document.getElementById('myCalendarType').value;
    const myGenderEl = document.querySelector('input[name="myGender"]:checked');

    const partnerBirthDate = document.getElementById('partnerBirthDate').value;
    const partnerCalendarType = document.getElementById('partnerCalendarType').value;
    const partnerGenderEl = document.querySelector('input[name="partnerGender"]:checked');
    const relationType = document.getElementById('relationType').value;

    if (!myBirthDate || !partnerBirthDate) {
        alert('나와 상대방의 생년월일을 모두 입력해주세요 🙏');
        return;
    }
    if (!myGenderEl || !partnerGenderEl) {
        alert('나와 상대방의 성별을 모두 선택해주세요 🙏');
        return;
    }

    const myGender = myGenderEl.value;
    const partnerGender = partnerGenderEl.value;
    const matchResultCard = document.getElementById('matchResultCard');
    const matchLoadingState = document.getElementById('matchLoadingState');
    const matchResultContent = document.getElementById('matchResultContent');
    const matchResultText = document.getElementById('matchResultText');

    matchResultCard.style.display = 'block';
    matchLoadingState.style.display = 'block';
    matchResultContent.style.display = 'none';
    matchResultCard.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                myInfo: {
                    birthdate: myBirthDate,
                    calendarType: myCalendarType,
                    gender: myGender
                },
                partnerInfo: {
                    birthdate: partnerBirthDate,
                    calendarType: partnerCalendarType,
                    gender: partnerGender
                },
                relationType
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '오류가 발생했습니다.');

        matchResultText.innerHTML = formatResult(data.result);
        matchLoadingState.style.display = 'none';
        matchResultContent.style.display = 'block';
    } catch (error) {
        matchLoadingState.style.display = 'none';
        matchResultContent.style.display = 'block';
        matchResultText.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <p style="font-size:18px;">😢 오류가 발생했습니다</p>
                <p style="opacity:0.6; margin-top:8px;">${error.message}</p>
            </div>`;
    }
}

// ========================================
// 궁합 공유 버튼
// ========================================
document.getElementById('matchShareBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('matchResultTitle').textContent;
    const result = document.getElementById('matchResultText').innerText;
    const shareText = `${title}\n\n${result}`;

    if (navigator.share) {
        try {
            await navigator.share({ title: '토정 살롱 - 인연 궁합', text: shareText });
        } catch (error) {
            if (error.name !== 'AbortError') alert('공유에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        return;
    }

    try {
        await navigator.clipboard.writeText(shareText);
        alert('궁합 결과가 복사되었습니다! 📋');
    } catch {
        alert('공유 기능을 사용할 수 없습니다.');
    }
});