// Google Sheets CSV 데이터를 데이터베이스로 마이그레이션하는 스크립트
// 브라우저 콘솔에서 실행하세요

// CSV 데이터를 붙여넣기
const chemicalCSV = `여기에 화학물질확인 CSV 붙여넣기`;

const msdsCSV = `여기에 MSDS CSV 붙여넣기`;

const radioCSV = `여기에 전파법 CSV 붙여넣기`;

// CSV 파싱 함수
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
        // CSV 행 파싱 (따옴표 처리)
        const line = lines[i];
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        if (values.length >= headers.length - 5) { // 최소한 기본 필드가 있는지 확인
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            records.push(record);
        }
    }
    
    return records;
}

// 화학물질확인 데이터 마이그레이션
async function migrateChemicalData() {
    console.log('화학물질확인 데이터 마이그레이션 시작...');
    
    const records = parseCSV(chemicalCSV);
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
        const data = {
            spec_no: record['규격정제'] || '',
            no: record['No'] || '',
            receipt_date: record['접수일자'] || '',
            receipt_number: record['접수번호'] || '',
            status: record['상태'] || '',
            company: record['상호'] || '',
            manager: record['담당자'] || '',
            user: record['사용자'] || '',
            product_name: record['제품명'] || '',
            model_spec: record['모델ㆍ규격'] || '',
            import_country: record['수입국'] || '',
            annual_import_qty: record['연간수입예정량'] || '',
            hsk_no: record['HSK No'] || '',
            division: record['구분'] || '',
            usage: record['사용여부'] || '',
            agent: record['대리인'] || '',
            save_date: record['저장일자'] || '',
            department: record['소속'] || '',
            existing_registered: record['기존(등록)'] || '',
            existing_exempted: record['기존(면제)'] || '',
            new_registered: record['신규(등록)'] || '',
            new_exempted: record['신규(면제)'] || '',
            toxic_substance: record['유독물질'] || '',
            permitted_substance: record['허가물질'] || '',
            restricted_substance: record['제한물질'] || '',
            prohibited_substance: record['금지물질'] || '',
            accident_prep_substance: record['사고대비물질'] || '',
            importer: record['상호'] || '',
            created_by: 'migration'
        };
        
        try {
            const response = await fetch('/tables/chemical_confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                successCount++;
                console.log(`성공 (${successCount}/${records.length}): ${data.spec_no}`);
            } else {
                errorCount++;
                console.error(`실패: ${data.spec_no}`, await response.text());
            }
        } catch (error) {
            errorCount++;
            console.error(`에러: ${data.spec_no}`, error);
        }
        
        // API 부하 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n화학물질확인 마이그레이션 완료: 성공 ${successCount}, 실패 ${errorCount}`);
}

// MSDS 데이터 마이그레이션
async function migrateMsdsData() {
    console.log('MSDS 데이터 마이그레이션 시작...');
    
    const records = parseCSV(msdsCSV);
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
        const data = {
            importer: record['수입자'] || '',
            spec_no: record['규격정제'] || '',
            internal_mgmt_no: record['내부관리 No'] || '',
            substance: record['물질'] || '',
            specific_gravity: record['비중'] || '',
            existing_new: record['기존/신규(Cas)'] || record['기존/신규'] || '',
            created_by: 'migration'
        };
        
        try {
            const response = await fetch('/tables/msds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                successCount++;
                console.log(`성공 (${successCount}/${records.length}): ${data.spec_no}`);
            } else {
                errorCount++;
                console.error(`실패: ${data.spec_no}`);
            }
        } catch (error) {
            errorCount++;
            console.error(`에러: ${data.spec_no}`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nMSDS 마이그레이션 완료: 성공 ${successCount}, 실패 ${errorCount}`);
}

// 전파법 데이터 마이그레이션
async function migrateRadioData() {
    console.log('전파법/전안법 데이터 마이그레이션 시작...');
    
    const records = parseCSV(radioCSV);
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
        const data = {
            spec_no: record['규격정제'] || '',
            law: record['법령'] || '',
            consignee: record['화주'] || '',
            model_name: record['모델명'] || '',
            note: record['비고'] || '',
            manufacturer: record['제조사'] || '',
            manufacturing_country: record['제조국'] || '',
            certification_no: record['인증번호'] || '',
            certification_date: record['인증일자'] || '',
            item_name: record['품목명'] || '',
            created_by: 'migration'
        };
        
        try {
            const response = await fetch('/tables/radio_electrical_law', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                successCount++;
                console.log(`성공 (${successCount}/${records.length}): ${data.spec_no}`);
            } else {
                errorCount++;
                console.error(`실패: ${data.spec_no}`);
            }
        } catch (error) {
            errorCount++;
            console.error(`에러: ${data.spec_no}`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n전파법 마이그레이션 완료: 성공 ${successCount}, 실패 ${errorCount}`);
}

// 전체 마이그레이션 실행
async function migrateAll() {
    await migrateChemicalData();
    await migrateMsdsData();
    await migrateRadioData();
    console.log('\n모든 마이그레이션 완료!');
}

// 사용법:
// 1. 이 파일을 브라우저 콘솔에 복사
// 2. chemicalCSV, msdsCSV, radioCSV 변수에 각각 CSV 데이터 붙여넣기
// 3. migrateAll() 실행

console.log('마이그레이션 스크립트 로드 완료');
console.log('사용법:');
console.log('1. chemicalCSV 변수에 화학물질확인 CSV 데이터 붙여넣기');
console.log('2. msdsCSV 변수에 MSDS CSV 데이터 붙여넣기');
console.log('3. radioCSV 변수에 전파법 CSV 데이터 붙여넣기');
console.log('4. migrateAll() 실행');
