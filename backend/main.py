# Main api routes for frontend

import os
import subprocess
from subprocess import Popen, PIPE

from flask import Flask, render_template, request, jsonify

template_dir = os.path.abspath('../frontend')
static_dir = os.path.abspath('../frontend/static')
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# Index page for GET
@app.route('/')
def index():
    return render_template('index.html')

# file upload 
@app.route('/upload_file', methods = ['POST'])
def upload_file():
    file_content = request.form.get('content')
    file_name = os.path.abspath("../frontend/static/temp")
    f = open(file_name, "w")
    f.write(file_coddntent)
    return file_name

@app.route('/run_query', methods = ['POST'])
def run_query():
    query = request.form.get('query')
    target_db = request.form.get('database')

# Synthesizer api call
@app.route('/scythe', methods = ['POST'])
def synthesize():
    example = request.form.get('example')
    text_file = open("tmp", "w")
    text_file.write(example)
    text_file.close()

    p = Popen(['java', '-jar', 'Scythe.jar', 'tmp', 'StagedEnumerator', '-aggr'], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    output, err = p.communicate("")

    lines = output.splitlines()
    queries = []

    current = ""
    start_collect = False
    for line in lines:
        if "[No." in line:
            start_collect = True
            if current != "":
                queries.append(current)
            current = ""
        elif start_collect:
            current += line + "\n"
        else:
            continue
    return jsonify(queries)
