const fileInput = document.getElementById('file-input');
const viewer = document.getElementById('viewer');
const jumpBtn = document.getElementById('jump-btn'); // 이동 버튼
let observer; 
let createdUrls = []; 

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    createdUrls.forEach(url => URL.revokeObjectURL(url));
    createdUrls = [];

    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    viewer.innerHTML = ''; 
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '300% 0px', 
        threshold: 0
    });

    const fragment = document.createDocumentFragment();
    
    files.forEach((file) => {
        const container = document.createElement('div');
        container.className = 'image-container';
        
        const url = URL.createObjectURL(file);
        createdUrls.push(url); 
        container._url = url;  
        
        fragment.appendChild(container);
        observer.observe(container);
    });

    viewer.appendChild(fragment);
});

function handleIntersection(entries) {
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

// 🌟 새로 추가된 이동(Jump) 기능
jumpBtn.addEventListener('click', () => {
    const totalImages = viewer.children.length;
    
    // 이미지를 안 불렀거나, 안내 메시지만 있는 경우
    if (totalImages === 0 || viewer.querySelector('.empty-message')) {
        alert('먼저 이미지를 불러와주세요.');
        return;
    }

    // 사용자에게 숫자 입력 받기 (ex: 50)
    const input = prompt(`이동할 이미지 번호를 입력하세요 (1 ~ ${totalImages})`);
    
    // 취소 버튼을 누르거나 빈칸인 경우 무시
    if (!input) return; 

    const targetNum = parseInt(input, 10);
    
    // 유효한 숫자인지 검사
    if (isNaN(targetNum) || targetNum < 1 || targetNum > totalImages) {
        alert('올바른 번호를 입력해주세요.');
        return;
    }

    // 배열은 0부터 시작하므로 입력한 숫자에서 1을 뺌
    const targetIndex = targetNum - 1;
    const targetContainer = viewer.children[targetIndex];

    // 상단 UI 바의 높이를 구해서, 이미지가 바에 가려지지 않게 조절
    const uiHeight = document.getElementById('ui-container').offsetHeight;
    const rect = targetContainer.getBoundingClientRect();
    
    // 즉시 해당 위치로 스크롤 이동
    window.scrollTo({
        top: window.scrollY + rect.top - uiHeight,
        behavior: 'auto' 
    });
});
