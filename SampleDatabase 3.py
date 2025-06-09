import sqlite3

# Connect to a new database (creates employees2.db if it doesn't exist)
conn = sqlite3.connect('employees3.db')
cursor = conn.cursor()

# Drop the table if it already exists (to re-run without errors)
cursor.execute('DROP TABLE IF EXISTS employees')

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

# Insert sample data with some missing values (None)
cursor.executemany('''
    INSERT INTO employees (id, name, department, salary, age, years_of_experience, performance_score, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', [
    (1, 'John Doe', 'Engineering', 75000.50, 30, 5.5, 85, '2023-01-15'),
    (2, 'Jane Smith', 'Marketing', 65000.75, 28, 3.2, 78, '2022-06-20'),
    (3, 'Alice Johnson', 'Engineering', 80000.00, 35, 7.8, 92, '2021-09-10'),
    (4, 'Bob Brown', 'Sales', 60000.25, 25, 2.0, 65, '2023-03-05'),
    (5, 'Carol White', 'Marketing', 70000.00, 32, 4.5, 80, '2022-11-30'),
    (6, 'David Clark', 'HR', 55000.00, 29, None, 70, '2023-02-14'),
    (7, 'Eva Adams', None, 72000.00, 31, 6.0, 88, '2021-07-01'),
    (8, 'Frank Wright', 'Engineering', None, 27, 3.5, 76, '2022-08-18'),
    (9, 'Grace Hill', 'Sales', 58000.00, None, 1.8, 63, '2023-05-22'),
    (10, 'Hank Miller', 'Marketing', 69000.00, 34, 5.0, None, '2022-04-10'),
    (11, 'Isabel Turner', 'HR', 62000.00, 30, 4.2, 82, None),
    (12, 'Jake Barnes', 'Engineering', 81000.00, 36, 8.0, 95, '2020-12-01'),
    (13, 'Kelly Green', 'Sales', 59000.00, 26, 2.3, 67, '2023-07-15'),
    (14, 'Liam Scott', 'Engineering', 76000.00, 33, 6.5, 89, '2021-03-21'),
    (15, 'Mona Lee', 'Marketing', None, 29, 3.8, 74, '2022-10-05')
])

# Commit changes and close the connection
conn.commit()
conn.close()

print("employees3.db created successfully with 15 employees including missing values!")
