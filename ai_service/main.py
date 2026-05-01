from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/describe', methods=['POST'])
def describe():
    return jsonify({"suggested_title": "Sample Title", "description": "Sample description"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
