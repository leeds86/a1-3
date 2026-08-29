/**
 * 토정 살롱 (Tojeong Salon) - Client Application Script
 * Vanilla JavaScript (No external framework dependencies)
 */

// ==========================================================================
// 1. 초기화 및 상태 관리
// ==========================================================================
let currentFortuneResult = null;
let currentMatchResult = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initStats();
    setupShareButtons();
    setDefaultDates();
});

// 기본 오늘 날짜 및 추천 생년월일 설정
function setDefaultDates() {
    const birthDateInput = document.getElementById('birthDate');
    const myBirthDateInput = document.getElementById('myBirthDate');
    const partnerBirthDateInput = document.getElementById('partnerBirthDate');

    if (birthDateInput && !birthDateInput.value) birthDateInput.value = '1996-05-15';
    if (myBirthDateInput && !myBirthDateInput.value) myBirthDateInput.value = '1995-03-20';
    if (partnerBirthDateInput && !partnerBirthDateInput.value) partnerBirthDateInput.value = '1997-08-12';
}

// ==========================================================================
// 2. 화면 전환 (네비게이션)
// ==========================================================================
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.target === sectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ==========================================================================
// 3. 테마 토글 (다크/라이트 모드 - 보너스 2)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('tojeong_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    if (isDark) {
        document.body.classList.add('dark');
        document.getElementById('themeToggle').textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        document.getElementById('themeToggle').textContent = '🌙';
    }

    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const currentIsDark = document.body.classList.contains('dark');
        document.getElementById('themeToggle').textContent = currentIsDark ? '☀️' : '🌙';
        localStorage.setItem('tojeong_theme', currentIsDark ? 'dark' : 'light');
        showToast(currentIsDark ? '🌙 다크 모드가 적용되었습니다.' : '☀️ 라이트 모드가 적용되었습니다.');
    });
}

// ==========================================================================
// 4. 통계 및 방문자 카운터 (보너스 2: 측정 고도화)
// ==========================================================================
function initStats() {
    let fortuneCount = parseInt(localStorage.getItem('tojeong_stat_fortune') || '1482', 10);
    let todayVisitors = parseInt(localStorage.getItem('tojeong_stat_visitors') || '328', 10);

    // 첫 방문 시 방문자 카운트 1 증가
    if (!sessionStorage.getItem('tojeong_visited')) {
        todayVisitors += 1;
        sessionStorage.setItem('tojeong_visited', 'true');
        localStorage.setItem('tojeong_stat_visitors', todayVisitors);
    }

    document.getElementById('totalFortuneCount').textContent = fortuneCount.toLocaleString();
    document.getElementById('todayVisitorCount').textContent = todayVisitors.toLocaleString();
}

function incrementFortuneStat() {
    let fortuneCount = parseInt(localStorage.getItem('tojeong_stat_fortune') || '1482', 10) + 1;
    localStorage.setItem('tojeong_stat_fortune', fortuneCount);
    document.getElementById('totalFortuneCount').textContent = fortuneCount.toLocaleString();
}

// ==========================================================================
// 5. 토스트 알림 메시지
// ==========================================================================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// ==========================================================================
// 6. FAQ 아코디언 토글
// ==========================================================================
function toggleFaq(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');
    
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    
    if (!isActive) {
        item.classList.add('active');
    }
}

// ==========================================================================
// 7. 내 운세 보기 (Fortune Reading)
// ==========================================================================
async function startReading() {
    const targetYear = document.getElementById('targetYear').value;
    const birthdate = document.getElementById('birthDate').value;
    const calendarType = document.getElementById('calendarType').value;
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const birthHour = document.getElementById('birthHour').value;

    // 1) 필수값 검증 (UX 에러 처리)
    if (!birthdate) {
        showToast('⚠️ 생년월일을 입력해주세요.');
        document.getElementById('birthDate').focus();
        return;
    }
    if (!genderEl) {
        showToast('⚠️ 성별을 선택해주세요.');
        return;
    }

    const gender = genderEl.value;
    const resultCard = document.getElementById('resultCard');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const resultContent = document.getElementById('resultContent');
    const loadingTimerMsg = document.getElementById('loadingTimerMsg');
    const readingBtn = document.getElementById('readingBtn');

    // UI 상태 전환
    resultCard.style.display = 'block';
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    resultContent.style.display = 'none';
    readingBtn.disabled = true;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // 지연 시 안내 문구 변경 (3.5초 후)
    loadingTimerMsg.textContent = '방대한 토정비결 원전과 오행 데이터를 조율 중입니다.';
    const timerId = setTimeout(() => {
        loadingTimerMsg.textContent = '⏳ 정밀 분석을 위해 깊이 있는 풀이를 생성 중입니다... (약 5~10초 소요)';
    }, 3500);

    try {
        const response = await fetch('/api/fortune', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetYear, birthdate, calendarType, gender, birthHour })
        });

        clearTimeout(timerId);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `서버 오류 (${response.status})`);
        }

        // 결과 저장 및 렌더링
        currentFortuneResult = {
            type: 'fortune',
            targetYear,
            birthdate,
            calendarType,
            gender,
            result: data.result,
            createdAt: new Date().toLocaleString()
        };

        // 로컬스토리지 히스토리 저장 (보너스 1)
        saveToHistory(currentFortuneResult);
        incrementFortuneStat();

        document.getElementById('resultTitle').textContent = `${targetYear} 사주 및 토정비결 리포트`;
        document.getElementById('resultMeta').textContent = `생년월일: ${birthdate} (${data.calendarType}) · 성별: ${data.gender}`;
        document.getElementById('resultText').innerHTML = parseMarkdownToHtml(data.result);

        loadingState.style.display = 'none';
        resultContent.style.display = 'block';
        showToast('✨ 운세 풀이가 완성되었습니다!');

    } catch (error) {
        clearTimeout(timerId);
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        document.getElementById('errorMessage').textContent = error.message || '네트워크 연결 또는 서버 응답에 문제가 발생했습니다.';
        showToast('❌ 운세 풀이 중 오류가 발생했습니다.');
    } finally {
        readingBtn.disabled = false;
    }
}

