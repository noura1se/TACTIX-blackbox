from flask import Flask
from web.routes import web_bp

def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder="static",
        template_folder="templates",
    )

    # Needed if you store config in session later
    app.config["SECRET_KEY"] = "tactix-blackbox-dev-secret"

    app.register_blueprint(web_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)
