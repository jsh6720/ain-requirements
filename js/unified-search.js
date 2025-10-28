// 통합 검색 기능
// Version: 2.2.1 - Fixed searchRadioData error

// 법령부호 매핑 함수
function getLawCode(lawName) {
    const lawMapping = {
        '가축전염병예방법': '13',
        '의료기기법': '72',
        '전파법': '39',
        '인체조직법': '74',
        '어린이제품특별법': '88',
        '수입식품안전관리 특별법': '89',
        '수입식품안전관리특별법': '89',
        '전안법': '23',
        '원안법': '53',
        '약사법': '01',
        '사료관리법': '10',
        '식물방역법': '12',
        '화생무기금지법': '27',
        '방위사업법': '34',
        '유해화학물질관리법': '41',
        '먹는물관리법': '44',
        '산업안전보건법': '48',
        '총포도검법': '55',
        '에너지이용합리화법': '64',
        '마약류관리법': '69',
        '화장품법': '70',
        '야생동식물보호법': '71',
        '통신비밀보호법': '75',
        '석면안전관리법': '81',
        '생활주변방사선법': '86',
        '생활살생물제법': '87',
        '위생용품관리법': '94'
    };
    
    // 법령명에서 키워드 검색 (부분 일치)
    for (const [key, code] of Object.entries(lawMapping)) {
        if (lawName && lawName.includes(key)) {
            return code;
        }
    }
    
    return '-';
}

// 통합 검색 실행
async function performUnifiedSearch() {
    const searchInput = document.getElementById('unifiedSearch');
    const searchValue = searchInput.value.trim();
    
    if (!searchValue) {
        alert('규격정제를 입력해주세요.');
        return;
    }
    
    const resultDiv = document.getElementById('unifiedSearchResult');
    resultDiv.innerHTML = '<div class="unified-result-empty"><i class="fas fa-spinner fa-spin"></i> 검색 중...</div>';
    
    try {
        // 모든 테이블에서 데이터 조회 (확인필요 리스트 포함)
        const [chemicalData, msdsData, radioData, electricalData, medicalData, nonTargetData, reviewNeededData] = await Promise.all([
            searchInTable('chemical_confirmation', searchValue),
            searchInTable('msds', searchValue),
            searchInTable('radio_law', searchValue),
            searchInTable('electrical_law', searchValue),
            searchInTable('medical_device', searchValue),
            searchInTable('non_target', searchValue),
            searchInTable('review_needed', searchValue)
        ]);
        
        // 결과 표시
        displayUnifiedSearchResult({
            chemical: chemicalData,
            msds: msdsData,
            radio: radioData,
            electrical: electricalData,
            medical: medicalData,
            nonTarget: nonTargetData,
            reviewNeeded: reviewNeededData
        }, searchValue);
        
    } catch (error) {
        console.error('통합 검색 오류:', error);
        resultDiv.innerHTML = '<div class="unified-result-empty"><i class="fas fa-exclamation-triangle"></i> 검색 중 오류가 발생했습니다.</div>';
    }
}

// 특정 테이블에서 규격정제로 검색
async function searchInTable(tableName, searchValue) {
    try {
        const response = await fetch(`tables/${tableName}?limit=1000`);
        if (!response.ok) return [];
        
        const result = await response.json();
        let data = Array.isArray(result) ? result : (result.data || []);
        
        // 대소문자 무시 검색을 위한 소문자 변환
        const searchLower = searchValue.toLowerCase();
        
        // 테이블별 검색 로직
        if (tableName === 'radio_law' || tableName === 'electrical_law') {
            // 전파법/전안법: 규격정제 + 모델명 + 파생모델명에서 검색
            const filtered = data.filter(item => 
                (item.spec_no && item.spec_no.toLowerCase().includes(searchLower)) ||
                (item.model_name && item.model_name.toLowerCase().includes(searchLower)) ||
                (item.derived_model_name && item.derived_model_name.toLowerCase().includes(searchLower))
            );
            console.log(`${tableName} 검색 결과:`, filtered.length, '건', '(검색어:', searchValue + ')');
            return filtered;
        } else {
            // 기타 테이블: 규격정제에서만 검색
            const filtered = data.filter(item => item.spec_no && item.spec_no.toLowerCase().includes(searchLower));
            console.log(`${tableName} 검색 결과:`, filtered.length, '건', '(검색어:', searchValue + ')');
            return filtered;
        }
    } catch (error) {
        console.error(`${tableName} 검색 오류:`, error);
        return [];
    }
}

