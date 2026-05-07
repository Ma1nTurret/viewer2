const fileInput = document.getElementById('file-input');
const viewer = document.getElementById('viewer');
let observer; // IntersectionObserver 재사용을 위한 변수

// 파일이 선택되었을 때 실행되는 이벤트
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 1. 파일 이름순으로 정렬 (1.jpg, 2.jpg, 10.jpg 순서가 꼬이지 않도록 자연 정렬 적용)
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    // 2. 뷰어 초기화
    viewer.innerHTML = ''; 
    if (observer) observer.disconnect(); // 기존 옵저버 해제

    // 3. 화면 감지기 (Intersection Observer) 설정
    // 화면 위아래로 300% (화면 3개 크기) 만큼 미리 로딩
    observer = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '300% 0px', 
        threshold: 0
    });

    // 4. 이미지가 들어갈 뼈대(div)만 먼저 생성
    // 1000개를 만들어도 빈 div이므로 브라우저에 무리가 없습니다.
    const fragment = document.createDocumentFragment();
    
    files.forEach((file) => {
        const container = document.createElement('div');
        container.className = 'image-container';
        
        // 중요: 파일 객체 자체를 컨테이너 요소의 속성으로 저장 (나중에 불러오기 위함)
        container._file = file; 
        
        fragment.appendChild(container);
        observer.observe(container); // 감지 시작
    });

    viewer.appendChild(fragment);
});

// 화면에 들어오고 나갈 때 실행되는 함수
function handleIntersection(entries) {
    entries.forEach(entry => {
        const container = entry.target;
        const file = container._file; // 저장해둔 파일 객체 가져오기

        if (entry.isIntersecting) {
            // [화면에 들어옴] 이미지가 없으면 렌더링
            if (!container.querySelector('img')) {
                const img = document.createElement('img');
                
                // 브라우저 내부 메모리에 임시 URL 생성 (가장 중요)
                const objectURL = URL.createObjectURL(file);
                img.src = objectURL;
                
                // 이미지가 로드된 후, 컨테이너의 높이를 고정시킴
                // (이미지가 나중에 삭제되더라도 스크롤 위치가 튀지 않게 하기 위함)
                img.onload = () => {
                    container.style.height = `${img.getBoundingClientRect().height}px`;
                };

                container.appendChild(img);
            }
        } else {
            // [화면에서 벗어남] 이미지를 삭제하여 메모리 극적 절약
            const img = container.querySelector('img');
            if (img) {
                // 중요: 생성했던 임시 URL을 메모리에서 삭제 (안 하면 1000장 로드시 튕김)
                URL.revokeObjectURL(img.src); 
                img.remove();
            }
        }
    });
}