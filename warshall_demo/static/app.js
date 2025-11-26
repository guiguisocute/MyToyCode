const calcBtn = document.getElementById('calcBtn');
const inputN = document.getElementById('inputN');
const resultArea = document.getElementById('resultArea');
const originalDiv = document.getElementById('originalMatrix');
const closureDiv = document.getElementById('closureMatrix');

function renderGrid(container, matrix) {
    container.innerHTML = '';
    const n = matrix.length;
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
        .then((data) => {
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
