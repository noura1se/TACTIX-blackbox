from flask import Flask
from web.routes import routes_bp
from web.api import api_bp

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'blackbox_secret_key_2024'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['TEMPLATES_AUTO_RELOAD'] = True

# blueprints
app.register_blueprint(routes_bp)  # Routes for pages (/, /configure, /game, /stats)
app.register_blueprint(api_bp, url_prefix='/api')  # API endpoints 

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')