const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const parseBtn = document.getElementById('parseBtn') as HTMLButtonElement;
const calcBtn = document.getElementById('calcBtn') as HTMLButtonElement;
const inputN = document.getElementById('inputN') as HTMLInputElement;
const matrixInput = document.getElementById('matrixInput') as HTMLTextAreaElement;
const resultArea = document.getElementById('resultArea') as HTMLDivElement;
const originalDiv = document.getElementById('originalMatrix') as HTMLDivElement;
const closureDiv = document.getElementById('closureMatrix') as HTMLDivElement;
const closureBox = document.getElementById('closureBox') as HTMLDivElement;

interface GenerateResponse {
    original: number[][];
    error?: string;
}

interface ClosureResponse {
    closure: number[][];
    error?: string;
}

let currentMatrix: number[][] = [];

// 渲染可编辑的矩阵
function renderEditableGrid(container: HTMLElement, matrix: number[][]) {
    container.innerHTML = '';
    const n = matrix.length;
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    container.style.width = `${n * 27}px`;

    matrix.forEach((row, i) => {
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = val === 1 ? 'cell active' : 'cell';
            cell.textContent = val.toString();
            cell.dataset.row = i.toString();
            cell.dataset.col = j.toString();
            
            // 点击切换 0/1
            cell.addEventListener('click', () => {
                currentMatrix[i][j] = currentMatrix[i][j] === 1 ? 0 : 1;
                cell.textContent = currentMatrix[i][j].toString();
                cell.className = currentMatrix[i][j] === 1 ? 'cell active' : 'cell';
            });
            
            container.appendChild(cell);
        });
    });
}

// 渲染只读矩阵
function renderReadonlyGrid(container: HTMLElement, matrix: number[][]) {
    container.innerHTML = '';
    const n = matrix.length;
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    container.style.width = `${n * 27}px`;

    matrix.forEach(row => {
        row.forEach(val => {
            const cell = document.createElement('div');
            cell.className = val === 1 ? 'cell active readonly' : 'cell readonly';
            cell.textContent = val.toString();
            container.appendChild(cell);
        });
    });
}

// 解析输入的矩阵字符串
function parseMatrixString(input: string): number[][] | null {
    try {
        const lines = input.trim().split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            alert('请输入矩阵数据');
            return null;
        }

        const matrix: number[][] = [];
        for (const line of lines) {
            // 支持空格、逗号、制表符分隔
            const row = line.trim().split(/[\s,]+/).map(val => {
                const num = parseInt(val, 10);
                if (num !== 0 && num !== 1) {
                    throw new Error('矩阵只能包含 0 或 1');
                }
                return num;
            });
            matrix.push(row);
        }

        // 验证是否为方阵
        const n = matrix.length;
        for (const row of matrix) {
            if (row.length !== n) {
                alert('请输入方阵（行数和列数相同）');
                return null;
            }
        }

        if (n < 2 || n > 50) {
            alert('矩阵维度必须在 2-50 之间');
            return null;
        }

        return matrix;
    } catch (error) {
        alert('解析失败: ' + (error as Error).message);
        return null;
    }
}

// 解析矩阵按钮
parseBtn.addEventListener('click', () => {
    let inputText = matrixInput.value.trim();
    
    // 如果文本框为空，使用默认示例矩阵
    if (!inputText) {
        inputText = '0 1 0\n1 0 1\n0 1 0';
        matrixInput.value = inputText;
    }
    
    const matrix = parseMatrixString(inputText);
    
    if (matrix) {
        currentMatrix = matrix;
        resultArea.style.display = 'flex';
        closureBox.style.display = 'none';
        renderEditableGrid(originalDiv, currentMatrix);
    }
});

// 生成矩阵按钮
generateBtn.addEventListener('click', () => {
    const n = parseInt(inputN.value, 10);
    if (n < 2 || n > 50) {
        alert('请输入 2-50 之间的数字');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';

    fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n })
    })
        .then(res => res.json())
        .then((data: GenerateResponse) => {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成矩阵';

            if (data.error) {
                alert(data.error);
                return;
            }

            currentMatrix = data.original;
            resultArea.style.display = 'flex';
            closureBox.style.display = 'none';
            renderEditableGrid(originalDiv, currentMatrix);
        })
        .catch(err => {
            console.error(err);
            generateBtn.disabled = false;
            generateBtn.textContent = '生成矩阵';
            alert('网络错误');
        });
});

// 计算传递闭包按钮
calcBtn.addEventListener('click', () => {
    if (currentMatrix.length === 0) {
        alert('请先生成矩阵');
        return;
    }

    calcBtn.disabled = true;
    calcBtn.textContent = '计算中...';

    fetch('/closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix: currentMatrix })
    })
        .then(res => res.json())
        .then((data: ClosureResponse) => {
            calcBtn.disabled = false;
            calcBtn.textContent = '计算传递闭包';

            if (data.error) {
                alert(data.error);
                return;
            }

            closureBox.style.display = 'block';
            renderReadonlyGrid(closureDiv, data.closure);
        })
        .catch(err => {
            console.error(err);
            calcBtn.disabled = false;
            calcBtn.textContent = '计算传递闭包';
            alert('网络错误');
        });
});
