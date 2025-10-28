// 인증 관련 함수들

// 현재 로그인한 사용자 정보
let currentUser = null;

// 회사명 정규화 함수 (주식회사, (주) 제거)
function normalizeCompanyName(companyName) {
    if (!companyName) return '';
    
    return companyName
        .replace(/\s*주식회사\s*/g, '')  // "주식회사" 제거
        .replace(/\s*\(주\)\s*/g, '')    // "(주)" 제거
        .replace(/\s+/g, '')             // 모든 공백 제거
        .trim();
}

// 로그인 처리
async function login(username, password) {
    try {
        // 사용자 정보 가져오기
        const response = await fetch(`tables/users?limit=100`);
        const data = await response.json();
        
        // 사용자 찾기
        const user = data.data.find(u => 
            u.username === username && u.password === password
        );
        
        if (user) {
            // 로그인 성공
            currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        } else {
            return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
}

// 로그아웃 처리
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showScreen('login');
}

// 세션 확인
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

// 사용자가 마스터인지 확인
function isMasterUser() {
    return currentUser && currentUser.role === 'master';
}

// 영인에스엔 계정이 접근 가능한 회사 목록
const YOUNGIN_SN_COMPANIES = [
    '영인과학(주)',
    '영인모빌리티(주)',
    '영인바이오젠 주식회사',
    '영인에스엔(주)',
    '영인에스티(주)',
    '영인에이티(주)',
    '영인엠텍(주)',
    '영인크로매스(주)'
];

// 영인에스엔 계정인지 확인
function isYounginSN() {
    return currentUser && currentUser.company_name === '영인에스엔(주)';
}

// 사용자가 해당 데이터에 접근 가능한지 확인
function canAccessData(dataOwner) {
    if (!currentUser) return false;
    if (isMasterUser()) return true; // 마스터는 모든 데이터 접근 가능
    
    // 회사명 정규화하여 비교
    const normalizedDataOwner = normalizeCompanyName(dataOwner);
    const normalizedUserCompany = normalizeCompanyName(currentUser.company_name);
    
    // 영인에스엔 계정은 8개 업체 데이터 모두 접근 가능
    if (isYounginSN()) {
        // 영인에스엔 관련 회사 목록도 정규화하여 비교
        const normalizedYounginCompanies = YOUNGIN_SN_COMPANIES.map(c => normalizeCompanyName(c));
        if (normalizedYounginCompanies.includes(normalizedDataOwner)) {
            return true;
        }
    }
    
    // 일반 사용자는 자신의 회사 데이터만 접근 (정규화된 이름으로 비교)
    return normalizedDataOwner === normalizedUserCompany || 
           dataOwner === currentUser.username;
}

// 화면 전환
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    if (screenName === 'login') {
        document.getElementById('loginScreen').classList.add('active');
    } else if (screenName === 'dashboard') {
        document.getElementById('dashboardScreen').classList.add('active');
        updateUserInfo();
        loadDashboard();
    }
}

// 사용자 정보 표시
function updateUserInfo() {
    if (currentUser) {
        const userInfoEl = document.getElementById('userInfo');
        const roleText = currentUser.role === 'master' ? '관리자' : '일반 사용자';
        userInfoEl.textContent = `${currentUser.company_name} (${roleText})`;
        
        // 마스터 전용 버튼 표시
        if (currentUser.role === 'master') {
            document.querySelectorAll('.btn-master-only').forEach(btn => {
                btn.style.display = 'inline-flex';
            });
        }
    }
}

// 로그인 폼 이벤트 리스너
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    
    // 로그인 시도
    const result = await login(username, password);
    
    if (result.success) {
        // 로그인 성공
        errorEl.classList.remove('show');
        showScreen('dashboard');
    } else {
        // 로그인 실패
        errorEl.textContent = result.message;
        errorEl.classList.add('show');
    }
});

// 로그아웃 버튼 이벤트 리스너
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('로그아웃 하시겠습니까?')) {
        logout();
    }
});

// 페이지 로드시 세션 확인
document.addEventListener('DOMContentLoaded', () => {
    if (checkSession()) {
        showScreen('dashboard');
    } else {
        showScreen('login');
    }
});
