import sqlite3
import os

# Database connection configuration
DB_PASSWORD = "admin123"
DB_HOST = "localhost"
DB_USER = "root"

# API configuration for external service
API_KEY = "sk-1234567890abcdefghijklmnop"

def get_user_by_id(user_id):
    """Fetch user information from database by ID"""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    result = cursor.fetchone()
    conn.close()
    return result

def search_users(search_term):
    """Search for users by name or email"""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE name LIKE '%{search_term}%'"
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return results

def process_user_input(user_command):
    """Execute system command based on user input"""
    result = os.system(user_command)
    return result

def backup_database(backup_path):
    """Create a backup of the database to specified path"""
    command = f"cp users.db {backup_path}"
    os.system(command)
    return True

def authenticate_user(username, password):
    """Authenticate user credentials"""
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()
    return user is not None
