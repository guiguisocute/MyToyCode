var generateBtn = document.getElementById('generateBtn');
var parseBtn = document.getElementById('parseBtn');
var calcBtn = document.getElementById('calcBtn');
var inputN = document.getElementById('inputN');
var matrixInput = document.getElementById('matrixInput');
var resultArea = document.getElementById('resultArea');
var originalDiv = document.getElementById('originalMatrix');
var closureDiv = document.getElementById('closureMatrix');
var closureBox = document.getElementById('closureBox');
var currentMatrix = [];
// 渲染可编辑的矩阵
function renderEditableGrid(container, matrix) {
    container.innerHTML = '';
    var n = matrix.length;
    container.style.gridTemplateColumns = "repeat(".concat(n, ", 1fr)");
    container.style.width = "".concat(n * 27, "px");
    matrix.forEach(function (row, i) {
        row.forEach(function (val, j) {
            var cell = document.createElement('div');
            cell.className = val === 1 ? 'cell active' : 'cell';
            cell.textContent = val.toString();
            cell.dataset.row = i.toString();
            cell.dataset.col = j.toString();
            // 点击切换 0/1
            cell.addEventListener('click', function () {
                currentMatrix[i][j] = currentMatrix[i][j] === 1 ? 0 : 1;
                cell.textContent = currentMatrix[i][j].toString();
                cell.className = currentMatrix[i][j] === 1 ? 'cell active' : 'cell';
            });
            container.appendChild(cell);
        });
    });
}
// 渲染只读矩阵
function renderReadonlyGrid(container, matrix) {
    container.innerHTML = '';
    var n = matrix.length;
    container.style.gridTemplateColumns = "repeat(".concat(n, ", 1fr)");
    container.style.width = "".concat(n * 27, "px");
    matrix.forEach(function (row) {
        row.forEach(function (val) {
            var cell = document.createElement('div');
            cell.className = val === 1 ? 'cell active readonly' : 'cell readonly';
            cell.textContent = val.toString();
            container.appendChild(cell);
        });
    });
}
// 解析输入的矩阵字符串
function parseMatrixString(input) {
    try {
        var lines = input.trim().split('\n').filter(function (line) { return line.trim(); });
        if (lines.length === 0) {
            alert('请输入矩阵数据');
            return null;
        }
        var matrix = [];
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            // 支持空格、逗号、制表符分隔
            var row = line.trim().split(/[\s,]+/).map(function (val) {
                var num = parseInt(val, 10);
                if (num !== 0 && num !== 1) {
                    throw new Error('矩阵只能包含 0 或 1');
                }
                return num;
            });
            matrix.push(row);
        }
        // 验证是否为方阵
        var n = matrix.length;
        for (var _a = 0, matrix_1 = matrix; _a < matrix_1.length; _a++) {
            var row = matrix_1[_a];
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
    }
    catch (error) {
        alert('解析失败: ' + error.message);
        return null;
    }
}
// 解析矩阵按钮
parseBtn.addEventListener('click', function () {
    var inputText = matrixInput.value.trim();
    // 如果文本框为空，使用默认示例矩阵
    if (!inputText) {
        inputText = '0 1 0\n1 0 1\n0 1 0';
        matrixInput.value = inputText;
    }
    var matrix = parseMatrixString(inputText);
    if (matrix) {
        currentMatrix = matrix;
        resultArea.style.display = 'flex';
        closureBox.style.display = 'none';
        renderEditableGrid(originalDiv, currentMatrix);
    }
});
// 生成矩阵按钮
generateBtn.addEventListener('click', function () {
    var n = parseInt(inputN.value, 10);
    if (n < 2 || n > 50) {
        alert('请输入 2-50 之间的数字');
        return;
    }
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
    fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: n })
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
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
        .catch(function (err) {
        console.error(err);
        generateBtn.disabled = false;
        generateBtn.textContent = '生成矩阵';
        alert('网络错误');
    });
});
// 计算传递闭包按钮
calcBtn.addEventListener('click', function () {
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
        .then(function (res) { return res.json(); })
        .then(function (data) {
        calcBtn.disabled = false;
        calcBtn.textContent = '计算传递闭包';
        if (data.error) {
            alert(data.error);
            return;
        }
        closureBox.style.display = 'block';
        renderReadonlyGrid(closureDiv, data.closure);
    })
        .catch(function (err) {
        console.error(err);
        calcBtn.disabled = false;
        calcBtn.textContent = '计算传递闭包';
        alert('网络错误');
    });
});
