/**
 * 토정 살롱 (Tojeong Salon) - Client Script
 */

let currentFortuneResult = null;
let currentMatchResult = null;

document.addEventListener('DOMContentLoaded', () => {
    setupShareButtons();
});

// ========================================
// 1. 화면 전환 (네비게이션)
// ========================================
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const matchedNav = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick')?.includes(id));
    if (matchedNav) matchedNav.classList.add('active');
}

// ========================================
// 3. 토스트 알림
// ========================================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// ========================================
// 4. 운세 보기
// ========================================
async function startReading() {
    const targetYear = document.getElementById('targetYear').value;
    const birthdate = document.getElementById('birthDate').value;
    const calendarType = document.getElementById('calendarType').value;
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const birthHour = document.getElementById('birthHour').value;

    if (!birthdate) {
        showToast('생년월일을 입력해주세요 🙏');
        document.getElementById('birthDate').focus();
        return;
    }
    if (!genderEl) {
        showToast('성별을 선택해주세요 🙏');
        return;
    }

    const gender = genderEl.value;
    const resultCard = document.getElementById('resultCard');
    const loadingState = document.getElementById('loadingState');
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const resultTitle = document.getElementById('resultTitle');
    const readingBtn = document.getElementById('readingBtn');
    const loadingText = document.getElementById('fortuneLoadingText');

    resultCard.style.display = 'block';
    loadingState.style.display = 'block';
    resultContent.style.display = 'none';
    readingBtn.disabled = true;
    resultCard.scrollIntoView({ behavior: 'smooth' });

    loadingText.textContent = '🔮 잠시, 당신의 운을 들여다보고 있습니다...';
    const timer = setTimeout(() => {
        loadingText.textContent = '⏳ 방대한 토정비결과 오행을 정밀 분석 중입니다...';
    }, 3500);

    try {
        const response = await fetch('/api/fortune', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetYear, birthdate, calendarType, gender, birthHour })
        });

        clearTimeout(timer);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '운세 풀이에 실패했습니다.');

        currentFortuneResult = {
            type: 'fortune',
            targetYear,
            birthdate,
            calendarType,
            gender,
            result: data.result,
            createdAt: new Date().toLocaleString()
        };
        saveToHistory(currentFortuneResult);

        resultTitle.textContent = `${targetYear} 운세 리포트`;
        resultText.innerHTML = formatResult(data.result);

        loadingState.style.display = 'none';
        resultContent.style.display = 'block';
        showToast('✨ 운세 풀이가 완성되었습니다.');

    } catch (error) {
        clearTimeout(timer);
        loadingState.style.display = 'none';
        resultContent.style.display = 'block';
        resultText.innerHTML = `
            <div style="text-align:center; padding: 24px 0;">
                <p style="font-size:18px; font-weight:600; margin-bottom:8px;">😢 오류가 발생했습니다</p>
                <p style="color:var(--text-muted); font-size:14px; margin-bottom:16px;">${error.message}</p>
                <button class="share-btn" style="max-width:200px; margin:0 auto;" onclick="startReading()">다시 시도하기</button>
            </div>`;
    } finally {
        readingBtn.disabled = false;
    }
}

