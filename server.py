from flask import Flask, jsonify, request
from flask_cors import CORS
import ast

app = Flask(__name__)
CORS(app)

@app.route('/api', methods=['POST', 'OPTIONS'])
def receive_data():
    if request.method == 'OPTIONS':
        # 这个分支只会处理 OPTIONS 请求
        return ('', 204)

    data = request.get_json()
    print('Data received: ', data)

    code = data.get('code')  # 假设前端发送的代码保存在字段 'code' 中

    # 验证代码的语法
    try:
        ast.parse(code)
    except SyntaxError as e:
        error_response = {
            'message': 'Syntax Error',
            'error_details': str(e)
        }
        return jsonify(error_response), 400

    # 运行代码
    try:
        # 在一个安全的沙箱环境中执行代码
        locals_dict = {}
        exec(code, {}, locals_dict)

        # 从执行结果中获取需要返回给前端的数据
        result = locals_dict.get('result')

        # 构建响应数据
        response_data = {
            'message': 'Code executed successfully',
            'result': result
        }
        return jsonify(response_data), 200
    except Exception as e:
        error_response = {
            'message': 'Code execution error',
            'error_details': str(e)
        }
        return jsonify(error_response), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)