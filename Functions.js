document.addEventListener('DOMContentLoaded', () => {

    // --- APP STATE & CONFIG ---
    let fullDataset = { headers: [], rows: [] };
    let pagination = { currentPage: 1, rowsPerPage: 50, totalPages: 1 };
    let currentDialog = null;
    let currentActionElement = null;
    let columnAction = {};
    const presets = {
        'house-prices': { projectName: 'House Price Prediction', headers: ['Area_sqft', 'Bedrooms', 'Bathrooms', 'Price_USD'], rows: [[1400, 3, 2, 350000], [1600, 3, 2.5, 400000], [2100, 4, 3, 520000], [1200, 2, 1.5, 280000], [1800, 4, 2, 450000], [2400, 5, 3.5, 600000]] },
        'iris-classification': { projectName: 'Iris Flower Classification', headers: ['SepalLengthCm', 'SepalWidthCm', 'PetalLengthCm', 'PetalWidthCm', 'Species'], rows: [[5.1, 3.5, 1.4, 0.2, 'Iris-setosa'], [7.0, 3.2, 4.7, 1.4, 'Iris-versicolor'], [6.3, 3.3, 6.0, 2.5, 'Iris-virginica']] },
        'customer-churn': { projectName: 'Customer Churn Analysis', headers: ['CustomerID', 'Gender', 'Age', 'MonthlyBill', 'TotalUsageGB', 'Churn'], rows: [[1, 'Male', 34, 65.5, 80, 'No'], [2, 'Female', 25, 55.0, 50, 'No'], [3, 'Female', 45, 89.9, 200, 'Yes'], [4, 'Male', 50, 95.0, 450, 'No']] }
    };

    // --- DOM ELEMENT REFERENCES ---
    const mainContent = document.getElementById('mainContentArea');
    const historyLog = document.querySelector('.history-log');
    const imputationTypeSelection = document.getElementById('imputationTypeSelection');
    const missingImputeRadio = document.getElementById('missingImpute');
    const missingRemoveRadio = document.getElementById('missingRemove');
    const missingZeroRadio = document.getElementById('missingZero');
    // --- UX FUNCTIONS ---
    function logToHistory(message, type = 'info') {
        if (!historyLog) return;
        const li = document.createElement('li');
        let icon;
        switch(type) {
            case 'success': icon = '✅'; break;
            case 'error': icon = '❌'; break;
            case 'transform': icon = '✨'; break;
            default: icon = 'ℹ️'; break;
        }
        li.innerHTML = `<span class="log-icon" title="${type}">${icon}</span> ${message}`;
        li.classList.add(`log-${type}`);
        historyLog.prepend(li);
    }
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // --- PAGINATION & TABLE RENDERING ---
    function renderTablePage() {
        const tableBody = document.querySelector('#dynamicTable tbody');
        const pageInfo = document.getElementById('page-info');
        if (!tableBody || !pageInfo) return;

        tableBody.innerHTML = '';
        const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
        const end = start + pagination.rowsPerPage;
        const pageRows = fullDataset.rows.slice(start, end);

        pageRows.forEach((rowData, index) => {
            const row = tableBody.insertRow();
            const rowNumCell = row.insertCell();
            rowNumCell.className = 'row-number';
            rowNumCell.textContent = start + index + 1;

            fullDataset.headers.forEach((_, colIndex) => {
                const cell = row.insertCell();
                cell.textContent = rowData[colIndex] ?? '';
                cell.contentEditable = true;
                
                cell.addEventListener('blur', (e) => {
                    const actualRowIndex = start + index;
                    fullDataset.rows[actualRowIndex][colIndex] = e.target.textContent;
                });
            });
        });

        pagination.totalPages = Math.max(1, Math.ceil(fullDataset.rows.length / pagination.rowsPerPage));
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        document.getElementById('pagination-controls').style.display = fullDataset.rows.length > pagination.rowsPerPage ? 'flex' : 'none';
    }

    function setupTable(headers, dataRows, projectName = "Untitled Project") {
        fullDataset.headers = headers;
        fullDataset.rows = dataRows;
        pagination.currentPage = 1;

        const tableHead = document.querySelector('#dynamicTable thead');
        tableHead.innerHTML = '';
        const headerRow = tableHead.insertRow();
        headerRow.insertCell().className = 'row-number';
        headers.forEach((headerText, index) => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.dataset.colIndex = index;
            th.contentEditable = true;
            
            th.addEventListener('blur', (e) => {
                fullDataset.headers[index] = e.target.textContent;
                updateAllSelects();
            });
            
            headerRow.appendChild(th);
        });

        renderTablePage();

        document.getElementById('importSection').style.display = 'none';
        document.getElementById('dataframeSection').style.display = 'flex';
        document.querySelector('.project-title').textContent = projectName;
        
        updateAllSelects();
        logToHistory(`Loaded table with ${fullDataset.rows.length} rows.`, 'success');
    }

    function addTableRow() {
        const newRow = new Array(fullDataset.headers.length).fill('');
        fullDataset.rows.push(newRow);
        pagination.totalPages = Math.max(1, Math.ceil(fullDataset.rows.length / pagination.rowsPerPage));
        pagination.currentPage = pagination.totalPages; // Go to the last page to see the new row
        renderTablePage();
        logToHistory('Added new row', 'transform');
    }

    function updateRowNumbers() {
        const tableBody = document.querySelector('#dynamicTable tbody');
        if (!tableBody) return;
        const rows = tableBody.querySelectorAll('tr');
        const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
        rows.forEach((row, index) => {
            const rowNumCell = row.querySelector('.row-number');
            if (rowNumCell) {
                rowNumCell.textContent = start + index + 1;
            }
        });
    }

    // --- DATA & UI HELPERS ---
    function getTableData() { return fullDataset; }
    
   function getColumnData(colIndex, numericOnly = false) {
     if (colIndex < 0 || colIndex >= fullDataset.headers.length) return [];
     const data = [];
     for (const row of fullDataset.rows) {
         const value = row[colIndex]; // Get the raw value from the dataset
         
         // Check for explicit missing indicators (null, undefined, empty string, "nan", "na")
         if (value === null || value === undefined || String(value).trim() === '' || String(value).toLowerCase() === 'nan' || String(value).toLowerCase() === 'na') {
             data.push(null); // Treat these as null/missing
         } else if (numericOnly) {
             const num = parseFloat(String(value).trim()); // Attempt to parse to float
             data.push(isNaN(num) ? null : num); // If not a valid number, push null, otherwise push the number
         } else {
             data.push(String(value).trim()); // For non-numeric, push the trimmed string
         }
     }
     // Filter out nulls only if numericOnly is true, to ensure only numbers are returned for calculation
     return numericOnly ? data.filter(d => d !== null) : data;
 }

    function updateAllSelects() {
        const { headers } = getTableData();
        document.querySelectorAll('select.column-select').forEach(select => {
            // Exclude the 'imputationType' select from being populated with column headers
            if (select.id === 'imputationType') {
                // These options are already hardcoded in newProject.html, no need to re-add them here
                // if they are always static. If you want dynamic updates or to ensure they are present,
                // you could re-add them here:
                // select.innerHTML = ''; // Clear existing options if dynamic
                // select.add(new Option('Mean', 'mean'));
                // select.add(new Option('Median', 'median'));
                // select.add(new Option('Mode', 'mode'));
                // select.add(new Option('Previous Value', 'previous'));
                return; // Skip further processing for this specific select
            }

            const selectedValues = Array.from(select.selectedOptions).map(opt => opt.value);
            select.innerHTML = '';
            const numericOnly = select.classList.contains('numeric-only');
            
            headers.forEach((header, index) => {
                const option = new Option(header, index);
                if (numericOnly) {
                    if (getColumnData(index, true).some(v => v !== null)) {
                        select.appendChild(option);
                    }
                } else {
                    select.appendChild(option);
                }
            });
            
            Array.from(select.options).forEach(opt => {
                if(selectedValues.includes(opt.value)) opt.selected = true;
            });
        });
    }
    function showDialog(dialogId, actionElement) {
        hideAllDialogs();
        currentDialog = document.getElementById(dialogId);
        if (!currentDialog) return;
        
        updateAllSelects();

        if (actionElement) {
            document.querySelectorAll('.popup-menu a.active').forEach(el => el.classList.remove('active'));
            currentActionElement = actionElement;
            currentActionElement.classList.add('active');
        }
        document.querySelector('.dialog-backdrop').style.display = 'block';
        currentDialog.style.display = 'flex';
        
        // Special logic for KNN dialog to populate inputs on open
        if (dialogId === 'knnDialog') {
            populateKnnInputs();
        }
        // Special logic for missing values dialog to show/hide imputation options
        if (dialogId === 'missingValuesDialog') {
            const selectedAction = document.querySelector('input[name="missingAction"]:checked')?.value;
            imputationTypeSelection.style.display = (selectedAction === 'impute') ? 'block' : 'none';
        }
    }

    function hideAllDialogs() {
        document.querySelector('.dialog-backdrop').style.display = 'none';
        document.querySelectorAll('.dialog').forEach(d => d.style.display = 'none');
        if (currentActionElement) currentActionElement.classList.remove('active');
        currentDialog = null; currentActionElement = null;
    }
    
    function createAnalysisCard(title) {
        const card = document.createElement('div');
        card.className = 'analysis-card';
        card.innerHTML = `<div class="card-header"><h3>${title}</h3><button class="card-close-btn">×</button></div>`;
        card.querySelector('.card-close-btn').addEventListener('click', () => card.remove());
        document.getElementById('cards-container').prepend(card);
        return card;
    }

    function createChart(card, chartType, data, options) {
        const canvas = document.createElement('canvas');
        card.appendChild(canvas);
        new Chart(canvas, { type: chartType, data, options });
    }

    function calculateStats(data) {
        const numericData = data.filter(d => typeof d === 'number' && !isNaN(d)).sort((a, b) => a - b);
        if (numericData.length === 0) return null;
        const sum = numericData.reduce((acc, val) => acc + val, 0);
        const mean = sum / numericData.length;
        const mid = Math.floor(numericData.length / 2);
        const median = numericData.length % 2 !== 0 ? numericData[mid] : (numericData[mid - 1] + numericData[mid]) / 2;
        const modeMap = {}; let maxCount = 0, modes = [];
        numericData.forEach(item => {
            modeMap[item] = (modeMap[item] || 0) + 1;
            if (modeMap[item] > maxCount) { maxCount = modeMap[item]; modes = [item]; }
            else if (modeMap[item] === maxCount && !modes.includes(item)) modes.push(item);
        });
        const variance = numericData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / numericData.length;
        return {
            count: numericData.length, sum, mean, median, mode: modes.join(', '), 
            min: numericData[0], max: numericData[numericData.length - 1], 
            stdDev: Math.sqrt(variance), variance
        };
    }
    
    // --- ML HELPER CLASSES & FUNCTIONS ---
    class StandardScaler {
        fitTransform(data) {
            this.means = [];
            this.stds = [];
            if (data.length === 0) return [];

            const numFeatures = data[0].length;
            for (let i = 0; i < numFeatures; i++) {
                const featureValues = data.map(row => row[i]);
                const mean = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
                const std = Math.sqrt(featureValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / featureValues.length);
                this.means.push(mean);
                this.stds.push(std || 1);
            }
            return this.transform(data);
        }

        transform(data) {
            return data.map(row =>
                row.map((val, i) =>
                    (val - this.means[i]) / this.stds[i]
                )
            );
        }
    }

    class KNeighborsClassifier {
        constructor(k = 5) {
            this.k = k;
            this.X_train = null;
            this.y_train = null;
        }

        fit(X, y) {
            if (X.length !== y.length) {
                throw new Error("X and y must have the same length");
            }
            this.X_train = X;
            this.y_train = y;
        }

        predict(X_test) {
            if (!this.X_train || !this.y_train) {
                throw new Error("Model not fitted yet");
            }

            return X_test.map(testPoint => {
                const distances = this.X_train.map((trainPoint, i) => ({
                    label: this.y_train[i],
                    distance: Math.sqrt(trainPoint.reduce((sum, val, j) =>
                        sum + Math.pow(val - testPoint[j], 2), 0))
                }));

                const nearest = distances
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, this.k);

                const votes = {};
                nearest.forEach(n => {
                    votes[n.label] = (votes[n.label] || 0) + 1;
                });

                return Object.entries(votes)
                    .sort((a, b) => b[1] - a[1])[0][0];
            });
        }

        score(X, y) {
            const predictions = this.predict(X);
            let correct = 0;
            for (let i = 0; i < predictions.length; i++) {
                if (String(predictions[i]) === String(y[i])) correct++;
            }
            return correct / predictions.length;
        }
    }

    function trainTestSplit(features, target, testSize = 0.2) {
        const indices = Array.from({length: features.length}, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        const splitIndex = Math.floor(features.length * (1 - testSize));
        const trainIndices = indices.slice(0, splitIndex);
        const testIndices = indices.slice(splitIndex);
        
        return {
            xTrain: trainIndices.map(i => features[i]),
            xTest: testIndices.map(i => features[i]),
            yTrain: trainIndices.map(i => target[i]),
            yTest: testIndices.map(i => target[i])
        };
    }
    
    // --- MASTER EVENT DELEGATION ---
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const buttonId = target.id;
        const linkId = target.matches('.popup-menu a') ? target.id : null;

        if (linkId) {
            e.preventDefault();
            const dialogIdMap = {
                handleMissingValues: 'missingValuesDialog', removeDuplicates: 'duplicateConfirmationDialog',
                multiplyColumnsOption: 'multiplyColumnsDialog', appendStringOption: 'appendStringDialog',
                descriptiveStatsOption: 'descriptiveStatsDialog', correlationAnalysisOption: 'correlationDialog',
                knnOption: 'knnDialog', linearRegressionOption: 'linearRegressionDialog', kmeansOption: 'kmeansDialog',
                histogramOption: 'histogramDialog', barChartOption: 'barChartDialog', scatterPlotOption: 'scatterPlotDialog', pieChartOption: 'pieChartDialog'
            };
            const columnActionMap = {
                standardizeText: {type: 'standardize', title: 'Standardize Text'}, convertToNumeric: {type: 'numeric', title: 'Convert to Numeric'},
                squareValuesOption: {type: 'square', title: 'Square Values', numericOnly: true}, squareRootOption: {type: 'sqrt', title: 'Square Root', numericOnly: true},
                capitalizeTextOption: {type: 'capitalize', title: 'Capitalize Text'}, reverseTextOption: {type: 'reverse', title: 'Reverse Text'},
                labelEncodingOption: {type: 'labelEncode', title: 'Label Encode Column'}
            };
            if (dialogIdMap[linkId]) {
                showDialog(dialogIdMap[linkId], target);
            } else if (columnActionMap[linkId]) {
                columnAction = columnActionMap[linkId];
                document.getElementById('columnActionTitle').textContent = columnAction.title;
                document.querySelector('#columnActionDialog .column-select').classList.toggle('numeric-only', !!columnAction.numericOnly);
                showDialog('columnActionDialog', target);
            } else if (linkId === 'transposeOption') {
                handleTranspose();
            }
        }
        
        if (target.matches('.confirmButton')) {
            handleConfirmClick(target.id);
        }
        
        if (buttonId.startsWith('page-')) handlePagination(buttonId);
        else if (buttonId === 'excelImportButton' || target.closest('#excelImportButton')) window.electronAPI.importExcel();
        else if (buttonId === 'sqlImportButton' || target.closest('#sqlImportButton')) window.electronAPI.importSql();
        else if (buttonId === 'saveProjectBtn') handleSaveProject();
        else if (buttonId === 'addRow') { addTableRow(); }
        else if (buttonId === 'removeLastRow') { if (fullDataset.rows.length > 0) { fullDataset.rows.pop(); renderTablePage(); } }
        else if (buttonId === 'addColumn') handleAddColumn();
        else if (target.matches('.cancelButton') || target.matches('.dialog-backdrop')) hideAllDialogs();
    });

    // --- LOGIC HANDLERS ---
    function handleConfirmClick(buttonId) {
        const actions = {
            confirmMissingValuesBtn: handleMissingValues,
            confirmDuplicateBtn: handleRemoveDuplicates,
            confirmColumnActionBtn: handleColumnAction,
            confirmMultiplyColumnsBtn: handleMultiplyColumns,
            confirmAppendStringBtn: handleAppendString,
            confirmDescriptiveStatsBtn: handleDescriptiveStats,
            confirmCorrelationBtn: handleCorrelation,
            confirmKnnBtn: handleKnnPrediction,
            confirmLinearRegressionBtn: handleLinearRegression,
            confirmKmeansBtn: handleKMeans,
            confirmHistogramBtn: handleHistogram,
            confirmBarChartBtn: handleBarChart,
            confirmScatterPlotBtn: handleScatterPlot,
            confirmPieChartBtn: handlePieChart,
        };
        
        if(actions[buttonId]) {
            actions[buttonId]();
        }
    }
    
    // --- Initial Page Setup and API Listeners ---
    if (document.getElementById('knnFeaturesSelect')) {
        document.getElementById('knnFeaturesSelect').addEventListener('change', populateKnnInputs);
    }
    // Event listeners for missing value radio buttons
    if (missingImputeRadio) {
        missingImputeRadio.addEventListener('change', () => {
            imputationTypeSelection.style.display = missingImputeRadio.checked ? 'block' : 'none';
        });
    }
    if (missingRemoveRadio) {
        missingRemoveRadio.addEventListener('change', () => {
            imputationTypeSelection.style.display = 'none';
        });
    }
    if (missingZeroRadio) {
        missingZeroRadio.addEventListener('change', () => {
            imputationTypeSelection.style.display = 'none';
        });
    }
    
    if (mainContent.querySelector('#dataframeSection')) {
        const urlParams = new URLSearchParams(window.location.search);
        const presetName = urlParams.get('preset');
        if (presetName && presets[presetName]) {
            setupTable(presets[presetName].headers, presets[presetName].rows, presets[presetName].projectName);
        }
    }
    
    window.electronAPI.onFileDataLoaded(result => {
        if (result.success && document.getElementById('dataframeSection')) { 
            setupTable(result.headers, result.rows);
            showToast('Data loaded successfully.', 'success'); 
        } else if (!result.success) { 
            showToast(`Error: ${result.error}`, 'error'); 
            if (historyLog) logToHistory(result.error, 'error');
        }
    });

    window.electronAPI.onProjectFileOpened(result => {
        if (result.success && document.getElementById('dataframeSection')) {
            const { projectName, table, history } = result.data;
            setupTable(table.headers, table.rows, projectName);
            historyLog.innerHTML = '';
            if (history) history.forEach(item => {
                const li = document.createElement('li');
                li.className = item.className;
                li.innerHTML = item.text;
                historyLog.appendChild(li);
            });
            showToast('Project loaded successfully!', 'success');
        } else if(!result.success) {
            showToast(`Error opening project: ${result.error}`, 'error');
        }
    });

    // --- All Other Functions (Cleaning, Transformation, Analysis, etc.) ---
    // These functions are from Folder 1 and are assumed to be correct.
    // They are included here for completeness but are unchanged from the previous version.
    
    function handleSaveProject() { /* ... unchanged ... */ }
    function handlePagination(buttonId) { /* ... unchanged ... */ }
    function handleAddColumn() { /* ... unchanged ... */ }
    function handleMissingValues() { /* ... unchanged ... */ }
    function handleRemoveDuplicates() { /* ... unchanged ... */ }
    function handleColumnAction() { /* ... unchanged ... */ }
    function handleMultiplyColumns() { /* ... unchanged ... */ }
    function handleAppendString() { /* ... unchanged ... */ }
    function handleTranspose() { /* ... unchanged ... */ }
    function handleDescriptiveStats() { /* ... unchanged ... */ }
    function handleCorrelation() { /* ... unchanged ... */ }
    function handleHistogram() { /* ... unchanged ... */ }
    function handleBarChart() { /* ... unchanged ... */ }
    function handleScatterPlot() { /* ... unchanged ... */ }
    function handlePieChart() { /* ... unchanged ... */ }
    function handleKMeans() { /* ... unchanged ... */ }
    // =================================================================
        function handleSaveProject() {
        const projectData = {
            projectName: document.querySelector('.project-title').textContent,
            table: getTableData(),
            history: Array.from(historyLog.children).map(li => ({ text: li.innerHTML, className: li.className })).reverse()
        };
        window.electronAPI.saveProject(projectData);
    }
    
    function handlePagination(buttonId) {
        switch(buttonId) {
            case 'page-first': pagination.currentPage = 1; break;
            case 'page-prev': if (pagination.currentPage > 1) pagination.currentPage--; break;
            case 'page-next': if (pagination.currentPage < pagination.totalPages) pagination.currentPage++; break;
            case 'page-last': pagination.currentPage = pagination.totalPages; break;
        }
        renderTablePage();
    }

    function handleAddColumn() {
        const newHeader = `Feature_${fullDataset.headers.length + 1}`;
        fullDataset.headers.push(newHeader);
        fullDataset.rows.forEach(row => row.push(''));
        setupTable(fullDataset.headers, fullDataset.rows, document.querySelector('.project-title').textContent);
        logToHistory(`Added new column: "${newHeader}"`, 'transform');
    }

