const fileInput = document.getElementById('file-input');
const viewer = document.getElementById('viewer');
let observer; 
let createdUrls = []; // 생성된 임시 URL들을 추적하기 위한 배열

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 1. 새로운 파일을 열면, 이전에 만들어둔 임시 URL들을 일괄 삭제하여 메모리 초기화
    createdUrls.forEach(url => URL.revokeObjectURL(url));
    createdUrls = [];

    // 2. 파일 이름순 정렬
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    // 3. 뷰어 초기화
    viewer.innerHTML = ''; 
    if (observer) observer.disconnect();

    // 4. 화면 위아래로 300% 여유를 두고 렌더링
    observer = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '300% 0px', 
        threshold: 0
    });

    const fragment = document.createDocumentFragment();
    
    files.forEach((file) => {
        const container = document.createElement('div');
        container.className = 'image-container';
        
        // 핵심 수정 사항: 파일을 선택한 즉시(권한이 살아있을 때) URL을 생성해 둡니다.
        const url = URL.createObjectURL(file);
        createdUrls.push(url); // 나중에 지우기 위해 배열에 저장
        container._url = url;  // 컨테이너에 URL 문자열 저장
        
        fragment.appendChild(container);
        observer.observe(container);
    });

    viewer.appendChild(fragment);
});

function handleIntersection(entries) {
    entries.forEach(entry => {
        const container = entry.target;

        if (entry.isIntersecting) {
            // [화면에 들어옴] 이미지가 없으면 렌더링
            if (!container.querySelector('img')) {
                const img = document.createElement('img');
                img.src = container._url; // 저장해둔 URL 문자열만 가져다 씀
                
                // 이미지 로딩 완료 시 컨테이너 높이 고정 (스크롤 튐 방지)
                img.onload = () => {
                    container.style.height = `${img.getBoundingClientRect().height}px`;
                };

                container.appendChild(img);
            }
        } else {
            // [화면에서 벗어남] 이미지를 삭제하여 그래픽 메모리(RAM) 절약
            const img = container.querySelector('img');
            if (img) {
                // iOS Safari 전용 해킹: src를 빈 문자열로 만들어 즉각적인 그래픽 메모리 해제 유도
                img.src = ''; 
                img.remove(); // DOM에서 태그 삭제
                // 주의: 여기서 URL.revokeObjectURL 은 호출하지 않습니다. (다시 스크롤해 올 때 써야 함)
            }
        }
    });
}
