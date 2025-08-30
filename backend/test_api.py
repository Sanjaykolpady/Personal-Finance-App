#!/usr/bin/env python3
"""
Simple test script for the Personal Finance Tracker API
Run this after starting the backend server
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_root():
    """Test the root endpoint"""
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_register():
    """Test user registration"""
    print("Testing user registration...")
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("User registered successfully!")
        user_info = response.json()
        print(f"User ID: {user_info['id']}")
        print(f"Username: {user_info['username']}")
        print(f"Email: {user_info['email']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_login():
    """Test user login"""
    print("Testing user login...")
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Login successful!")
        token_info = response.json()
        print(f"Token type: {token_info['token_type']}")
        print(f"Access token: {token_info['access_token'][:50]}...")
        return token_info['access_token']
    else:
        print(f"Error: {response.text}")
        return None

def test_create_expense(token):
    """Test creating an expense"""
    if not token:
        print("No token available, skipping expense creation test")
        return
    
    print("Testing expense creation...")
    expense_data = {
        "date": "2024-01-15",
        "amount": 150.50,
        "category": "Groceries",
        "merchant": "Supermarket",
        "note": "Weekly groceries",
        "need": True
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/expenses/", json=expense_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Expense created successfully!")
        expense = response.json()
        print(f"Expense ID: {expense['id']}")
        print(f"Amount: ₹{expense['amount']}")
        print(f"Category: {expense['category']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_get_expenses(token):
    """Test getting expenses"""
    if not token:
        print("No token available, skipping expenses retrieval test")
        return
    
    print("Testing expenses retrieval...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/expenses/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        expenses = response.json()
        print(f"Found {len(expenses)} expenses")
        for expense in expenses:
            print(f"- {expense['date']}: ₹{expense['amount']} at {expense['merchant']} ({expense['category']})")
    else:
        print(f"Error: {response.text}")
    print()

def main():
    """Run all tests"""
    print("Personal Finance Tracker API Test")
    print("=" * 40)
    print()
    
    try:
        test_health()
        test_root()
        test_register()
        token = test_login()
        test_create_expense(token)
        test_get_expenses(token)
        
        print("All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server.")
        print("Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    main()