// 통합 검색 결과 표시
function displayUnifiedSearchResult(results, searchValue) {
    const resultDiv = document.getElementById('unifiedSearchResult');
    
    const totalCount = results.chemical.length + results.msds.length + 
                      results.radio.length + results.electrical.length + results.medical.length +
                      (results.nonTarget ? results.nonTarget.length : 0) +
                      (results.reviewNeeded ? results.reviewNeeded.length : 0);
    
    if (totalCount === 0) {
        resultDiv.innerHTML = `
            <div class="unified-result-empty">
                <i class="fas fa-search"></i>
                <p>"${searchValue}"에 대한 검색 결과가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="unified-result-card">
            <div class="unified-result-header">
                <i class="fas fa-list-check"></i> "${searchValue}" 검색 결과 (총 ${totalCount}건)
            </div>
            <div class="unified-result-grid">
    `;
    
    // 화학물질확인
    html += generateResultItem(
        '화학물질확인',
        'fas fa-flask',
        results.chemical.length > 0,
        results.chemical.length > 0 ? {
            수입자: results.chemical.map(r => r.company).filter((v, i, a) => a.indexOf(v) === i).join(', '),
            건수: `${results.chemical.length}건`
        } : null,
        'chemical'
    );
    
    // MSDS
    html += generateResultItem(
        'MSDS 등록/신고',
        'fas fa-file-medical',
        results.msds.length > 0,
        results.msds.length > 0 ? {
            수입자: results.msds.map(r => r.importer).filter((v, i, a) => a.indexOf(v) === i).join(', '),
            건수: `${results.msds.length}건`
        } : null,
        'msds'
    );
    
    // 전파법
    html += generateResultItem(
        '전파법',
        'fas fa-broadcast-tower',
        results.radio.length > 0,
        results.radio.length > 0 ? {
            화주: results.radio.map(r => r.consignee).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            인증번호: results.radio.map(r => r.certification_no).filter(v => v).join(', '),
            건수: `${results.radio.length}건`
        } : null,
        'radio'
    );
    
    // 전안법
    html += generateResultItem(
        '전안법',
        'fas fa-plug',
        results.electrical.length > 0,
        results.electrical.length > 0 ? {
            인증기관: results.electrical.map(r => r.certification_agency).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            화주: results.electrical.map(r => r.consignee).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            인증번호: results.electrical.map(r => r.certification_no).filter(v => v).join(', '),
            '비고(정격전압)': results.electrical.map(r => r.note).filter(v => v).join(', '),
            건수: `${results.electrical.length}건`
        } : null,
        'electrical'
    );
    
    // 의료기기/원안법 등
    html += generateResultItem(
        '의료기기/원안법 등',
        'fas fa-notes-medical',
        results.medical.length > 0,
        results.medical.length > 0 ? {
            법령부호: results.medical.map(r => r.law_code || getLawCode(r.law)).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            법령: results.medical.map(r => r.law).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            수입자: results.medical.map(r => r.importer).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            '확인 여부': results.medical.map(r => r.confirmation_status).filter(v => v).join(', '),
            건수: `${results.medical.length}건`
        } : null,
        'medical'
    );
    
    // 비대상
    html += generateResultItem(
        '비대상',
        'fas fa-times-circle',
        results.nonTarget && results.nonTarget.length > 0,
        results.nonTarget && results.nonTarget.length > 0 ? {
            법령부호: results.nonTarget.map(r => r.law_code || getLawCode(r.law)).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            법령: results.nonTarget.map(r => r.law).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            수입자: results.nonTarget.map(r => r.importer).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            수출자: results.nonTarget.map(r => r.exporter).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            '비대상 사유': results.nonTarget.map(r => r.non_target_reason).filter(v => v).join(', '),
            건수: `${results.nonTarget.length}건`
        } : null,
        'non_target'
    );
    
    // 확인 필요 List
    html += generateResultItem(
        '확인 필요 List',
        'fas fa-exclamation-triangle',
        results.reviewNeeded && results.reviewNeeded.length > 0,
        results.reviewNeeded && results.reviewNeeded.length > 0 ? {
            수입자상호: results.reviewNeeded.map(r => r.importer).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            해외공급처: results.reviewNeeded.map(r => r.exporter).filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
            비고: results.reviewNeeded.map(r => r.note).filter(v => v).join(', '),
            건수: `${results.reviewNeeded.length}건`
        } : null,
        'review_needed'
    );
    
    html += `
            </div>
        </div>
    `;
    
    resultDiv.innerHTML = html;
}

// 개별 결과 아이템 생성
function generateResultItem(title, icon, hasData, details, dataType) {
    const clickableClass = hasData ? 'clickable' : '';
    const onclickAttr = hasData ? `onclick="navigateToSection('${dataType}')"` : '';
    
    let html = `
        <div class="result-item ${hasData ? 'has-data' : ''} ${clickableClass}" ${onclickAttr}>
            <div class="result-item-header">
                <div class="result-item-title">
                    <i class="${icon}"></i> ${title}
                </div>
                <div class="result-status ${hasData ? 'registered' : 'not-registered'}">
                    ${hasData ? 'O' : 'X'}
                </div>
            </div>
    `;
    
    if (hasData && details) {
        html += '<div class="result-item-details">';
        for (const [key, value] of Object.entries(details)) {
            if (value) {
                html += `<div><strong>${key}:</strong> ${value}</div>`;
            }
        }
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// 통합검색에서 섹션으로 이동
function navigateToSection(dataType) {
    // 검색어 저장
    const searchValue = document.getElementById('unifiedSearch').value.trim();
    
    // 섹션 매핑
    const sectionMap = {
        'chemical': 'chemicalSection',
        'msds': 'msdsSection',
        'radio': 'radioSection',
        'electrical': 'electricalSection',
        'medical': 'medicalSection',
        'non_target': 'nonTargetSection',
        'review_needed': 'review_neededSection'
    };
    
    const sectionId = sectionMap[dataType];
    if (!sectionId) return;
    
    // 메뉴 클릭 (섹션 표시)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('data-section') === sectionId) {
            item.click();
        }
    });
    
    // 해당 섹션의 검색창에 검색어 입력 및 검색 실행
    setTimeout(() => {
        const searchInputMap = {
            'chemical': 'chemicalSearch',
            'msds': 'msdsSearch',
            'radio': 'radioSearch',
            'electrical': 'electricalSearch',
            'medical': 'medicalSearch',
            'non_target': 'non_targetSearch',
            'review_needed': 'reviewNeededSearch'
        };
        
        const searchInputId = searchInputMap[dataType];
        const searchInput = document.getElementById(searchInputId);
        
        if (searchInput) {
            searchInput.value = searchValue;
            searchInput.focus();
            
            // 검색 함수 실행
            if (dataType === 'review_needed') {
                // review_needed는 별도 함수 사용
                searchReviewNeeded();
            } else {
                // 나머지는 searchData 함수 사용
                searchData(dataType);
            }
        }
    }, 100);
}

// 엔터키로 통합 검색
document.addEventListener('DOMContentLoaded', () => {
    const unifiedSearchInput = document.getElementById('unifiedSearch');
    if (unifiedSearchInput) {
        unifiedSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performUnifiedSearch();
            }
        });
    }
});

// 통합 다운로드 기능 제거됨 (성능 이슈로 인해 삭제)
