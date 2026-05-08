const fileInput = document.getElementById('file-input');
const viewer = document.getElementById('viewer');
const pageSelect = document.getElementById('page-select'); // 🌟 드롭다운 요소

let memoryObserver; // 메모리 절약용 감지기
let pageObserver;   // 현재 페이지 번호 갱신용 감지기
let createdUrls = []; 

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    createdUrls.forEach(url => URL.revokeObjectURL(url));
    createdUrls = [];

    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    viewer.innerHTML = ''; 
    pageSelect.innerHTML = ''; // 🌟 기존 드롭다운 목록 초기화
    
    if (memoryObserver) memoryObserver.disconnect();
    if (pageObserver) pageObserver.disconnect();

    // 1. 메모리 관리용 (미리 로딩)
    memoryObserver = new IntersectionObserver(handleMemory, {
        root: null,
        rootMargin: '300% 0px', 
        threshold: 0
    });

    // 2. 🌟 현재 페이지 표시용 (화면 중앙에 올 때 감지)
    pageObserver = new IntersectionObserver(handlePageUpdate, {
        root: null,
        // 화면의 중간 부분에 닿았을 때만 감지하도록 설정
        rootMargin: '-40% 0px -40% 0px', 
        threshold: 0
    });

    const fragment = document.createDocumentFragment();
    
    files.forEach((file, index) => {
        // --- 뷰어에 이미지 뼈대 추가 ---
        const container = document.createElement('div');
        container.className = 'image-container';
        container.dataset.index = index; // 인덱스 저장
        
        const url = URL.createObjectURL(file);
        createdUrls.push(url); 
        container._url = url;  
        
        fragment.appendChild(container);
        memoryObserver.observe(container);
        pageObserver.observe(container); // 페이지 감지기에 추가

        // --- 🌟 드롭다운에 페이지 번호 옵션 추가 ---
        const option = document.createElement('option');
        option.value = index; 
        option.text = index + 1; // 화면엔 1부터 보이게 함
        pageSelect.appendChild(option);
    });

    viewer.appendChild(fragment);
    
    // 파일이 로드되면 드롭다운 활성화
    pageSelect.disabled = false;
});

// 메모리 관리 (로딩 & 삭제)
function handleMemory(entries) {
    entries.forEach(entry => {
        const container = entry.target;

        if (entry.isIntersecting) {
            if (!container.querySelector('img')) {
                const img = document.createElement('img');
                img.src = container._url; 
                
                img.onload = () => {
                    container.style.height = `${img.getBoundingClientRect().height}px`;
                };

                container.appendChild(img);
            }
        } else {
            const img = container.querySelector('img');
            if (img) {
                img.src = ''; 
                img.remove(); 
            }
        }
    });
}

// 🌟 스크롤 시 현재 페이지 번호 자동 변경
function handlePageUpdate(entries) {
    entries.forEach(entry => {
        // 이미지가 화면 중앙을 차지하면 드롭다운 숫자를 해당 이미지 번호로 바꿈
        if (entry.isIntersecting) {
            const index = entry.target.dataset.index;
            pageSelect.value = index;
        }
    });
}

// 🌟 드롭다운에서 번호를 선택했을 때 해당 위치로 이동
pageSelect.addEventListener('change', (e) => {
    const targetIndex = e.target.value;
    const targetContainer = viewer.children[targetIndex];

    if (targetContainer) {
        const uiHeight = document.getElementById('ui-container').offsetHeight;
        const rect = targetContainer.getBoundingClientRect();
        
        // 이동
        window.scrollTo({
            top: window.scrollY + rect.top - uiHeight,
            behavior: 'auto' 
        });
    }
});
