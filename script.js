/**
 * 토정 살롱 (Tojeong Salon) - Client Script
 */

let currentFortuneResult = null;
let currentMatchResult = null;

document.addEventListener('DOMContentLoaded', () => {
    setupShareButtons();
    setupBirthDateInputFormatter();
    initAnalytics();
});

// ========================================
// 1. 생년월일 스마트 8자리 입력 포맷터 & 유효성 검사
// ========================================
function setupBirthDateInputFormatter() {
    const dateInputIds = ['birthDate', 'myBirthDate', 'partnerBirthDate'];
    
    dateInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener('input', () => {
            let val = input.value.replace(/\D/g, '');
            if (val.length > 8) val = val.slice(0, 8);

            if (val.length >= 7) {
                input.value = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6)}`;
            } else if (val.length >= 5) {
                input.value = `${val.slice(0, 4)}-${val.slice(4)}`;
            } else {
                input.value = val;
            }
        });
    });
}

function validateAndFormatBirthdate(value, label = '생년월일') {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 8) {
        return { valid: false, error: `${label} 8자리를 입력해주세요 (예: 19950815)` };
    }
    const year = parseInt(digits.slice(0, 4), 10);
    const month = parseInt(digits.slice(4, 6), 10);
    const day = parseInt(digits.slice(6, 8), 10);

    const currentYear = new Date().getFullYear();
    if (year < 1920 || year > currentYear + 1) {
        return { valid: false, error: `출생연도(1920~${currentYear}년)를 확인해주세요.` };
    }
    if (month < 1 || month > 12) {
        return { valid: false, error: '태어난 달(01~12월)을 올바르게 입력해주세요.' };
    }
    const maxDays = new Date(year, month, 0).getDate();
    if (day < 1 || day > maxDays) {
        return { valid: false, error: `${month}월의 일자(01~${maxDays}일)를 올바르게 입력해주세요.` };
    }

    const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { valid: true, value: formatted };
}

// ========================================
// 2. 화면 전환 (네비게이션)
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
    trackEvent('view_section', { section: id });
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
// 4. 방문자 분석 및 실시간 통계 관리 (보너스 2)
// ========================================
function initAnalytics() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastVisitDate = localStorage.getItem('tojeong_last_visit');
    
    // 오늘의 방문자 수 시드 계산 (날짜 기반 일일 방문자 자연 증가)
    let dailyBase = 1200 + (new Date().getDate() * 23) + (new Date().getHours() * 15);
    let todayVisitors = parseInt(localStorage.getItem('tojeong_today_visitors') || '0', 10);
    
    if (lastVisitDate !== todayStr || todayVisitors < dailyBase) {
        todayVisitors = dailyBase + Math.floor(Math.random() * 8);
        localStorage.setItem('tojeong_today_visitors', todayVisitors);
        localStorage.setItem('tojeong_last_visit', todayStr);
    }

    // 누적 운세 풀이 수
    let totalReadings = parseInt(localStorage.getItem('tojeong_total_readings') || '12840', 10);

    animateCounter('statTodayVisitors', todayVisitors);
    animateCounter('statTotalReadings', totalReadings);
}

function trackEvent(eventName, eventData = {}) {
    try {
        const events = JSON.parse(localStorage.getItem('tojeong_analytics_events') || '[]');
        events.push({
            event: eventName,
            data: eventData,
            timestamp: new Date().toISOString()
        });
        if (events.length > 50) events.shift();
        localStorage.setItem('tojeong_analytics_events', JSON.stringify(events));

        if (eventName === 'read_fortune' || eventName === 'read_match') {
            let total = parseInt(localStorage.getItem('tojeong_total_readings') || '12840', 10) + 1;
            localStorage.setItem('tojeong_total_readings', total);
            animateCounter('statTotalReadings', total);
        }
    } catch (e) {
        console.warn('Analytics tracking error:', e);
    }
}

function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let start = Math.max(0, targetValue - 30);
    const duration = 1200;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (targetValue - start) * easeProgress);
        
        el.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = targetValue.toLocaleString();
        }
    }

    requestAnimationFrame(update);
}

// ========================================
// 5. 운세 보기
// ========================================
async function startReading() {
    const targetYear = document.getElementById('targetYear').value;
    const rawBirthDate = document.getElementById('birthDate').value.trim();
    const calendarType = document.getElementById('calendarType').value;
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const birthHour = document.getElementById('birthHour').value;

    const validated = validateAndFormatBirthdate(rawBirthDate, '생년월일');
    if (!validated || !validated.valid) {
        showToast(validated ? validated.error : '생년월일 8자리를 입력해주세요 (예: 19950815) 🙏');
        document.getElementById('birthDate').focus();
        return;
    }
    const birthdate = validated.value;

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
        trackEvent('read_fortune', { targetYear });
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
// 6. 인연 궁합 보기
// ========================================
async function startMatchReading() {
    const rawMyBirthDate = document.getElementById('myBirthDate').value.trim();
    const myCalendarType = document.getElementById('myCalendarType').value;
    const myGenderEl = document.querySelector('input[name="myGender"]:checked');

    const rawPartnerBirthDate = document.getElementById('partnerBirthDate').value.trim();
    const partnerCalendarType = document.getElementById('partnerCalendarType').value;
    const partnerGenderEl = document.querySelector('input[name="partnerGender"]:checked');
    const relationType = document.getElementById('relationType').value;

    const myValidated = validateAndFormatBirthdate(rawMyBirthDate, '나의 생년월일');
    if (!myValidated || !myValidated.valid) {
        showToast(myValidated ? myValidated.error : '나의 생년월일 8자리를 입력해주세요 (예: 19950815) 🙏');
        document.getElementById('myBirthDate').focus();
        return;
    }
    const myBirthdate = myValidated.value;

    const partnerValidated = validateAndFormatBirthdate(rawPartnerBirthDate, '상대방 생년월일');
    if (!partnerValidated || !partnerValidated.valid) {
        showToast(partnerValidated ? partnerValidated.error : '상대방 생년월일 8자리를 입력해주세요 (예: 19970324) 🙏');
        document.getElementById('partnerBirthDate').focus();
        return;
    }
    const partnerBirthdate = partnerValidated.value;

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
    trackEvent('read_match', { relationType });

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
