# 3×3 큐브 1타강사

초보자가 큐브의 원리를 이해하며 직접 맞추도록 돕는 웹 수업입니다.

- 꽃 만들기 → 흰 십자 → 1층 → 2층 → 노란 십자 → 노란 면 → 마지막 자리 맞추기
- 예제 큐브와 촬영한 내 큐브의 학습 상태를 각각 보관
- 단계별 3D 시범과 직접 연습, 큐브 화면의 설명 툴팁
- 6면 촬영을 위한 중심색 기준 3D 회전 안내

사진의 색상 인식과 큐브 처리는 브라우저 안에서 진행합니다. 사진을 서버로 업로드하지 않습니다. 카메라 사용에는 HTTPS와 브라우저의 카메라 권한이 필요합니다.

기준 자세는 위 노랑 · 아래 흰색 · 앞 초록 · 오른쪽 주황 · 뒤 파랑 · 왼쪽 빨강입니다. 색상 정의는 `dist/cube-colors.js`를 촬영, 3D 표시, 수업에서 함께 사용합니다.

## 실행

별도 빌드 없이 `dist/`를 정적 웹 서버로 제공하면 됩니다.

```sh
python -m http.server 4173 --directory dist
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 `dist/`를 GitHub Pages로 배포합니다.

## 검증

```sh
node tests/scan-guide.cjs
node tests/lesson-flow.cjs
```

## 사용한 라이브러리

큐브 상태 모델은 [cube.js](https://github.com/ldez/cubejs)를 사용합니다. MIT 라이선스 전문은 `dist/vendor/LICENSE`에 있습니다.
