# Reverie
Reverie is a data science automation tool designed to streamline data manipulation, analysis, and visualization tasks. Built using Electron, Reverie provides a user-friendly desktop application interface for importing, cleaning, transforming, and analyzing datasets with ease.

## Features

### Data Import & Management
- **Import**: Load datasets from Excel (.xlsx, .xls, .csv) and SQLite (.sqlite, .db) files.
- **Project I/O**: Save your entire session (data, history) to a `.reverie` file and load it back later.
- **Presets**: Start instantly with built-in datasets like Iris Classification or House Prices.

### Data Manipulation & Cleaning
- **Table Operations**: Dynamically add/remove rows and columns.
- **Missing Values**: Handle missing data by removing rows, or imputing with mean, median, mode, zero, or the previous value.
- **Deduplication**: Remove duplicate rows with a single click.
- **Text Standardization**: Clean text columns by converting to lowercase and trimming whitespace.
- **Type Conversion**: Convert columns to a numeric format.

### Data Transformation
- **Transpose**: Flip the dataset's rows and columns.
- **Feature Creation**: Create new columns by multiplying existing ones.
- **Mathematical Functions**: Apply Square, Square Root, and other functions to numeric columns.
- **Text Functions**: Capitalize, reverse, or append/prepend strings to text columns.
- **Label Encoding**: Convert categorical text data into numerical labels.

### Statistical Analysis
- **Descriptive Statistics**: Compute count, sum, mean, median, mode, min, max, variance, and standard deviation.
- **Correlation Analysis**: Calculate the Pearson correlation between two numeric columns.

### Machine Learning
- **Linear Regression**: Train a simple linear model and add a new column with predicted values.
- **Logistic Regression**: Perform binary classification and add columns for predicted probabilities and classes.
- **K-Nearest Neighbors (KNN)**: Train a KNN model and generate a new column with class predictions.
- **Gaussian Naive Bayes**: A probabilistic classifier that adds a new column with predictions.
- **K-Means Clustering**: Unsupervised learning to group data into a specified number of clusters.

### Visualization
- **Histogram**: Visualize the distribution of a numeric column.
- **Bar Chart**: Show the frequency of categories in a column.
- **Scatter Plot**: Investigate the relationship between two numeric variables.
- **Pie Chart**: Display the composition of a categorical column.

### Interactive UI
- **Editable Table**: Directly edit data in the table with pagination for large datasets.
- **History Log**: Track every transformation and analysis step performed.
- **Modern Interface**: A clean, responsive, and intuitive interface designed for a smooth workflow.

## Installation
To run Reverie locally, follow these steps:

### Prerequisites
- Node.js (v16 or higher recommended)
- npm (usually comes with Node.js)

### Steps
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Ahmed4243/GraduationProject.git
   cd GraduationProject