// ==========================================================================
// 8. 인연 궁합 보기 (Match Reading)
// ==========================================================================
async function startMatchReading() {
    const myBirthdate = document.getElementById('myBirthDate').value;
    const myCalendarType = document.getElementById('myCalendarType').value;
    const myGenderEl = document.querySelector('input[name="myGender"]:checked');

    const partnerBirthdate = document.getElementById('partnerBirthDate').value;
    const partnerCalendarType = document.getElementById('partnerCalendarType').value;
    const partnerGenderEl = document.querySelector('input[name="partnerGender"]:checked');
    const relationType = document.getElementById('relationType').value;

    if (!myBirthdate) {
        showToast('⚠️ 나의 생년월일을 입력해주세요.');
        document.getElementById('myBirthDate').focus();
        return;
    }
    if (!partnerBirthdate) {
        showToast('⚠️ 상대방의 생년월일을 입력해주세요.');
        document.getElementById('partnerBirthDate').focus();
        return;
    }

    const matchResultCard = document.getElementById('matchResultCard');
    const matchLoadingState = document.getElementById('matchLoadingState');
    const matchErrorState = document.getElementById('matchErrorState');
    const matchResultContent = document.getElementById('matchResultContent');
    const matchBtn = document.getElementById('matchBtn');
    const matchLoadingTimerMsg = document.getElementById('matchLoadingTimerMsg');

    matchResultCard.style.display = 'block';
    matchLoadingState.style.display = 'block';
    matchErrorState.style.display = 'none';
    matchResultContent.style.display = 'none';
    matchBtn.disabled = true;
    matchResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const timerId = setTimeout(() => {
        matchLoadingTimerMsg.textContent = '⏳ 두 분의 상호 기운과 대화법을 깊이 있게 풀이 중입니다...';
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

        clearTimeout(timerId);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `서버 오류 (${response.status})`);
        }

        currentMatchResult = {
            type: 'match',
            relationType,
            myBirthdate,
            partnerBirthdate,
            result: data.result,
            createdAt: new Date().toLocaleString()
        };

        saveToHistory(currentMatchResult);
        incrementFortuneStat();

        document.getElementById('matchResultTitle').textContent = `두 분의 [${relationType}] 인연 궁합 리포트`;
        document.getElementById('matchResultText').innerHTML = parseMarkdownToHtml(data.result);

        matchLoadingState.style.display = 'none';
        matchResultContent.style.display = 'block';
        showToast('💞 궁합 분석이 완료되었습니다!');

    } catch (error) {
        clearTimeout(timerId);
        matchLoadingState.style.display = 'none';
        matchErrorState.style.display = 'block';
        document.getElementById('matchErrorMessage').textContent = error.message || '궁합 분석 중 오류가 발생했습니다.';
        showToast('❌ 궁합 풀이에 실패했습니다.');
    } finally {
        matchBtn.disabled = false;
    }
}

