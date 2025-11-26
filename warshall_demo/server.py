import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
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
