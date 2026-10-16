# 3×3 큐브 1타강사

촬영한 본인 큐브를 초보자 순서로 맞추면서, 매 동작의 이유와 결과를 배우는 웹 서비스입니다. 준비된 예제나 임의의 섞기 배치는 제공하지 않습니다.

설계 기준은 [PRD](docs/PRD.md), 작업 지시는 [구현 프롬프트](docs/IMPLEMENTATION_PROMPT.md), 조사와 검증 근거는 [기록](docs/RESEARCH_AND_VALIDATION.md)에 있습니다.

## 수업

흰 꽃 → 옆 색까지 맞춘 흰 십자 → 첫 층 코너 → 가운데 층 → 노란 십자 → 노란 면 → 마지막 코너 자리 → 마지막 변 자리 순서입니다. 이미 맞춘 실제 목표는 배치를 흐트러뜨리지 않고 건너뜁니다.

기본 화면은 내 큐브의 현재 목표, 다음 회전의 색과 방향, 이유, 돌린 뒤 확인할 모습과 이전·다음 버튼으로 구성됩니다. 사용자가 실물에 안내한 동작을 적용한 뒤 다음을 누르면 화면이 같은 회전을 적용합니다. 화면은 확인한 동작을 적용한 예상 상태이며 실제 손의 회전을 자동 추적하지 않습니다.

시범은 현재 조각의 시작 배치에서 재생한 뒤 원래 진도로 돌아옵니다. 가상 연습도 내 촬영 배치의 복사본만 사용하고, 실물 진도를 저장하는 키에 기록하지 않습니다.

여섯 면 촬영은 같은 카메라를 유지하며 다음 면으로 안내합니다. 중심 로고는 기준색으로 처리하고, 나머지 칸은 측정값으로 읽습니다. 잘못 읽힌 색은 같은 3D 큐브의 칸을 눌러 고칠 수 있습니다. 사진은 서버로 전송하지 않습니다.

위 노랑 · 아래 흰색 · 앞 초록 · 오른쪽 주황 · 뒤 파랑 · 왼쪽 빨강의 표준 배색을 사용합니다. 정의는 `dist/cube-colors.js`에서 공유합니다. 회전 방향은 돌릴 색의 중심면을 정면에서 볼 때 기준입니다.

## 개발과 검증

```sh
npm ci
npm run build
python -m http.server 4173 --directory dist
```

계획과 설명은 `dist/planner.js`, `dist/teaching.js`, 학습 상태와 이력은 `dist/lesson-flow.js`, 실제 3D 렌더러는 `src/cube3d.js`에서 관리합니다.

```sh
node tests/lesson-flow.cjs
node tests/teaching.cjs
node tests/hands-on-flow.cjs
node tests/scan-layout.cjs
node tests/webgl-geometry.cjs
```

전체 회귀 검사는 `.github/workflows/pages.yml`에 있습니다. `main`에 push하면 검사와 빌드 후 GitHub Pages로 배포합니다. 자동 검사는 실제 초보자의 교육 효과 평가와 별개입니다.

## 라이선스

[cube.js](https://github.com/ldez/cubejs)와 [Three.js](https://threejs.org/)는 MIT 라이선스를 사용합니다. 전문은 `dist/vendor/LICENSE`와 `dist/vendor/THREE-LICENSE`에 있습니다.
