------



### 第一阶段：本地开发 (在你的电脑上)



假设你已经把 `MyToyCode` 仓库 clone 到了本地。我们需要整理一下文件结构。

1. 建立项目结构

在 MyToyCode 根目录下，新建一个文件夹，比如叫 warshall_demo。结构如下：

```
MyToyCode/
└── warshall_demo/
    ├── requirements.txt      <-- Python 依赖清单 (新增加)
    ├── server.py             <-- 后端代码
    └── static/
        ├── index.html        <-- 前端界面
        └── app.ts            <-- 前端逻辑
```

**2. 编写/确认代码文件**

请将之前的代码分别保存到对应文件中（这里我为你准备了包含 `requirements.txt` 的完整版本，方便你复制）：

- **`warshall_demo/requirements.txt`** (告诉服务器要装什么包):

  

  ```Plaintext
  flask
  flask-cors
  numpy
  gunicorn
  ```

- **`warshall_demo/server.py`** (NumPy 加速版):

  

  ```Python
  import numpy as np
  from flask import Flask, request, jsonify, send_from_directory
  from flask_cors import CORS
  
  app = Flask(__name__, static_folder='static')
  CORS(app)
  
  def warshall_numpy(matrix_list):
      A = np.array(matrix_list, dtype=bool)
      n = len(A)
      for k in range(n):
          A = np.logical_or(A, np.outer(A[:, k], A[k, :]))
      return A.astype(int).tolist()
  
  @app.route('/')
  def index():
      return send_from_directory('static', 'index.html')
  
  @app.route('/calculate', methods=['POST'])
  def calculate():
      data = request.json
      try:
          n = int(data.get('n', 5))
          if n > 100: 
              return jsonify({"error": "N <= 100"}), 400
          matrix_np = np.random.randint(0, 2, (n, n))
          matrix_list = matrix_np.tolist()
          closure_list = warshall_numpy(matrix_list)
          return jsonify({"original": matrix_list, "closure": closure_list})
      except Exception as e:
          return jsonify({"error": str(e)}), 500
  
  if __name__ == '__main__':
      app.run(host='0.0.0.0', port=5000)
  ```

- **`warshall_demo/static/index.html`** (内容同上一步，此处省略具体代码，记得保存进去)

- **`warshall_demo/static/app.ts`** (内容同上一步，记得保存进去)

**3. 推送到 GitHub**

在你的本地终端（Git Bash 或 VS Code 终端）执行：

Bash

```
# 确保你在 MyToyCode 目录下
git add .
git commit -m "Add Warshall algorithm demo with NumPy and TypeScript"
git push origin main
```

*(注意：如果你的主分支叫 master，请把 main 改为 master)*

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warshall 算法 (CentOS + NumPy)</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f0f2f5; }
        h1 { color: #333; }
        .controls { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: inline-block;}
        input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        
        .container { display: flex; flex-wrap: wrap; gap: 30px; margin-top: 20px; }
        .matrix-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .matrix-content { display: grid; gap: 2px; margin-top: 10px; }
        .cell { width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-size: 14px; background: #eee; }
        .cell.active { background: #4caf50; color: white; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Warshall 传递闭包生成器 (NumPy 加速版)</h1>
    <div class="controls">
        <label>矩阵维度 N: </label>
        <input type="number" id="inputN" value="5" min="2" max="50">
        <button id="calcBtn">生成并计算</button>
    </div>

    <div class="container" id="resultArea" style="display:none;">
        <div class="matrix-box">
            <h3>原始矩阵</h3>
            <div id="originalMatrix" class="matrix-content"></div>
        </div>
        <div class="matrix-box">
            <h3>传递闭包 (Transitive Closure)</h3>
            <div id="closureMatrix" class="matrix-content"></div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
```





```typescript
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
    // 使用 CSS Grid 动态布局
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    container.style.width = `${n * 27}px`; // 动态调整宽度

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
    const n = parseInt(inputN.value);
    calcBtn.disabled = true;
    calcBtn.textContent = "计算中...";

    fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: n })
    })
    .then(res => res.json())
    .then((data: ApiResponse) => {
        calcBtn.disabled = false;
        calcBtn.textContent = "生成并计算";

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
        calcBtn.textContent = "生成并计算";
        alert("网络错误");
    });
});
```



