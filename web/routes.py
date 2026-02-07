from flask import Blueprint, render_template
from web.api import api_bp

web_bp = Blueprint("web", __name__)

# Attach API blueprint under /api
web_bp.register_blueprint(api_bp, url_prefix="/api")

@web_bp.get("/")
def home():
    return render_template("home.html")

@web_bp.get("/configure")
def configure():
    return render_template("configure.html")

@web_bp.get("/game")
def game():
    return render_template("game.html")

@web_bp.get("/stats")
def stats():
    return render_template("stats.html")
