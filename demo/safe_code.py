import sqlite3
import os
import subprocess
import hashlib
from pathlib import Path

# Database connection configuration from environment
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER")

# API configuration from environment
API_KEY = os.getenv("API_KEY")

def get_user_by_id(user_id):
    """Fetch user information from database by ID"""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result

def search_users(search_term):
    """Search for users by name or email"""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE name LIKE ?", (f"%{search_term}%",))
    results = cursor.fetchall()
    conn.close()
    return results

def process_user_input(user_command):
    """Execute system command based on user input (with validation)"""
    allowed_commands = ['backup', 'status', 'health']
    if user_command not in allowed_commands:
        raise ValueError("Invalid command")
    
    command_map = {
        'backup': ['python', 'backup.py'],
        'status': ['python', 'status.py'],
        'health': ['python', 'health.py']
    }
    
    result = subprocess.run(command_map[user_command], capture_output=True, text=True)
    return result.returncode

def backup_database(backup_path):
    """Create a backup of the database to specified path"""
    backup_path = Path(backup_path).resolve()
    allowed_dir = Path("/var/backups").resolve()
    
    if not str(backup_path).startswith(str(allowed_dir)):
        raise ValueError("Invalid backup path")
    
    subprocess.run(['cp', 'users.db', str(backup_path)], check=True)
    return True

def authenticate_user(username, password):
    """Authenticate user credentials"""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user is None:
        return False
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return user[0] == password_hash
