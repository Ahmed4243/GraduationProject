import sqlite3

# Connect to a new database (creates employees.db if it doesn't exist)
conn = sqlite3.connect('employees2.db')
cursor = conn.cursor()

# Create the employees table with additional numeric columns
cursor.execute('''
    CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        salary REAL,
        age INTEGER,
        years_of_experience REAL,
        performance_score INTEGER,
        hire_date TEXT
    )
''')

# Insert sample data with values for new columns
cursor.executemany('''
    INSERT INTO employees (id, name, department, salary, age, years_of_experience, performance_score, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', [
    (1, 'John Doe', 'Engineering', 75000.50, 30, 5.5, 85, '2023-01-15'),
    (2, 'Jane Smith', 'Marketing', 65000.75, 28, 3.2, 78, '2022-06-20'),
    (3, 'Alice Johnson', 'Engineering', 80000.00, 35, 7.8, 92, '2021-09-10'),
    (4, 'Bob Brown', 'Sales', 60000.25, 25, 2.0, 65, '2023-03-05'),
    (5, 'Carol White', 'Marketing', 70000.00, 32, 4.5, 80, '2022-11-30')
])

# Commit changes and close the connection
conn.commit()
conn.close()

print("employees.db created successfully!")