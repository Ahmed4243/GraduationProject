document.addEventListener('DOMContentLoaded', () => {
    // Table elements
    const table = document.getElementById('dynamicTable');
    const tableHead = table.querySelector('thead');
    const tableBody = table.querySelector('tbody');
    const addRowButton = document.getElementById('addRow');
    const addColumnButton = document.getElementById('addColumn');

    // Function to add a new row 
    const simpleAddRow = () => {
        const newRow = tableBody.insertRow();
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2);

        cell1.contentEditable = true;
        cell2.contentEditable = true;
        cell3.innerHTML = '<button class="remove-row">Remove</button>';

        cell3.querySelector('.remove-row').addEventListener('click', () => {
            tableBody.deleteRow(newRow.rowIndex - 1);
        });
    };

    // Table management functions 
    function addRow() {
        const newRow = tableBody.insertRow();
        const colCount = tableHead.rows[0].cells.length;

        for (let i = 0; i < colCount; i++) {
            const cell = newRow.insertCell(i);
            cell.contentEditable = true;
        }

        const actionCell = newRow.insertCell(colCount);
        actionCell.innerHTML = '<button class="remove-row">-</button>';
        actionCell.querySelector('.remove-row').addEventListener('click', () => {
            if (tableBody.rows.length > 1) {
                tableBody.deleteRow(newRow.rowIndex);
            } else {
                alert("Cannot remove the last row");
            }
        });
    }

    function addColumn() {
        const headerRow = tableHead.rows[0];
        const colIndex = headerRow.cells.length;

        const headerCell = headerRow.insertCell(colIndex);
        headerCell.contentEditable = true;
        headerCell.textContent = `Feature ${colIndex + 1}`;
        headerCell.style.backgroundColor = "#0d8bf1";
        headerCell.style.fontWeight = "bold";

        Array.from(tableBody.rows).forEach(row => {
            const cell = row.insertCell(colIndex);
            cell.contentEditable = true;
        });

        if (document.getElementById('knn-features')) {
            updateKnnSelects();
        }
    }

    // Event listeners
    addRowButton.addEventListener('click', () => {
        addRow(); // Call the more complex addRow 
        simpleAddRow(); // Call the simpler version 
    });

    addColumnButton.addEventListener('click', addColumn);

    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-row')) {
            const row = event.target.closest('tr');
            if (tableBody.rows.length > 1) {
                tableBody.deleteRow(row.rowIndex);
            } else {
                alert("Cannot remove the last row");
            }
        }
    });

    document.querySelectorAll('.remove-row').forEach(button => {
        button.addEventListener('click', (event) => {
            const row = event.target.closest('tr');
            tableBody.deleteRow(row.rowIndex - 1);
        });
    });

    // Context menu for column removal
    const columnContextMenu = document.getElementById('column-context-menu');
    const removeColumnOption = document.getElementById('remove-column-option');
    let columnToRemoveIndex = -1;

    tableHead.addEventListener('contextmenu', (event) => {
        const targetHeader = event.target.closest('th');
        if (targetHeader && tableHead.contains(targetHeader)) {
            event.preventDefault();
            if (tableHead.rows[0].cells.length <= 1) {
                alert("Cannot remove the last column");
                return;
            }
            columnToRemoveIndex = targetHeader.cellIndex;
            columnContextMenu.style.display = 'block';
            columnContextMenu.style.top = `${event.clientY}px`;
            columnContextMenu.style.left = `${event.clientX}px`;
        }
    });

    removeColumnOption.addEventListener('click', () => {
        if (columnToRemoveIndex > -1 && tableHead.rows[0].cells.length > 1) {
            tableHead.rows[0].deleteCell(columnToRemoveIndex);
            Array.from(tableBody.rows).forEach(row => {
                row.deleteCell(columnToRemoveIndex);
            });

            if (document.getElementById('knn-features')) {
                updateKnnSelects();
            }
        }
        columnContextMenu.style.display = 'none';
    });

    document.addEventListener('click', () => {
        columnContextMenu.style.display = 'none';
    });

    // ------------------- KNN Classes & Logic -------------------
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
                if (predictions[i] === y[i]) correct++;
            }
            return correct / predictions.length;
        }
    }

    // KNN UI Elements and Functions
    if (document.getElementById('knn-section')) {
        const knnSection = document.getElementById('knn-section');
        const trainKnnBtn = document.getElementById('train-knn');
        const predictKnnBtn = document.getElementById('predict-knn');
        const resetKnnBtn = document.getElementById('reset-knn');
        const knnFeaturesSelect = document.getElementById('knn-features');
        const knnTargetSelect = document.getElementById('knn-target');
        const knnResultsDiv = document.getElementById('knn-results');
        const testSizeSlider = document.getElementById('test-size');
        const testSizeValue = document.getElementById('test-size-value');

        let knnModel = null;
        let knnScaler = null;
        let knnFeatures = null;
        let knnTarget = null;

        function updateKnnSelects() {
            const headerCells = document.querySelectorAll('#dynamicTable thead th');

            if (!headerCells.length || knnSection.style.display === 'none') return;

            const selectedFeatures = Array.from(knnFeaturesSelect.selectedOptions).map(opt => opt.value);
            const selectedTarget = knnTargetSelect.value;

            knnFeaturesSelect.innerHTML = '';
            knnTargetSelect.innerHTML = '';

            headerCells.forEach((header, index) => {
                if (header.textContent === 'Prediction') return;

                const option = document.createElement('option');
                option.value = index;
                option.textContent = header.textContent || `Column ${index + 1}`;

                knnFeaturesSelect.appendChild(option.cloneNode(true));
                knnTargetSelect.appendChild(option);
            });

            selectedFeatures.forEach(val => {
                const option = knnFeaturesSelect.querySelector(`option[value="${val}"]`);
                if (option) option.selected = true;
            });

            if (knnTargetSelect.querySelector(`option[value="${selectedTarget}"]`)) {
                knnTargetSelect.value = selectedTarget;
            }
        }

        function resetKnn() {
            knnModel = null;
            knnScaler = null;
            knnFeatures = null;
            knnTarget = null;

            knnFeaturesSelect.selectedIndex = -1;
            knnTargetSelect.selectedIndex = 0;
            document.getElementById('k-value').value = 5;
            testSizeSlider.value = 20;
            testSizeValue.textContent = "20%";
            knnResultsDiv.innerHTML = "";

            const headerRow = document.querySelector('#dynamicTable thead tr');
            if (!headerRow) return;

            for (let i = 0; i < headerRow.cells.length; i++) {
                if (headerRow.cells[i].textContent === 'Prediction') {
                    headerRow.deleteCell(i);
                    const bodyRows = document.querySelectorAll('#dynamicTable tbody tr');
                    bodyRows.forEach(row => row.deleteCell(i));
                    break;
                }
            }
        }

        function trainKnn() {
            const selectedFeatures = Array.from(knnFeaturesSelect.selectedOptions).map(opt => parseInt(opt.value));
            const selectedTarget = parseInt(knnTargetSelect.value);
            const kValue = parseInt(document.getElementById('k-value').value);
            const testSize = parseInt(testSizeSlider.value) / 100;

            if (selectedFeatures.length === 0) {
                alert("Please select at least one feature");
                return;
            }
            if (selectedFeatures.includes(selectedTarget)) {
                alert("Target column cannot be one of the feature columns");
                return;
            }

            const X = [];
            const y = [];
            const rows = document.querySelectorAll('#dynamicTable tbody tr');
            const headerRow = document.querySelector('#dynamicTable thead tr');

            for (const row of rows) {
                const featureValues = [];
                let hasEmpty = false;

                for (const featureIndex of selectedFeatures) {
                    const cell = row.cells[featureIndex];
                    if (!cell || cell.textContent.trim() === '') {
                        hasEmpty = true;
                        break;
                    }
                    const value = parseFloat(cell.textContent.trim());
                    if (isNaN(value)) {
                        hasEmpty = true;
                        break;
                    }
                    featureValues.push(value);
                }

                const targetCell = row.cells[selectedTarget];
                if (targetCell && !hasEmpty && targetCell.textContent.trim() !== '') {
                    y.push(targetCell.textContent.trim());
                    X.push(featureValues);
                }
            }

            if (X.length < 2) {
                knnResultsDiv.innerHTML = "<strong>Error:</strong> Not enough valid data for training (need at least 2 samples)";
                return;
            }

            const splitIndex = Math.floor(X.length * (1 - testSize));
            const X_train = X.slice(0, splitIndex);
            const y_train = y.slice(0, splitIndex);
            const X_test = X.slice(splitIndex);
            const y_test = y.slice(splitIndex);

            const scaler = new StandardScaler();
            const X_train_scaled = scaler.fitTransform(X_train);
            const X_test_scaled = scaler.transform(X_test);

            const knn = new KNeighborsClassifier(kValue);
            knn.fit(X_train_scaled, y_train);

            const trainAccuracy = knn.score(X_train_scaled, y_train);
            const testAccuracy = knn.score(X_test_scaled, y_test);

            knnModel = knn;
            knnScaler = scaler;
            knnFeatures = selectedFeatures;
            knnTarget = selectedTarget;

            knnResultsDiv.innerHTML = `
                <strong>Training Results:</strong><br>
                Training Accuracy: ${(trainAccuracy * 100).toFixed(1)}%<br>
                Test Accuracy: ${(testAccuracy * 100).toFixed(1)}%<br>
                Samples: ${X_train.length} train, ${X_test.length} test<br>
                Features: ${selectedFeatures.map(i => headerRow.cells[i].textContent).join(', ')}<br>
                Target: ${headerRow.cells[selectedTarget].textContent}<br>
                K Value: ${kValue}
            `;
        }

        function predictWithKnn() {
            if (!knnModel) {
                alert("Please train the model first");
                return;
            }

            const rows = document.querySelectorAll('#dynamicTable tbody tr');
            const predictions = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const featureValues = [];
                let hasEmpty = false;

                for (const featureIndex of knnFeatures) {
                    const cell = row.cells[featureIndex];
                    if (!cell || cell.textContent.trim() === '') {
                        hasEmpty = true;
                        break;
                    }
                    const value = parseFloat(cell.textContent.trim());
                    if (isNaN(value)) {
                        hasEmpty = true;
                        break;
                    }
                    featureValues.push(value);
                }

                if (!hasEmpty && featureValues.length === knnFeatures.length) {
                    try {
                        const scaledValues = knnScaler.transform([featureValues]);
                        const prediction = knnModel.predict(scaledValues)[0];
                        predictions.push({
                            rowIndex: i,
                            prediction: prediction
                        });
                    } catch (e) {
                        console.error("Prediction error:", e);
                    }
                }
            }

            const headerRow = document.querySelector('#dynamicTable thead tr');
            let predictionColIndex = -1;

            for (let i = 0; i < headerRow.cells.length; i++) {
                if (headerRow.cells[i].textContent === 'Prediction') {
                    predictionColIndex = i;
                    break;
                }
            }

            if (predictionColIndex === -1) {
                predictionColIndex = headerRow.cells.length;
                const newHeader = document.createElement("th");
                newHeader.textContent = "Prediction";
                newHeader.style.backgroundColor = "#4CAF50";
                newHeader.style.color = "white";
                headerRow.appendChild(newHeader);

                document.querySelectorAll('#dynamicTable tbody tr').forEach(row => {
                    row.insertCell(predictionColIndex);
                });
            }

            predictions.forEach(pred => {
                const row = rows[pred.rowIndex];
                const cell = row.cells[predictionColIndex];
                cell.textContent = pred.prediction;
                cell.style.fontWeight = 'bold';
                cell.style.color = '#4CAF50';
            });

            knnResultsDiv.innerHTML += `<br><strong>Added predictions for ${predictions.length} rows</strong>`;
        }

        testSizeSlider.addEventListener('input', () => {
            testSizeValue.textContent = `${testSizeSlider.value}%`;
        });

        trainKnnBtn.addEventListener('click', trainKnn);
        predictKnnBtn.addEventListener('click', predictWithKnn);
        resetKnnBtn.addEventListener('click', resetKnn);
        document.querySelector('#dynamicTable').addEventListener('DOMSubtreeModified', updateKnnSelects);

        updateKnnSelects();
    }
});