// ========================================
// 5. 인연 궁합 보기
// ========================================
async function startMatchReading() {
    const myBirthdate = document.getElementById('myBirthDate').value;
    const myCalendarType = document.getElementById('myCalendarType').value;
    const myGenderEl = document.querySelector('input[name="myGender"]:checked');

    const partnerBirthdate = document.getElementById('partnerBirthDate').value;
    const partnerCalendarType = document.getElementById('partnerCalendarType').value;
    const partnerGenderEl = document.querySelector('input[name="partnerGender"]:checked');
    const relationType = document.getElementById('relationType').value;

    if (!myBirthdate) {
        showToast('나의 생년월일을 입력해주세요 🙏');
        document.getElementById('myBirthDate').focus();
        return;
    }
    if (!partnerBirthdate) {
        showToast('상대방의 생년월일을 입력해주세요 🙏');
        document.getElementById('partnerBirthDate').focus();
        return;
    }

    const matchResultCard = document.getElementById('matchResultCard');
    const matchLoadingState = document.getElementById('matchLoadingState');
    const matchResultContent = document.getElementById('matchResultContent');
    const matchResultText = document.getElementById('matchResultText');
    const matchResultTitle = document.getElementById('matchResultTitle');
    const matchBtn = document.getElementById('matchBtn');
    const matchLoadingText = document.getElementById('matchLoadingText');

    matchResultCard.style.display = 'block';
    matchLoadingState.style.display = 'block';
    matchResultContent.style.display = 'none';
    matchBtn.disabled = true;
    matchResultCard.scrollIntoView({ behavior: 'smooth' });

    matchLoadingText.textContent = '💫 두 분의 인연을 천천히 들여다보는 중입니다...';
    const timer = setTimeout(() => {
        matchLoadingText.textContent = '⏳ 두 사람의 기운과 소통의 지혜를 정리 중입니다...';
    }, 3500);

    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                relationType,
                myInfo: {
                    birthdate: myBirthdate,
                    calendarType: myCalendarType,
                    gender: myGenderEl ? myGenderEl.value : '미상'
                },
                partnerInfo: {
                    birthdate: partnerBirthdate,
                    calendarType: partnerCalendarType,
                    gender: partnerGenderEl ? partnerGenderEl.value : '미상'
                }
            })
        });

        clearTimeout(timer);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '궁합 분석에 실패했습니다.');

        currentMatchResult = {
            type: 'match',
            relationType,
            myBirthdate,
            partnerBirthdate,
            result: data.result,
            createdAt: new Date().toLocaleString()
        };
        saveToHistory(currentMatchResult);

        matchResultTitle.textContent = `두 분의 [${relationType}] 인연 궁합 리포트`;
        matchResultText.innerHTML = formatResult(data.result);

        matchLoadingState.style.display = 'none';
        matchResultContent.style.display = 'block';
        showToast('💞 궁합 풀이가 완성되었습니다.');

    } catch (error) {
        clearTimeout(timer);
        matchLoadingState.style.display = 'none';
        matchResultContent.style.display = 'block';
        matchResultText.innerHTML = `
            <div style="text-align:center; padding: 24px 0;">
                <p style="font-size:18px; font-weight:600; margin-bottom:8px;">😢 오류가 발생했습니다</p>
                <p style="color:var(--text-muted); font-size:14px; margin-bottom:16px;">${error.message}</p>
                <button class="share-btn" style="max-width:200px; margin:0 auto;" onclick="startMatchReading()">다시 시도하기</button>
            </div>`;
    } finally {
        matchBtn.disabled = false;
    }
}

