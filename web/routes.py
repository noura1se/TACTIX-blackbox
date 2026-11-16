from flask import Blueprint, render_template

routes_bp = Blueprint("routes", __name__)

@routes_bp.get("/")
def home():
    return render_template("home.html")

@routes_bp.get("/configure")
def configure():
    return render_template("configure.html")

@routes_bp.get("/game")
def game():
    return render_template("game.html")

@routes_bp.get("/stats")
def stats():
    return render_template("stats.html")
