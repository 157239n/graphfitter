from k1lib.imports import *
from flask import Flask, request, session
import secrets
from collections import deque

os.system("rm /startup/saves/*")

app = Flask(__name__)
app.config["SECRET_KEY"] = secrets.token_urlsafe(16)

class Saves:
    def __init__(self, capacity=3):
        self.capacity = capacity
        self.autoInc = k1lib.AutoIncrement()
        self.ids = deque()
    def save(self, json):
        if len(self.ids) >= self.capacity:
            os.system(f"rm /startup/saves/{self.ids.popleft()}.pth")
        if "id" not in session: session["id"] = self.autoInc()
        with open(f"/startup/saves/{session['id']}.pth", "wb") as f:
            pickle.dump(json, f)
        self.ids.append(session["id"])
    def load(self):
        if "id" in session and session["id"] in self.ids:
            with open(f"/startup/saves/{session['id']}.pth", "rb") as f:
                return pickle.load(f)
        return "{}"
saves = Saves(100)

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route("/fit", methods=["POST"])
def getState():
    json = request.json; data = json["data"]; deg = json["deg"]
    return {k: np.polyfit(*(data[k] | transpose() | deref()), deg).tolist() for k in data if len(data[k]) > 0}

@app.route("/save", methods=["POST"])
def save():
    saves.save(request.json)
    return "{}"

@app.route("/load", methods=["GET", "POST"])
def load():
    return saves.load()

app.run(host='0.0.0.0', port=5000)

