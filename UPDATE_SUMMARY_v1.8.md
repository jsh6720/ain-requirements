# AIN 수입요건 관리 시스템 v1.8 업데이트 요약

## 업데이트 날짜
2025-10-27

## 주요 변경사항

### 1. 표 데이터 입력 방식 변경: CSV → TSV 전용

#### 🎯 목적
Excel이나 Google Sheets에서 데이터를 복사-붙여넣을 때, 셀 안의 쉼표(,)가 열 구분자로 잘못 인식되어 열이 틀어지는 문제를 해결

#### ✅ 구현 내용

**변경 전:**
- `parseCSVTable()` 함수: 쉼표와 탭 둘 다 구분자로 처리
- 셀 안의 쉼표로 인한 열 정렬 문제 발생

**변경 후:**
- `parseTSVTable()` 함수: **탭 문자만** 구분자로 처리
- 셀 안의 쉼표는 일반 문자로 처리
- Excel/Google Sheets 복사-붙여넣기 완벽 지원

**파일별 변경:**

1. **js/app.js**
   - `parseCSVLine()` → `parseTSVLine()` (라인 903-906)
     ```javascript
     function parseTSVLine(line) {
         // 탭으로만 분리 (쉼표는 일반 문자로 처리)
         return line.split('\t').map(value => value.trim());
     }
     ```
   - `parseCSVTable()` → `parseTSVTable()` (라인 908-932)
   - 표 데이터 저장 함수에서 `parseTSVTable()` 호출 (라인 1055)
   - CSV 업로드 함수에서 `parseTSVTable()` 호출 (라인 1431)
   - 오래된 주석 제거 (라인 901)

2. **js/file-handler.js**
   - CSV 파일 업로드를 위한 별도의 `parseCSVTable()` 함수 추가 (라인 4-59)
   - **RFC 4180 준수**: 쉼표 구분자, 따옴표 처리, 이스케이프 문자 지원
     ```javascript
     function parseCSVLine(line) {
         const result = [];
         let current = '';
         let inQuotes = false;
         
         for (let i = 0; i < line.length; i++) {
             const char = line[i];
             const nextChar = line[i + 1];
             
             if (char === '"') {
                 if (inQuotes && nextChar === '"') {
                     current += '"';
                     i++;
                 } else {
                     inQuotes = !inQuotes;
                 }
             } else if (char === ',' && !inQuotes) {
                 result.push(current.trim());
                 current = '';
             } else {
                 current += char;
             }
         }
         
         result.push(current.trim());
         return result;
     }
     ```

3. **index.html**
   - 도움말 텍스트 이미 업데이트 완료 (라인 376, 378)
   - "Excel이나 Google Sheets에서 표를 복사하여 붙여넣으세요. (헤더 포함, 탭으로 자동 구분)"

#### 📋 입력 방식별 파싱 로직

| 입력 방식 | 파싱 함수 | 구분자 | 쉼표 처리 | 사용 위치 |
|---------|---------|-------|---------|---------|
| **Excel 복사-붙여넣기** | `parseTSVTable()` | 탭(\t) | 일반 문자 | app.js - 표 입력 textarea |
| **CSV 파일 업로드** | `parseCSVTable()` | 쉼표(,) | 따옴표로 처리 | file-handler.js |
| **Excel 파일 업로드** | `parseCSVTable()` | 쉼표(,) | 따옴표로 처리 | file-handler.js (SheetJS → CSV 변환 후) |

#### ✨ 사용자 경험 개선

**이전:**
```
규격정제	모델명	비고
ABC123	Model-X	AC 220V, 60Hz  ❌ (쉼표 때문에 열이 2개 더 생김)
```

**현재:**
```
규격정제	모델명	비고
ABC123	Model-X	AC 220V, 60Hz  ✅ (쉼표가 비고 필드 안에 포함됨)
```

---

### 2. 기타 파일 업데이트

#### js/file-handler.js 추가 수정
- 테이블 매핑에 `electrical` 타입 추가 (라인 486)
  ```javascript
  'radio': 'radio_law',
  'electrical': 'electrical_law',  // 추가
  'medical': 'medical_device'
  ```
- 다운로드 함수의 테이블 매핑 업데이트 (라인 485)
- 데이터 새로고침 switch문에 `electrical` 케이스 추가 (라인 459)
  ```javascript
  case 'electrical': loadElectricalData(); break;
  ```

---

## 기존 기능 요약 (v1.7 이전)

