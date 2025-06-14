# Reverie
Reverie is a data science automation tool designed to streamline data manipulation, analysis, and visualization tasks. Built using Electron, Reverie provides a user-friendly desktop application interface for importing, cleaning, transforming, and analyzing datasets with ease. It supports various data operations, including importing from Excel and SQL databases, performing statistical analysis, applying data transformations, and running machine learning algorithms like K-Nearest Neighbors (KNN) for predictions.
## Features
### Data Import: 
- Import datasets from Excel (.xlsx, .xls) and SQLite (.sqlite, .db) files.

### Data Manipulation:
- Add or remove rows and columns dynamically.

- Transpose tables.

- Multiply columns, square values, compute square roots, and more.

### Data Cleaning:
- Handle missing values with imputation (mean, median, mode, previous value) or row removal.

- Remove duplicate rows.

- Standardize text (trim and lowercase).

- Convert columns to numeric values.

- Capitalize or reverse text in columns.

- Apply label encoding for categorical data.

- Append or prepend strings to column values.

### Statistical Analysis:
- Compute descriptive statistics (count, sum, average, median, mode, min, max, variance, standard deviation).

- Calculate Pearson correlation between two columns.

### Machine Learning:
- Perform K-Nearest Neighbors (KNN) predictions with customizable feature selection and neighbor count.
- Perform Linear Regression with advanced options such as Lasso & Ridge.
- Perform KMeans for unsupervised learning.
  
### Interactive UI:
- Editable table for direct data input and modification.

- Context menus for quick row/column deletion.

- Dialogs for configuring data cleaning and transformation operations.

### Visualization: 
- Pie Chart
- Histogram
- Line Chart
- Regression Plot
- Bar plot
- Heatmap
  
### Cross-Platform: 
Runs on Windows, macOS, and Linux via Electron.

## Installation
To run Reverie locally, follow these steps:
### Prerequisites
- Node.js (v16 or higher recommended)

- Electron (installed via npm)

- A modern web browser for development (optional)

### Steps
- Clone the Repository:
  git clone https://github.com/Ahmed4243/GraduationProject

- Install Dependencies:
npm install

- Run the Application:
npm start

This will launch the Reverie application using Electron.

### Dependencies
The application relies on the following key libraries:
- xlsx: For Excel file parsing and import.

- sql.js: For SQLite database handling in the browser.

- Font Awesome: For icons in the UI.

- Google Fonts (Open Sans): For consistent typography.

Ensure an internet connection is available during the first run to fetch external resources (e.g., sql.js WebAssembly and Google Fonts).
### Usage
- Launch Reverie: Start the application using npm start.

- Import Data:
  - Navigate to the "Import" section in the sidebar.
  - Choose to import data from Excel, SQL, or other supported sources.

- Manipulate Data:
  -  Use the editable table to add, edit, or remove rows and columns.
  - Right-click on row numbers or column headers to access context menus for deletion.

- Clean Data:
  - Access the "Cleaning" menu in the sidebar to handle missing values, remove duplicates, standardize text, or convert data types.

- Transform Data:
  - Use the "Transformation" menu to perform operations like transposing the table, multiplying columns, or applying mathematical functions (square, square root).
  - Apply text transformations like capitalization or string appending.

- Analyze Data:
  - Select "Analysis" from the sidebar to compute descriptive statistics or correlation analysis for selected columns.

- Run Machine Learning:
  - Use the "Modeling" menu to apply KNN predictions. Select features and a target column, specify the number of neighbors (k), and generate predictions.

- Save Project Name:
  - Edit the project title at the top of the table, which is saved locally using localStorage.

### Project Structure
reverie/
- index.html        # Main HTML file with UI and logic
- index.css         # CSS styles (if separate)
- images/           # Icons and images used in the UI
- package.json      # Node.js dependencies and scripts
- main.js           # Electron main process (if applicable)
- README.md         # This file

### Development
To contribute to Reverie or extend its functionality:
- Modify the UI: Edit index.html and embedded CSS/JavaScript to add new features or improve the interface.

- Add New Features:
  - Extend the sidebar menu to include new data operations or visualization tools.
  - Integrate additional machine learning algorithms or data import formats.

- Test Changes:
  - Run npm start to test the application in Electron.
  - Use browser developer tools (F12) to debug JavaScript and inspect the DOM.

- Build for Production:
npm run build

(Ensure an appropriate build script is defined in package.json using tools like electron-builder.)

Known Issues
- PowerBI/Sample Data Import: These import options are not yet implemented.

- Error Handling: Some edge cases (e.g., invalid file formats or empty datasets) may require additional error messages or handling.

- Performance: Large datasets may slow down operations like KNN prediction or statistical calculations due to client-side processing.

### Contributing
Contributions are welcome! To contribute:
- Fork the repository.

- Create a new branch (git checkout -b feature/your-feature).

- Make your changes and commit (git commit -m "Add your feature").

- Push to your fork (git push origin feature/your-feature).

- Open a pull request with a clear description of your changes.

Please ensure your code follows the existing style and includes appropriate comments for clarity.
### License
This project is licensed under the MIT License (LICENSE). See the LICENSE file for details.
### Contact
For questions, suggestions, or issues, please open an issue on the GitHub repository or contact the maintainer at [ahmedmohammed16.am@gmail.com].
Happy data science with Reverie! 