// ==========================================================================
// 9. 살롱 문의 접수 (보너스 1: 운영 자동화 & 웹훅)
// ==========================================================================
async function submitInquiry() {
    const category = document.getElementById('inquiryCategory').value;
    const name = document.getElementById('inquiryName').value.trim();
    const contact = document.getElementById('inquiryContact').value.trim();
    const message = document.getElementById('inquiryMessage').value.trim();
    const inquiryBtn = document.getElementById('inquiryBtn');
    const form = document.getElementById('inquiryForm');
    const successBox = document.getElementById('inquirySuccessBox');

    if (!name || !contact || !message) {
        showToast('⚠️ 모든 필수 항목을 입력해주세요.');
        return;
    }

    inquiryBtn.disabled = true;

    try {
        const response = await fetch('/api/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, name, contact, message })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '문의 접수에 실패했습니다.');

        form.style.display = 'none';
        successBox.style.display = 'block';
        document.getElementById('inquiryIdDisplay').textContent = data.inquiryId;
        showToast('🎉 문의가 성공적으로 접수되었습니다!');

    } catch (error) {
        showToast(`❌ 오류: ${error.message}`);
    } finally {
        inquiryBtn.disabled = false;
    }
}

// ==========================================================================
// 10. 마크다운 포맷팅 (순수 바닐라 정규식 파서)
// ==========================================================================
function parseMarkdownToHtml(markdown) {
    if (!markdown) return '';
    let html = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/^---$/gim, '<hr>')
        .replace(/^\- (.*$)/gim, '<li>• $1</li>');

    const paragraphs = html.split('\n\n').map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h') || p.startsWith('<hr') || p.startsWith('<li>')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    });

    return paragraphs.filter(Boolean).join('\n');
}

// ==========================================================================
// 11. 로컬 저장소 히스토리 관리 (보너스 1: 데이터 저장 고도화)
// ==========================================================================
const HISTORY_KEY = 'tojeong_fortune_history';

function saveToHistory(item) {
    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        history.unshift(item);
        if (history.length > 20) history = history.slice(0, 20); // 최대 20개 보관
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save to history:', e);
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
    const listEl = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    if (history.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-muted);">아직 저장된 운세 기록이 없습니다. 운세를 먼저 풀어보세요!</p>';
        return;
    }

    listEl.innerHTML = history.map((item, idx) => {
        const isFortune = item.type === 'fortune';
        const title = isFortune ? `🔮 ${item.targetYear} 신년 운세 (${item.birthdate})` : `💞 [${item.relationType}] 인연 궁합 (${item.myBirthdate} & ${item.partnerBirthdate})`;
        return `
            <div class="history-item" onclick="loadHistoryItem(${idx})">
                <div class="history-item-title">${title}</div>
                <div class="history-item-meta">풀이 일시: ${item.createdAt}</div>
            </div>
        `;
    }).join('');
}

function loadHistoryItem(index) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const item = history[index];
    if (!item) return;

    toggleHistoryModal(false);

    if (item.type === 'fortune') {
        showSection('home');
        document.getElementById('resultTitle').textContent = `${item.targetYear} 사주 및 토정비결 리포트 (기록 보관본)`;
        document.getElementById('resultMeta').textContent = `생년월일: ${item.birthdate} · 풀이일시: ${item.createdAt}`;
        document.getElementById('resultText').innerHTML = parseMarkdownToHtml(item.result);
        document.getElementById('resultCard').style.display = 'block';
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('resultContent').style.display = 'block';
        document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth' });
    } else {
        showSection('match');
        document.getElementById('matchResultTitle').textContent = `두 분의 [${item.relationType}] 인연 궁합 리포트 (기록 보관본)`;
        document.getElementById('matchResultText').innerHTML = parseMarkdownToHtml(item.result);
        document.getElementById('matchResultCard').style.display = 'block';
        document.getElementById('matchLoadingState').style.display = 'none';
        document.getElementById('matchErrorState').style.display = 'none';
        document.getElementById('matchResultContent').style.display = 'block';
        document.getElementById('matchResultCard').scrollIntoView({ behavior: 'smooth' });
    }
    showToast('📂 저장된 운세 기록을 불러왔습니다.');
}

function clearAllHistory() {
    if (confirm('저장된 모든 운세 기록을 삭제하시겠습니까?')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistoryList();
        showToast('🗑️ 모든 운세 기록이 삭제되었습니다.');
    }
}

// ==========================================================================
// 12. 복사, 다운로드, 공유 액션
// ==========================================================================
function copyResultText(elementId) {
    const text = document.getElementById(elementId).innerText;
    if (!text) {
        showToast('복사할 내용이 없습니다.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 결과가 클립보드에 복사되었습니다!');
    }).catch(() => {
        showToast('복사에 실패했습니다. 수동으로 복사해주세요.');
    });
}

function downloadResultAsJSON() {
    if (!currentFortuneResult) {
        showToast('저장할 결과가 없습니다.');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentFortuneResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tojeong_fortune_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 JSON 파일로 저장되었습니다.');
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
    if (navigator.share) {
        try {
            await navigator.share({
                title: `[토정 살롱] ${title}`,
                text: `${title}\n\n${text.substring(0, 300)}...\n\n👉 토정 살롱에서 확인해보세요!`
            });
            showToast('공유창을 열었습니다.');
        } catch (e) {
            if (e.name !== 'AbortError') {
                copyResultText('resultText');
            }
        }
    } else {
        copyResultText('resultText');
    }
}
