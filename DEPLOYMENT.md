# 배포 가이드 (DEPLOYMENT.md)

이 애플리케이션은 Google Cloud Run에 배포하고 Cloud Scheduler를 사용하여 매월 1회 법규 동기화를 자동 실행하도록 설계되었습니다.

## 1. Cloud Run 배포 방법

AI Studio 내에서 우측 상단의 "Deploy to Cloud Run" 버튼을 사용하여 바로 배포할 수 있습니다. 
배포 시 다음 환경변수를 설정해야 합니다:
- `LAW_API_BASE_URL`: 국가법령정보 API 주소
- `LAW_API_OC`: API Client ID
- `LAW_API_KEY`: API Key
- `CRON_SECRET`: Cloud Scheduler 인증에 사용할 시크릿 값

## 2. Cloud Scheduler 설정

매월 1일 오전 9시에 `/api/jobs/monthly-sync` API를 호출하여 법규 자동 수집을 실행하도록 설정합니다.

### 2.1. OIDC 서비스 계정 생성 (권장)
1. Google Cloud Console > IAM 및 관리자 > 서비스 계정으로 이동
2. `scheduler-invoker` 서비스 계정 생성
3. 배포된 Cloud Run 서비스에 해당 서비스 계정으로 "Cloud Run Invoker(호출자)" 권한 부여

### 2.2. Cloud Scheduler 작업 등록
```bash
gcloud scheduler jobs create http monthly-law-sync \
  --schedule="0 9 1 * *" \
  --time-zone="Asia/Seoul" \
  --uri="https://[YOUR_CLOUD_RUN_URL]/api/jobs/monthly-sync" \
  --http-method=POST \
  --oidc-service-account-email="scheduler-invoker@[PROJECT_ID].iam.gserviceaccount.com"
```

## 3. 실패 로그 확인 방법

- **Cloud Run 로그**: Google Cloud Console > Cloud Run > 해당 서비스 > 로그 탭에서 시스템 로그 확인
- **애플리케이션 내 이력**: 애플리케이션의 "수집 실행 이력" 메뉴에서 개별 작업의 성공/실패 여부 및 오류 내용 확인