// ========================================
// 6. 살롱 문의 접수 (보너스 1)
// ========================================
async function submitInquiry() {
    const category = document.getElementById('inquiryCategory').value;
    const name = document.getElementById('inquiryName').value.trim();
    const contact = document.getElementById('inquiryContact').value.trim();
    const message = document.getElementById('inquiryMessage').value.trim();
    const inquiryBtn = document.getElementById('inquiryBtn');
    const form = document.getElementById('inquiryForm');
    const successBox = document.getElementById('inquirySuccess');
    const idText = document.getElementById('inquiryIdText');

    if (!name || !contact || !message) {
        showToast('모든 필수 항목을 입력해주세요 🙏');
        return;
    }

    inquiryBtn.disabled = true;

    try {
        const res = await fetch('/api/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, name, contact, message })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '접수에 실패했습니다.');

        form.style.display = 'none';
        successBox.style.display = 'block';
        idText.textContent = `접수 번호: ${data.inquiryId}`;
        showToast('✨ 문의가 성공적으로 접수되었습니다.');
    } catch (e) {
        showToast(`오류: ${e.message}`);
    } finally {
        inquiryBtn.disabled = false;
    }
}

// ========================================
// 7. FAQ 아코디언 토글 (+ 버튼)
// ========================================
function toggleFaq(button) {
    const item = button.closest('.faq-item');
    if (!item) return;
    const isActive = item.classList.contains('active');

    // 다른 항목 닫기
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

    // 클릭된 항목 토글
    if (!isActive) {
        item.classList.add('active');
    }
}

// ========================================
// 8. 결과 마크다운 포맷팅
// ========================================
function formatResult(text) {
    if (!text) return '';
    return text
        .replace(/^### (.*$)/gim, '<h3 style="margin-top:24px; margin-bottom:10px; font-weight:600;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size:20px; font-weight:600; margin-top:28px; margin-bottom:12px;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^---$/gim, '<hr>')
        .replace(/^\- (.*$)/gim, '<li style="padding:4px 0;">• $1</li>')
        .replace(/\n\n/g, '</p><p style="margin-top:16px;">')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// ========================================
// 9. 로컬스토리지 기록 관리 (보너스 1)
// ========================================
const HISTORY_KEY = 'tojeong_fortune_history';

function saveToHistory(item) {
    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        history.unshift(item);
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error(e);
    }
}

function toggleHistoryModal(show) {
    const modal = document.getElementById('historyModal');
    if (show) {
        renderHistoryList();
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

function renderHistoryList() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    if (history.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:30px 0; color:var(--text-muted);">저장된 기록이 없습니다. 운세를 먼저 확인해보세요 🌿</p>';
        return;
    }

    list.innerHTML = history.map((item, idx) => {
        const title = item.type === 'fortune' ? `🔮 ${item.targetYear} 신년 운세 (${item.birthdate})` : `💞 [${item.relationType}] 인연 궁합`;
        return `
            <div class="history-item" onclick="loadHistory(${idx})">
                <div class="history-item-title">${title}</div>
                <div class="history-item-meta">${item.createdAt}</div>
            </div>
        `;
    }).join('');
}

function loadHistory(idx) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const item = history[idx];
    if (!item) return;

    toggleHistoryModal(false);

    if (item.type === 'fortune') {
        showSection('home');
        document.getElementById('resultTitle').textContent = `${item.targetYear} 운세 리포트 (기록본)`;
        document.getElementById('resultText').innerHTML = formatResult(item.result);
        document.getElementById('resultCard').style.display = 'block';
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('resultContent').style.display = 'block';
        document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth' });
    } else {
        showSection('match');
        document.getElementById('matchResultTitle').textContent = `두 분의 [${item.relationType}] 궁합 리포트 (기록본)`;
        document.getElementById('matchResultText').innerHTML = formatResult(item.result);
        document.getElementById('matchResultCard').style.display = 'block';
        document.getElementById('matchLoadingState').style.display = 'none';
        document.getElementById('matchResultContent').style.display = 'block';
        document.getElementById('matchResultCard').scrollIntoView({ behavior: 'smooth' });
    }
    showToast('📜 지난 기록을 불러왔습니다.');
}

function clearAllHistory() {
    if (confirm('저장된 모든 운세 기록을 삭제하시겠습니까?')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistoryList();
        showToast('기록이 삭제되었습니다.');
    }
}

// ========================================
// 10. 복사, JSON 다운로드, 공유
// ========================================
function copyResultText(id) {
    const element = document.getElementById(id);
    if (!element) return;
    const text = element.innerText;
    if (!text) {
        showToast('복사할 내용이 없습니다.');
        return;
    }
    
    const isMatch = id === 'matchResultText';
    const titleEl = document.getElementById(isMatch ? 'matchResultTitle' : 'resultTitle');
    const title = titleEl ? titleEl.textContent : '토정 살롱 운세 리포트';
    const fullText = `[토정 살롱 🏛️] ${title}\n\n${text}\n\n👉 토정 살롱: ${window.location.origin}`;

    navigator.clipboard.writeText(fullText).then(() => {
        showToast('📋 전체 내용이 클립보드에 복사되었습니다.');
    }).catch(() => {
        showToast('복사에 실패했습니다.');
    });
}

function setupShareButtons() {
    const shareBtn = document.getElementById('shareBtn');
    const matchShareBtn = document.getElementById('matchShareBtn');

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const title = document.getElementById('resultTitle').textContent;
            const text = document.getElementById('resultText').innerText;
            handleShare(title, text);
        });
    }

    if (matchShareBtn) {
        matchShareBtn.addEventListener('click', () => {
            const title = document.getElementById('matchResultTitle').textContent;
            const text = document.getElementById('matchResultText').innerText;
            handleShare(title, text);
        });
    }
}

async function handleShare(title, text) {
    if (!text) {
        showToast('공유할 내용이 없습니다.');
        return;
    }

    const fullShareText = `[토정 살롱 🏛️] ${title}\n\n${text}\n\n👉 토정 살롱에서 확인해보세요: ${window.location.origin}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `[토정 살롱] ${title}`,
                text: fullShareText,
                url: window.location.href
            });
            showToast('✨ 공유창을 열었습니다.');
        } catch (e) {
            if (e.name !== 'AbortError') {
                navigator.clipboard.writeText(fullShareText).then(() => {
                    showToast('📋 전체 내용이 클립보드에 복사되었습니다.');
                });
            }
        }
    } else {
        navigator.clipboard.writeText(fullShareText).then(() => {
            showToast('📋 전체 내용이 클립보드에 복사되었습니다.');
        }).catch(() => {
            showToast('복사에 실패했습니다.');
        });
    }
}