function handleMissingValues() {
        const action = document.querySelector('input[name="missingAction"]:checked')?.value; // Get the selected action (remove, impute, zero)
        const colIndex = parseInt(document.querySelector('#missingValuesDialog .column-select').value); // Get the selected column index
        if (isNaN(colIndex)) { // If no column is selected
            showToast('Please select a column.', 'error'); // Show an error toast
            return; // Exit the function
        }
        
        const headerName = fullDataset.headers[colIndex]; // Get the name of the selected column
        let changedCount = 0; // Initialize a counter for changed values

        if (action === "remove") { // If the action is "remove" rows
            const originalLength = fullDataset.rows.length; // Store original row count
            fullDataset.rows = fullDataset.rows.filter(row => { // Filter rows to keep only non-missing ones
                const value = row[colIndex]; // Get the value in the current row for the selected column
                // Keep the row if the value is not null, not an empty string after trimming, and not "nan" or "na" (case-insensitive)
                return !(value === null || value === undefined || String(value).trim() === '' || String(value).toLowerCase() === 'nan' || String(value).toLowerCase() === 'na');
            });
            changedCount = originalLength - fullDataset.rows.length; // Calculate how many rows were removed
        } else { // If the action is "impute" or "zero"
            let imputeValue; // Variable to hold the value for imputation
            if (action === 'zero') { // If the action is "fill with zero"
                imputeValue = 0; // Set impute value to 0
            } else if (action === 'impute') { // If the action is "impute"
                const imputationType = document.getElementById('imputationType').value; // Get the selected imputation type (mean, median, mode, previous)
                
                // Get numeric data for mean/median. getColumnData(colIndex, true) already filters out non-numeric values and nulls.
                const numericData = getColumnData(colIndex, true);
                
                // Get all string data for mode, then filter out just the empty/nulls for calculation
                const columnDataForMode = getColumnData(colIndex, false).filter(v => v !== null && v !== '');

                switch(imputationType) { // Apply imputation based on type
                    case 'mean':
                        // Calculate mean if numeric data exists, otherwise default to 0
                        imputeValue = numericData.length > 0 ? (numericData.reduce((a, b) => a + b, 0) / numericData.length) : 0;
                        break;
                    case 'median':
                        // Calculate median if numeric data exists, otherwise default to 0
                        const sortedData = [...numericData].sort((a,b) => a - b); // Sort numeric data for median
                        const mid = Math.floor(sortedData.length / 2); // Find the middle index
                        imputeValue = sortedData.length > 0 ? (sortedData.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2) : 0; // Calculate median
                        break;
                    case 'mode':
                        const modeMap = {}; // Create a map to count occurrences of each value
                        columnDataForMode.forEach(val => modeMap[val] = (modeMap[val] || 0) + 1); // Populate the map
                        // Find the mode (value with highest count), default to empty string if no data
                        imputeValue = Object.keys(modeMap).length > 0 ? Object.keys(modeMap).reduce((a, b) => modeMap[a] > modeMap[b] ? a : b, '') : '';
                        break;
                    case 'previous':
                        let lastValidValue = null; // Store the last encountered valid value
                        for (let i = 0; i < fullDataset.rows.length; i++) { // Iterate through all rows
                            const value = fullDataset.rows[i][colIndex]; // Get the current cell value
                            // Check if the current value is missing (null, empty, "nan", "na")
                            if (value === null || value === undefined || String(value).trim() === '' || String(value).toLowerCase() === 'nan' || String(value).toLowerCase() === 'na') {
                                if (lastValidValue !== null) { // If a previous valid value exists, use it for imputation
                                    fullDataset.rows[i][colIndex] = lastValidValue;
                                    changedCount++; // Increment count of changed values
                                }
                            } else { // If the current value is valid, update lastValidValue
                                lastValidValue = value;
                            }
                        }
                        // For 'previous', imputation is done directly in the loop, so render and exit early
                        renderTablePage(); 
                        logToHistory(`Handled ${changedCount} missing values in "${headerName}" using previous value imputation`, 'transform'); // Log the action
                        showToast(`Processed ${changedCount} missing values.`, 'success'); // Show a success toast
                        hideAllDialogs(); // Hide the dialog
                        return; // Exit the function
                }
            }

            // Apply the calculated 'imputeValue' (for zero, mean, median, mode) to remaining missing values
            fullDataset.rows.forEach(row => {
                const value = row[colIndex]; // Get the current cell value
                // If the value is missing (null, empty, "nan", "na")
                if (value === null || value === undefined || String(value).trim() === '' || String(value).toLowerCase() === 'nan' || String(value).toLowerCase() === 'na') {
                    row[colIndex] = imputeValue; // Fill with the calculated imputeValue
                    changedCount++; // Increment change count
                }
            });
        }
        
        renderTablePage(); // Re-render the table to show changes
        logToHistory(`Handled ${changedCount} missing values in "${headerName}"`, 'transform'); // Log the action
        showToast(`Processed ${changedCount} missing values.`, 'success'); // Show a success toast
        hideAllDialogs(); // Hide the dialog
    }
   function handleRemoveDuplicates() {
     const originalLength = fullDataset.rows.length; // Store the original number of rows
     const uniqueRows = []; // Array to store rows that are deemed unique
     const seenRows = new Set(); // A Set to efficiently track the stringified representation of seen unique rows

     fullDataset.rows.forEach(row => { // Iterate over each row in the full dataset
         // Create a normalized row for comparison.
         // This step is crucial to handle cases where '123' (string) and 123 (number)
         // might exist, but should be treated as duplicates for removal.
         const normalizedRow = row.map((cell, colIndex) => { // Map each cell in the current row
             const trimmedCell = String(cell).trim(); // Convert cell to string and trim whitespace
             const num = parseFloat(trimmedCell); // Attempt to parse the trimmed cell to a number
             
             // If it successfully parses to a number and is not NaN, use the number for comparison.
             // This helps in treating numeric strings and actual numbers as the same for duplication checks.
             if (!isNaN(num) && trimmedCell !== '') { // Check if it's a valid number and not an empty string
                 return num; // Return the numeric value
             }
             return trimmedCell; // Otherwise, return the trimmed string value
         });

         // Convert the normalized row (which now has consistent types for comparison) to a JSON string.
         const rowString = JSON.stringify(normalizedRow);

         // If this string representation has not been seen before, add the original row to uniqueRows
         // and its string representation to seenRows.
         if (!seenRows.has(rowString)) { // Check if the normalized row string is already in the Set
             seenRows.add(rowString); // Add the normalized row string to the Set
             uniqueRows.push(row); // Add the original (un-normalized) row to the uniqueRows array
         }
     });

     // Update the fullDataset with only the unique rows found.
     fullDataset.rows = uniqueRows;

     const removedCount = originalLength - uniqueRows.length; // Calculate how many duplicate rows were removed
     
     // Re-render the table to display the changes.
     renderTablePage();

     // Log the action to the history panel and show a toast notification to the user.
     logToHistory(`Removed ${removedCount} duplicate rows`, 'transform');
     showToast(`Removed ${removedCount} duplicate rows.`, 'success');
     
     // Hide the confirmation dialog.
     hideAllDialogs();
 }
    function handleColumnAction() {
        const colIndex = parseInt(document.querySelector('#columnActionDialog .column-select').value);
        if (isNaN(colIndex)) { showToast('Please select a column.', 'error'); return; }
        const headerName = fullDataset.headers[colIndex]; let changedCount = 0;
        fullDataset.rows.forEach(row => {
            const originalValue = row[colIndex]?.toString() || '';
            let newValue = originalValue;
            switch(columnAction.type) {
                case 'standardize': newValue = originalValue.toLowerCase().trim(); break;
                case 'numeric': const num = parseFloat(originalValue); newValue = isNaN(num) ? '0' : num.toString(); break;
                case 'square': const sqNum = parseFloat(originalValue); newValue = isNaN(sqNum) ? '0' : Math.pow(sqNum, 2).toString(); break;
                case 'sqrt': const sqrtNum = parseFloat(originalValue); newValue = isNaN(sqrtNum) || sqrtNum < 0 ? '0' : Math.sqrt(sqrtNum).toString(); break;
                case 'capitalize': newValue = originalValue.replace(/\b\w/g, l => l.toUpperCase()); break;
                case 'reverse': newValue = originalValue.split('').reverse().join(''); break;
                case 'labelEncode':
                    const uniqueValues = [...new Set(fullDataset.rows.map(r => r[colIndex]?.toString() || ''))];
                    const labelMap = {};
                    uniqueValues.forEach((val, idx) => labelMap[val] = idx);
                    newValue = labelMap[originalValue] !== undefined ? labelMap[originalValue].toString() : '0';
                    break;
            }
            if (newValue !== originalValue) { changedCount++; row[colIndex] = newValue; }
        });
        renderTablePage();
        logToHistory(`Applied ${columnAction.title} to "${headerName}" (${changedCount} changes)`, 'transform');
        showToast(`Applied ${columnAction.title} to ${changedCount} values.`, 'success');
    }

    function handleMultiplyColumns() {
        const col1Index = parseInt(document.querySelector('#multiplyColumnsDialog .column-select:nth-of-type(1)').value);
        const col2Index = parseInt(document.querySelector('#multiplyColumnsDialog .column-select:nth-of-type(2)').value);
        
        if (isNaN(col1Index) || isNaN(col2Index)) {
            showToast('Please select two columns.', 'error'); return;
        }

        const newHeader = `${fullDataset.headers[col1Index]}_x_${fullDataset.headers[col2Index]}`;
        fullDataset.headers.push(newHeader);

        fullDataset.rows.forEach(row => {
            const val1 = parseFloat(row[col1Index]) || 0;
            const val2 = parseFloat(row[col2Index]) || 0;
            row.push((val1 * val2).toString());
        });

        setupTable(fullDataset.headers, fullDataset.rows, document.querySelector('.project-title').textContent);
        logToHistory(`Created new column "${newHeader}" by multiplying columns`, 'transform');
    }

    function handleAppendString() {
        const colIndex = parseInt(document.querySelector('#appendStringDialog .column-select').value);
        const appendText = document.getElementById('appendStringText').value;
        
        if (isNaN(colIndex) || !appendText) {
            showToast('Please select a column and enter text to append.', 'error'); return;
        }

        const headerName = fullDataset.headers[colIndex];
        fullDataset.rows.forEach(row => {
            row[colIndex] = (row[colIndex]?.toString() || '') + appendText;
        });

        renderTablePage();
        logToHistory(`Appended "${appendText}" to all values in "${headerName}"`, 'transform');
        showToast(`Appended text to column "${headerName}".`, 'success');
    }

    function handleTranspose() {
        if (fullDataset.rows.length === 0) {
            showToast('No data to transpose.', 'error'); return;
        }

        const newHeaders = ['Feature', ...fullDataset.rows.map((_, i) => `Row_${i + 1}`)];
        const newRows = fullDataset.headers.map((header, colIndex) => {
            return [header, ...fullDataset.rows.map(row => row[colIndex] || '')];
        });

        setupTable(newHeaders, newRows, document.querySelector('.project-title').textContent);
        logToHistory('Transposed the dataset', 'transform');
        showToast('Dataset transposed successfully.', 'success');
    }

    function handleDescriptiveStats() {
        const colIndex = parseInt(document.querySelector('#descriptiveStatsDialog .column-select').value);
        if (isNaN(colIndex)) return;
        const headerName = `"${fullDataset.headers[colIndex]}"`;
        const data = getColumnData(colIndex, true);
        const stats = calculateStats(data);
        if (!stats) return showToast(`Column ${headerName} has no numeric data.`, 'error');
        const card = createAnalysisCard(`Descriptive Statistics: ${headerName}`);
        const output = document.createElement('div');
        output.className = 'stats-output';
        output.innerHTML = `<pre>Count (Numeric): ${stats.count}\nSum: ${stats.sum.toFixed(2)}\nMean: ${stats.mean.toFixed(2)}\nMedian: ${stats.median.toFixed(2)}\nMode(s): ${stats.mode}\nMin: ${stats.min.toFixed(2)}\nMax: ${stats.max.toFixed(2)}\nStd. Dev: ${stats.stdDev.toFixed(2)}\nVariance: ${stats.variance.toFixed(2)}</pre>`;
        card.appendChild(output);
        logToHistory(`Generated Descriptive Stats for ${headerName}`, 'success');
    }

    function handleCorrelation() {
        const selects = document.querySelectorAll('#correlationDialog .column-select');
        const col1Index = parseInt(selects[0].value);
        const col2Index = parseInt(selects[1].value);
        
        if (isNaN(col1Index) || isNaN(col2Index) || col1Index === col2Index) {
            showToast('Please select two different numeric columns.', 'error'); return;
        }

        const data1 = getColumnData(col1Index, true);
        const data2 = getColumnData(col2Index, true);
        
        const validPairs = data1.map((d1, i) => [d1, data2[i]]).filter(pair => pair[0] !== null && pair[1] !== null);
        
        if (validPairs.length < 2) {
            showToast('Not enough valid data pairs for correlation.', 'error'); return;
        }

        const validData1 = validPairs.map(p => p[0]);
        const validData2 = validPairs.map(p => p[1]);
        const n = validPairs.length;
        const mean1 = validData1.reduce((a, b) => a + b, 0) / n;
        const mean2 = validData2.reduce((a, b) => a + b, 0) / n;
        
        let numerator = 0, sum1Sq = 0, sum2Sq = 0;
        for (let i = 0; i < n; i++) {
            const diff1 = validData1[i] - mean1;
            const diff2 = validData2[i] - mean2;
            numerator += diff1 * diff2;
            sum1Sq += diff1 * diff1;
            sum2Sq += diff2 * diff2;
        }
        
        const correlation = sum1Sq === 0 || sum2Sq === 0 ? 0 : numerator / Math.sqrt(sum1Sq * sum2Sq);
        const header1 = fullDataset.headers[col1Index];
        const header2 = fullDataset.headers[col2Index];
        
        const card = createAnalysisCard(`Correlation: ${header1} vs ${header2}`);
        card.innerHTML += `<div class="stats-output"><pre>Pearson Correlation: ${correlation.toFixed(4)}</pre></div>`;
        logToHistory(`Calculated correlation between "${header1}" and "${header2}": ${correlation.toFixed(4)}`, 'success');
    }

    function handleHistogram() {
        const colIndex = parseInt(document.querySelector('#histogramDialog .column-select').value);
        const bins = parseInt(document.getElementById('histogramBins').value) || 10;
        if (isNaN(colIndex)) { showToast('Please select a column.', 'error'); return; }
        const data = getColumnData(colIndex, true).filter(v => v !== null);
        if (data.length === 0) { showToast('No numeric data found in selected column.', 'error'); return; }

        const min = Math.min(...data); const max = Math.max(...data);
        const binWidth = (max - min) / bins; const binCounts = new Array(bins).fill(0);
        const binLabels = [];
        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = min + (i + 1) * binWidth;
            binLabels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
        }
        data.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            binCounts[binIndex]++;
        });

        const headerName = fullDataset.headers[colIndex];
        const card = createAnalysisCard(`Histogram: ${headerName}`);
        createChart(card, 'bar', {
            labels: binLabels,
            datasets: [{ label: 'Frequency', data: binCounts, backgroundColor: 'rgba(54, 162, 235, 0.6)' }]
        }, { plugins: { title: { display: true, text: `Distribution of ${headerName}` } } });
        logToHistory(`Created histogram for "${headerName}"`, 'success');
    }
    
    function handleBarChart() {
        const colIndex = parseInt(document.querySelector('#barChartDialog .column-select').value);
        if (isNaN(colIndex)) { showToast('Please select a column.', 'error'); return; }
        const data = getColumnData(colIndex).filter(v => v !== null && v !== '');
        const valueCounts = {};
        data.forEach(value => { valueCounts[value] = (valueCounts[value] || 0) + 1; });
        const sortedEntries = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
        const labels = sortedEntries.map(entry => entry[0]);
        const counts = sortedEntries.map(entry => entry[1]);

        const headerName = fullDataset.headers[colIndex];
        const card = createAnalysisCard(`Bar Chart: ${headerName}`);
        createChart(card, 'bar', {
            labels: labels,
            datasets: [{ label: 'Count', data: counts, backgroundColor: 'rgba(255, 99, 132, 0.6)' }]
        }, { plugins: { title: { display: true, text: `Value Counts for ${headerName}` } } });
        logToHistory(`Created bar chart for "${headerName}"`, 'success');
    }

    function handleScatterPlot() {
        const xColIndex = parseInt(document.querySelector('#scatterPlotDialog .column-select:nth-of-type(1)').value);
        const yColIndex = parseInt(document.querySelector('#scatterPlotDialog .column-select:nth-of-type(2)').value);
        if (isNaN(xColIndex) || isNaN(yColIndex)) { showToast('Please select two columns.', 'error'); return; }

        const xData = getColumnData(xColIndex, true); const yData = getColumnData(yColIndex, true);
        const plotData = [];
        for (let i = 0; i < xData.length; i++) {
            if (xData[i] !== null && yData[i] !== null) { plotData.push({ x: xData[i], y: yData[i] }); }
        }
        if (plotData.length === 0) { showToast('No valid numeric data pairs found.', 'error'); return; }

        const xHeader = fullDataset.headers[xColIndex]; const yHeader = fullDataset.headers[yColIndex];
        const card = createAnalysisCard(`Scatter Plot: ${xHeader} vs ${yHeader}`);
        createChart(card, 'scatter', {
            datasets: [{ label: `${xHeader} vs ${yHeader}`, data: plotData, backgroundColor: 'rgba(75, 192, 192, 0.6)' }]
        }, { plugins: { title: { display: true, text: `${xHeader} vs ${yHeader}` } } });
        logToHistory(`Created scatter plot: "${xHeader}" vs "${yHeader}"`, 'success');
    }
    
    function handlePieChart() {
        const colIndex = parseInt(document.querySelector('#pieChartDialog .column-select').value);
        if (isNaN(colIndex)) { showToast('Please select a column.', 'error'); return; }
        const data = getColumnData(colIndex).filter(v => v !== null && v !== '');
        const valueCounts = {}; data.forEach(value => { valueCounts[value] = (valueCounts[value] || 0) + 1; });
        const sortedEntries = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = sortedEntries.map(entry => entry[0]); const counts = sortedEntries.map(entry => entry[1]);
        const colors = ['#3498db', '#e74c3c', '#9b59b6', '#2ecc71', '#f1c40f', '#1abc9c', '#34495e'];

        const headerName = fullDataset.headers[colIndex];
        const card = createAnalysisCard(`Pie Chart: ${headerName}`);
        createChart(card, 'pie', {
            labels: labels, datasets: [{ data: counts, backgroundColor: colors }]
        }, { plugins: { title: { display: true, text: `Distribution of ${headerName}` } } });
        logToHistory(`Created pie chart for "${headerName}"`, 'success');
    }
        
    function handleKMeans() {
        const featureIndices = Array.from(document.querySelectorAll('#kmeansDialog .column-select')[0].selectedOptions)
            .map(opt => parseInt(opt.value));
        const k = parseInt(document.getElementById('kmeansKValue').value) || 3;
        
        if (featureIndices.length === 0) {
            showToast('Please select feature columns.', 'error');
            return;
        }

        const data = fullDataset.rows.map(row => featureIndices.map(idx => parseFloat(row[idx]))).filter(row => !row.some(isNaN));
        if (data.length < k) { showToast(`Not enough data points for ${k} clusters.`, 'error'); return; }

        let centroids = data.slice(0, k); let assignments = []; let converged = false;
        while (!converged) {
            let newAssignments = data.map(point => {
                let minDist = Infinity; let bestCentroid = 0;
                centroids.forEach((centroid, i) => {
                    const dist = Math.sqrt(point.reduce((sum, val, dim) => sum + (val - centroid[dim])**2, 0));
                    if (dist < minDist) { minDist = dist; bestCentroid = i; }
                });
                return bestCentroid;
            });
            converged = assignments.every((a, i) => a === newAssignments[i]) && assignments.length > 0;
            assignments = newAssignments;
            centroids = Array.from({length: k}, () => Array(featureIndices.length).fill(0));
            const counts = Array(k).fill(0);
            data.forEach((point, i) => {
                const c = assignments[i];
                point.forEach((val, dim) => centroids[c][dim] += val);
                counts[c]++;
            });
            centroids.forEach((c, i) => c.forEach((val, dim) => centroids[i][dim] /= counts[i] || 1));
        }
        
        const card = createAnalysisCard(`K-Means Clustering (k=${k})`);
        card.innerHTML += `<div class="stats-output"><pre>${JSON.stringify(centroids.map(c => c.map(v => v.toFixed(2))), null, 2)}</pre></div>`;
        logToHistory(`K-Means clustering completed.`, 'success');
    }
    // =================================================================
    // START: CORRECTED Linear Regression & KNN Logic
    // =================================================================
    
    function handleLinearRegression() {
        const selects = document.querySelectorAll('#linearRegressionDialog .column-select');
        const featureIndex = parseInt(selects[0].value);
        const targetIndex = parseInt(selects[1].value);

        if (isNaN(featureIndex) || isNaN(targetIndex)) {
            showToast('Please select both an independent and dependent variable.', 'error');
            return;
        }

        if (featureIndex === targetIndex) {
            showToast('Independent and dependent variables cannot be the same.', 'error');
            return;
        }

        const features = [];
        const target = [];
        for (let i = 0; i < fullDataset.rows.length; i++) {
            const featureValue = parseFloat(fullDataset.rows[i][featureIndex]);
            const targetValue = parseFloat(fullDataset.rows[i][targetIndex]);
            if (!isNaN(featureValue) && !isNaN(targetValue)) {
                features.push([featureValue]); // Keep as array of arrays for consistency
                target.push(targetValue);
            }
        }

        if (features.length < 2) {
            showToast('Not enough valid numeric data pairs for regression.', 'error');
            return;
        }

        const { xTrain, xTest, yTrain, yTest } = trainTestSplit(features, target, 0.2);
        
        const n = xTrain.length;
        const sumX = xTrain.reduce((s, row) => s + row[0], 0);
        const sumY = yTrain.reduce((s, y) => s + y, 0);
        const sumXY = xTrain.reduce((s, row, i) => s + row[0] * yTrain[i], 0);
        const sumX2 = xTrain.reduce((s, row) => s + row[0] * row[0], 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        if (isNaN(slope) || isNaN(intercept)) {
            showToast('Could not calculate regression. Check for constant feature values.', 'error');
            return;
        }

        let r2 = 1.0;
        if (yTest.length > 1) {
            const predictions = xTest.map(row => intercept + slope * row[0]);
            const yMean = yTest.reduce((a, b) => a + b, 0) / yTest.length;
            const ssTot = yTest.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
            const ssRes = yTest.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
            r2 = ssTot === 0 ? 1.0 : 1 - (ssRes / ssTot);
        }
        
        const card = createAnalysisCard('Linear Regression Results');
        card.innerHTML += `<div class="stats-output"><pre>Slope (m): ${slope.toFixed(4)}\nIntercept (b): ${intercept.toFixed(4)}\nR² Score: ${r2.toFixed(4)}</pre></div>`;
        logToHistory(`Linear Regression completed - R²: ${r2.toFixed(4)}`, 'success');
        hideAllDialogs();
    }

    function populateKnnInputs() {
        const featuresSelect = document.getElementById('knnFeaturesSelect');
        const inputContainer = document.getElementById('knnInputContainer');
        inputContainer.innerHTML = '<h4>Enter New Data Point:</h4>';

        const selectedIndices = Array.from(featuresSelect.selectedOptions).map(opt => parseInt(opt.value));

        selectedIndices.forEach(idx => {
            const label = document.createElement('label');
            label.textContent = fullDataset.headers[idx] + ':';
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.id = `knn-input-${idx}`;
            input.className = 'knn-feature-input';
            inputContainer.appendChild(label);
            inputContainer.appendChild(input);
        });
    }

    function handleKnnPrediction() {
        const featureIndices = Array.from(document.getElementById('knnFeaturesSelect').selectedOptions).map(opt => parseInt(opt.value));
        const targetIndex = parseInt(document.getElementById('knnTargetSelect').value);
        const k = parseInt(document.getElementById('knnKValue').value);

        if (featureIndices.length === 0 || isNaN(targetIndex) || isNaN(k)) {
            showToast('Please select features, a target, and a K value.', 'error');
            return;
        }
        
        const inputValues = [];
        let hasEmptyInput = false;
        featureIndices.forEach(idx => {
            const input = document.getElementById(`knn-input-${idx}`);
            const value = parseFloat(input.value);
            if (isNaN(value)) {
                hasEmptyInput = true;
            }
            inputValues.push(value);
        });

        if (hasEmptyInput) {
            showToast('Please enter a numeric value for each selected feature.', 'error');
            return;
        }

        const X = [];
        const y = [];
        fullDataset.rows.forEach(row => {
            const featureRow = featureIndices.map(idx => parseFloat(row[idx]));
            const targetValue = row[targetIndex];
            if (!featureRow.some(isNaN) && targetValue != null && String(targetValue).trim() !== '') {
                X.push(featureRow);
                y.push(targetValue);
            }
        });

        if (X.length < k) {
            showToast(`Not enough valid training data (found ${X.length}, need at least k=${k}).`, 'error');
            return;
        }
        
        const scaler = new StandardScaler();
        const X_scaled = scaler.fitTransform(X);

        const knn = new KNeighborsClassifier(k);
        knn.fit(X_scaled, y);
        
        const scaledInput = scaler.transform([inputValues]);
        const prediction = knn.predict(scaledInput)[0];
        
        const card = createAnalysisCard(`KNN Prediction (k=${k})`);
        let predictionInfo = `<strong>Input:</strong>\n${featureIndices.map((idx, i) => `${fullDataset.headers[idx]}: ${inputValues[i]}`).join('\n')}`;
        predictionInfo += `\n\n<strong>--> Predicted ${fullDataset.headers[targetIndex]}:</strong> ${prediction}`;
        card.innerHTML += `<div class="stats-output"><pre>${predictionInfo}</pre></div>`;

        logToHistory(`KNN prediction completed: ${prediction}`, 'success');
        hideAllDialogs();
    }
});