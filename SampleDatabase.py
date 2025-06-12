import sqlite3

# Connect to a new database (creates employees.db if it doesn't exist)
conn = sqlite3.connect('employees.db')
cursor = conn.cursor()

# Create the employees table
cursor.execute('''
    CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        salary REAL,
        hire_date TEXT
    )
''')

# Insert sample data
cursor.executemany('''
    INSERT INTO employees (id, name, department, salary, hire_date) VALUES (?, ?, ?, ?, ?)
''', [
    (1, 'John Doe', 'Engineering', 75000.50, '2023-01-15'),
    (2, 'Jane Smith', 'Marketing', 65000.75, '2022-06-20'),
    (3, 'Alice Johnson', 'Engineering', 80000.00, '2021-09-10'),
    (4, 'Bob Brown', 'Sales', 60000.25, '2023-03-05'),
    (5, 'Carol White', 'Marketing', 70000.00, '2022-11-30')
])

# Commit changes and close the connection
conn.commit()
conn.close()

print("employees.db created successfully!")