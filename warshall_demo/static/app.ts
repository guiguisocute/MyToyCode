const calcBtn = document.getElementById('calcBtn') as HTMLButtonElement;
const inputN = document.getElementById('inputN') as HTMLInputElement;
const resultArea = document.getElementById('resultArea') as HTMLDivElement;
const originalDiv = document.getElementById('originalMatrix') as HTMLDivElement;
const closureDiv = document.getElementById('closureMatrix') as HTMLDivElement;

interface ApiResponse {
    original: number[][];
    closure: number[][];
    error?: string;
}

function renderGrid(container: HTMLElement, matrix: number[][]) {
    container.innerHTML = '';
    const n = matrix.length;
    // 动态调整网格列数与宽度
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    container.style.width = `${n * 27}px`;

    matrix.forEach(row => {
        row.forEach(val => {
            const cell = document.createElement('div');
            cell.className = val === 1 ? 'cell active' : 'cell';
            cell.textContent = val.toString();
            container.appendChild(cell);
        });
    });
}

calcBtn.addEventListener('click', () => {
    const n = parseInt(inputN.value, 10);
    calcBtn.disabled = true;
    calcBtn.textContent = '计算中...';

    fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n })
    })
        .then(res => res.json())
        .then((data: ApiResponse) => {
            calcBtn.disabled = false;
            calcBtn.textContent = '生成并计算';

            if (data.error) {
                alert(data.error);
                return;
            }

            resultArea.style.display = 'flex';
            renderGrid(originalDiv, data.original);
            renderGrid(closureDiv, data.closure);
        })
        .catch(err => {
            console.error(err);
            calcBtn.disabled = false;
            calcBtn.textContent = '生成并计算';
            alert('网络错误');
        });
});