### MSDS 자동 분류 (v1.7)
- **유해**, **비고** 필드 추가
- 규격정제별 자동 혼합/단일 분류
  - **단일시약**: 유효 물질 1개 이하 OR 비중 합계 ≥ 100%
  - **혼합시약**: 유효 물질 2개 이상
  - **혼합시약(LOC)**: 유효 물질 1개 AND 비중 합계 < 100%
- 물(CAS 7732-18-5) 제외하고 계산

### 전안법 인증기관 필드 (v1.7)
- 화주 왼쪽에 **인증기관** 열 추가
- 통합 검색 결과에 인증기관 정보 표시
- 테이블 헤더 순서: 규격정제 → **인증기관** → 화주 → 모델명 → ...

### 통합 검색 기능 강화 (v1.7)
- 화학물질확인: 상호 정보 추가
- MSDS: 수입자 정보 추가
- 전파법: 화주 정보 추가
- 전안법: 인증기관 + 화주 + 비고(정격전압) 추가
- 의료기기: 수입자 정보 추가

---

## 테스트 가이드

### TSV 입력 테스트 (쉼표 안전성)

1. **Excel에서 테스트 데이터 준비**
   ```
   규격정제	모델명	비고
   TEST001	Model-A	AC 220V, 60Hz, 1000W
   TEST002	Model-B	DC 12V, 5A, 충전식
   ```

2. **복사-붙여넣기 테스트**
   - Excel/Google Sheets에서 위 표를 복사
   - 시스템의 "표 입력" 영역에 붙여넣기
   - "저장" 버튼 클릭

3. **결과 확인**
   - 비고 열에 쉼표가 포함된 전체 문자열이 올바르게 저장되어야 함
   - 열 수가 헤더와 일치해야 함
   - 데이터가 정확한 필드에 매핑되어야 함

### CSV 파일 업로드 테스트

1. **CSV 파일 생성** (쉼표 구분자)
   ```csv
   규격정제,모델명,비고
   TEST001,Model-A,"AC 220V, 60Hz, 1000W"
   TEST002,Model-B,"DC 12V, 5A, 충전식"
   ```

2. **파일 업로드**
   - 파일 업로드 버튼 클릭
   - 위 CSV 파일 선택

3. **결과 확인**
   - 따옴표로 감싸진 쉼표가 올바르게 처리되어야 함
   - 데이터가 정확하게 파싱되어야 함

---

## 파일 변경 요약

| 파일 | 변경 유형 | 주요 변경 사항 |
|-----|---------|--------------|
| **js/app.js** | 수정 | CSV → TSV 파싱 함수 변경, 함수명 변경 |
| **js/file-handler.js** | 수정 | CSV 파싱 함수 추가, 테이블 매핑 업데이트 |
| **README.md** | 수정 | v1.8 업데이트 내용 추가, 입력 방식 설명 업데이트 |

---

## 다음 단계 권장사항

1. **사용자 교육**
   - Excel/Google Sheets에서 복사-붙여넣기 방법 안내
   - 쉼표가 포함된 데이터 입력 가능함을 공지

2. **추가 테스트**
   - 다양한 특수문자 포함 데이터 테스트
   - 대량 데이터 (100+ 행) 붙여넣기 테스트
   - 다양한 브라우저 호환성 테스트

3. **모니터링**
   - 사용자 피드백 수집
   - 데이터 입력 오류 모니터링
   - 파싱 실패 케이스 로그 수집

---

## 참고 자료

### RFC 4180 (CSV 표준)
- 쉼표로 구분된 필드
- 따옴표로 감싸진 필드는 쉼표 포함 가능
- 이스케이프된 따옴표 ("") 처리

### TSV (Tab-Separated Values)
- 탭 문자(\t)로 구분된 필드
- 일반적으로 따옴표 처리 불필요
- Excel/Google Sheets 기본 복사-붙여넣기 형식

---

## 결론

v1.8 업데이트는 사용자가 보고한 **"셀 안에 있는 쉼표가 자꾸 열로 인식되는"** 문제를 완전히 해결합니다.

**핵심 개선:**
- 표 직접 입력: **TSV 전용** (쉼표 안전)
- CSV 파일 업로드: **RFC 4180 준수** (따옴표 처리)
- 각 입력 방식에 최적화된 파싱 로직 분리

이제 사용자는 Excel이나 Google Sheets에서 쉼표가 포함된 데이터를 자유롭게 복사-붙여넣기할 수 있습니다.
