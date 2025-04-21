document.addEventListener('DOMContentLoaded', () => {
    // --- Table Interaction Logic (Only run if table elements exist) --- 
    const dynamicTableElement = document.getElementById('dynamicTable');
    const addRowButtonElement = document.getElementById('addRow'); // Check for addRow as well

    if (dynamicTableElement && addRowButtonElement) {
        console.log("Functions.js: Found table elements, attaching table listeners.");
        const tableBody = dynamicTableElement.getElementsByTagName('tbody')[0];

    // Function to add a new row
    const addRow = () => {
        const newRow = tableBody.insertRow();

        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2);

        cell1.contentEditable = true; // Make the new cell editable
        cell2.contentEditable = true; // Make the new cell editable
        cell3.innerHTML = '<button class="remove-row">Remove</button>';

        // Add event listener to the newly created remove button
        cell3.querySelector('.remove-row').addEventListener('click', () => {
            tableBody.deleteRow(newRow.rowIndex - 1); // Adjust for header row
        });
    };

    // Add event listener for the "Add Row" button
        addRowButtonElement.addEventListener('click', addRow);

    // Add event listener for existing remove buttons
    document.querySelectorAll('.remove-row').forEach(button => {
        button.addEventListener('click', (event) => {
            const row = event.target.closest('tr');
                if(row && tableBody.contains(row)) { // Ensure row exists and is in the body
            tableBody.deleteRow(row.rowIndex - 1); // Adjust for header row
                }
            });
        });
    } else {
        // console.log("Functions.js: Table elements not found, skipping table listeners.");
    }
    // --- End Table Interaction Logic ---

    let chartType = sessionStorage.getItem('selectedChartType'); // Get type early if possible
    let formattedChartType = 'Chart'; // Default
    if (chartType) {
        formattedChartType = chartType.charAt(0).toUpperCase() + chartType.slice(1);
    }

    // Logic specific to config.html
    if (document.querySelector('#config-title-header')) { 
        console.log("Functions.js (DOMContentLoaded): Running config.html specific logic.");
        if (!chartType) {
            console.error("Functions.js: No chart type found in sessionStorage.");
            alert("Error: Could not determine the chart type to configure.");
            return;
        }
        console.log("Functions.js: Configuring chart type:", chartType);

        // -- Update Page Title --
        document.title = `${formattedChartType} Chart Configuration`;

        const configHeader = document.getElementById('config-title-header');
        if (configHeader) {
            configHeader.textContent = `Configure ${formattedChartType} Chart`;
        }

        document.querySelectorAll('.common-field').forEach(el => el.style.display = 'block');
        const typeClassName = `${chartType}-field`;
        document.querySelectorAll(`.${typeClassName}`).forEach(el => el.style.display = 'block');

        const xAxisLabelElement = document.getElementById('config-x-axis-col-label');
        if (xAxisLabelElement) {
            if (chartType === 'barchart') {
                xAxisLabelElement.textContent = 'Category Column (X-Axis):';
            } else if (chartType === 'line') {
                 xAxisLabelElement.textContent = 'X-Axis Column (Line):';
            } else if (chartType === 'bubble') {
                 xAxisLabelElement.textContent = 'X-Axis Column (Bubble):';
            } else if (chartType !== 'piechart' && chartType !== 'boxplot' && chartType !== 'heatmap') { // Exclude types without standard X-axis column
                 xAxisLabelElement.textContent = 'X-Axis Column:'; // Default for scatter/histogram
            }
            // Hide generic X-axis selector if not applicable (e.g., heatmap, maybe boxplot)
            if (chartType === 'heatmap' || chartType === 'boxplot') {
                const xAxisDiv = document.querySelector('.scatter-field.histogram-field.barchart-field.line-field.bubble-field'); // Find the div with the generic x-axis select
                 if (xAxisDiv && !xAxisDiv.classList.contains(`${chartType}-field`)) { // Check if it should be hidden for this type
                      xAxisDiv.style.display = 'none';
                 }
                 const xAxisLabelDiv = document.querySelector('.scatter-field.histogram-field.barchart-field.line-field'); // Find div with x-axis label input
                 if (xAxisLabelDiv && !xAxisLabelDiv.classList.contains(`${chartType}-field`)){
                    xAxisLabelDiv.style.display = 'none';
                 }
            }
        }
        // Hide generic Y-axis label input if not applicable (e.g., heatmap, piechart, boxplot)
        const yAxisLabelInputDiv = document.querySelector('.scatter-field.histogram-field.barchart-field.line-field');
        if (yAxisLabelInputDiv && (chartType === 'heatmap' || chartType === 'piechart' || chartType === 'boxplot')){
            yAxisLabelInputDiv.style.display = 'none';
        }

        function populateDropdowns(columns) {
            if (!columns || columns.length === 0) {
                console.warn("Functions.js: No columns provided to populate elements.");
                return;
            }
            console.log("Functions.js: Populating dropdowns/checkboxes with columns:", columns);
            
            // --- Populate Select Dropdowns --- 
            const selectElements = document.querySelectorAll(
                // Add new select IDs here
                '#config-x-axis-col, #config-y-axis-col, #config-category-col, #config-value-col, #config-y-axis-col-bar,'
                // Removed #config-y-axis-col-line
                + ' #config-boxplot-col, #config-boxplot-category-col, #config-bubble-size-col, #config-bubble-color-col'
            );
            selectElements.forEach(select => {
                if (!select) return;
                // Clear existing options (except the first placeholder)
                const firstOption = select.options[0];
                select.innerHTML = ''; 
                if (firstOption) select.appendChild(firstOption); // Keep placeholder
                
                // Add new options based on columns
                columns.forEach(col => {
                    const option = document.createElement('option');
                    option.value = col;
                    option.textContent = col;
                    select.appendChild(option);
                });
            });

            // --- Populate Line Chart Y-Axis Checkboxes --- 
            const checkboxContainer = document.getElementById('config-y-cols-checkboxes');
            if (checkboxContainer) {
                // Clear existing checkboxes (except the label)
                const label = checkboxContainer.querySelector('label');
                checkboxContainer.innerHTML = ''; // Clear container
                if (label) checkboxContainer.appendChild(label); // Re-add label

                columns.forEach((col, index) => {
                    const div = document.createElement('div'); // Container for each checkbox+label
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `y-col-checkbox-${index}`;
                    checkbox.name = 'yCols';
                    checkbox.value = col;
                    checkbox.checked = true; // Default to checked
                    
                    const labelForCheckbox = document.createElement('label');
                    labelForCheckbox.htmlFor = checkbox.id;
                    labelForCheckbox.textContent = col;
                    labelForCheckbox.style.marginLeft = '5px'; // Add spacing
                    labelForCheckbox.style.fontWeight = 'normal'; // Override potential bold from container label

                    div.appendChild(checkbox);
                    div.appendChild(labelForCheckbox);
                    checkboxContainer.appendChild(div);
                });
            }
        }

        let currentColumns = [];
        try {
            const storedColumns = sessionStorage.getItem('currentColumns');
            if (storedColumns) {
                currentColumns = JSON.parse(storedColumns);
            } else {
                 console.warn("Functions.js: No column data found in sessionStorage ('currentColumns'). Dropdowns might be empty.");
            }
        } catch (error) {
            console.error("Functions.js: Failed to parse columns from sessionStorage:", error);
        }
        populateDropdowns(currentColumns);

        const createChartBtn = document.getElementById('create-chart-btn');
        if (createChartBtn) {
            console.log("Functions.js: Found create chart button, attaching listener.");
            createChartBtn.addEventListener('click', (event) => {
                if (!chartType) {
                    console.error("Chart type missing!");
                    alert("Configuration error: Cannot determine chart type.");
                    return;
                }
                console.log("Functions.js: Create chart button clicked for type:", chartType);
                const configData = { type: chartType };

                const titleInput = document.getElementById('config-title');
                if (titleInput) configData.title = titleInput.value;
                const xLabelInput = document.getElementById('config-x-label');
                const yLabelInput = document.getElementById('config-y-label');

                // --- Chart-Specific Elements & Logic (using new IDs) ---
                let xCol, yCol, categoryCol, valueCol, sizeCol, colorCol, boxplotCol, boxplotCategoryCol;
                let yColsSelected = []; // For line chart
                let isValid = true;

                switch (chartType) {
                    case 'scatter':
                        xCol = document.getElementById('config-x-axis-col')?.value;
                        yCol = document.getElementById('config-y-axis-col')?.value;
                        if (!xCol || !yCol) { alert('Please select both X and Y axis columns for the scatter plot.'); isValid = false; }
                        if (xCol) configData.xCol = xCol;
                        if (yCol) configData.yCol = yCol;
                        configData.xLabel = xLabelInput?.value || xCol;
                        configData.yLabel = yLabelInput?.value || yCol;
                        break;
                    case 'barchart':
                        xCol = document.getElementById('config-x-axis-col')?.value;
                        yCol = document.getElementById('config-y-axis-col-bar')?.value;
                        if (!xCol) { alert('Please select the Category column (X-axis) for the bar chart.'); isValid = false; }
                        if (xCol) configData.xCol = xCol;
                        if (yCol) configData.yCol = yCol;
                        configData.xLabel = xLabelInput?.value || xCol;
                        configData.yLabel = yLabelInput?.value || 'Count';
                        break;
                    case 'histogram':
                        xCol = document.getElementById('config-x-axis-col')?.value;
                        yCol = document.getElementById('config-y-axis-col')?.value;
                        if (!xCol) { alert('Please select the X-axis column for the histogram.'); isValid = false; }
                        if (xCol) configData.xCol = xCol;
                        if (yCol) configData.yCol = yCol;
                        configData.xLabel = xLabelInput?.value || xCol;
                        configData.yLabel = yLabelInput?.value || yCol;
                        break;
                    case 'piechart':
                        categoryCol = document.getElementById('config-category-col')?.value;
                        valueCol = document.getElementById('config-value-col')?.value;
                        if (categoryCol) configData.categoryCol = categoryCol;
                        if (valueCol) configData.valueCol = valueCol;
                        break;
                    case 'line':
                        const yCheckboxes = document.querySelectorAll('#config-y-cols-checkboxes input[type="checkbox"]:checked');
                        yCheckboxes.forEach(cb => yColsSelected.push(cb.value));
                        
                        if (yColsSelected.length === 0) { alert('Please select at least one Y-axis column for the line chart.'); isValid = false; }
                        
                        // Get line style option
                        const useDifferentStyles = document.getElementById('config-line-styles')?.checked || false;

                        configData.yCols = yColsSelected;
                        configData.useDifferentLineStyles = useDifferentStyles; // Add option to config
                        configData.xLabel = xLabelInput?.value || 'Row Index';
                        configData.yLabel = yLabelInput?.value || 'Values';
                        break;
                    case 'boxplot':
                        boxplotCol = document.getElementById('config-boxplot-col')?.value;
                        boxplotCategoryCol = document.getElementById('config-boxplot-category-col')?.value;
                        if (!boxplotCol) { alert('Please select the Column for the Box Plot.'); isValid = false; }
                        if (boxplotCol) configData.boxplotCol = boxplotCol; // Column(s) to plot
                        if (boxplotCategoryCol) configData.boxplotCategoryCol = boxplotCategoryCol; // Optional grouping column
                        // Labels might be set differently in backend depending on grouping
                        // configData.xLabel = xLabelInput?.value;
                        configData.yLabel = yLabelInput?.value || boxplotCol;
                        break;
                    case 'heatmap':
                        // No specific column inputs required from user
                        configData.title = titleInput?.value || 'Correlation Heatmap';
                        // Backend will calculate correlation on all numeric columns
                        break;
                    case 'bubble':
                        xCol = document.getElementById('config-x-axis-col')?.value;
                        yCol = document.getElementById('config-y-axis-col')?.value;
                        sizeCol = document.getElementById('config-bubble-size-col')?.value;
                        colorCol = document.getElementById('config-bubble-color-col')?.value;
                        if (!xCol || !yCol || !sizeCol) { alert('Please select X, Y, and Size columns for the bubble chart.'); isValid = false; }
                        if (xCol) configData.xCol = xCol;
                        if (yCol) configData.yCol = yCol;
                        if (sizeCol) configData.sizeCol = sizeCol;
                        if (colorCol) configData.colorCol = colorCol; // Optional color column
                        configData.xLabel = xLabelInput?.value || xCol;
                        configData.yLabel = yLabelInput?.value || yCol;
                        // Maybe add Size Label input later?
                        break;
                    default:
                        console.error("Unknown chart type:", chartType);
                        alert("Configuration error: Unknown chart type specified.");
                        isValid = false;
                }

                if (isValid) {
                    fetchChartData(configData);
                } else {
                    console.log("Validation failed, not sending request.");
                }
            });
        }
    }

    // Logic specific to chart_display.html
    const chartImageEl = document.getElementById('chartImage');
    if (chartImageEl) {
        console.log("Functions.js (DOMContentLoaded): Found chart image element, attempting to display.");
        // -- Update Page Title --
        if (chartType) { // Ensure chartType was retrieved
            document.title = `${formattedChartType} Generated Chart`;
        } else {
            document.title = 'Generated Chart'; // Fallback title
            console.warn("Functions.js: Chart type not found in sessionStorage for display page title.");
        }
        displayChartImage();
    }

    // Logic specific to newProject.html / other pages with the table
    const addRowButton = document.getElementById('addRow');
    if (addRowButton) {
        console.log("Functions.js (DOMContentLoaded): Running newProject.html specific logic (found addRow button).");
        // The existing event listeners for the table in newProject.html should remain in its own script tag.
        // We just use this check to differentiate the page context if needed.
    } 

});
// --- End of Merged Content ---

// Make the function explicitly global
window.openConfigPage = function(chartType) {
    console.log(`Preparing to open config for: ${chartType}`);
    if (!chartType) {
        console.error("openConfigPage called without a chart type.");
        alert("Error: Chart type is missing.");
        return;
    }
    // Store the selected chart type in sessionStorage
    sessionStorage.setItem('selectedChartType', chartType);
    console.log(`Stored chart type '${chartType}' in sessionStorage.`);

    // Open the unified config page
    // Adjust width/height as needed for the new combined page
    window.open('config.html', '_blank', 'width=600,height=500,resizable=yes,scrollbars=yes');
}

// Example function (if needed elsewhere)
function navigateTo(url) {
    window.location.href = url;
}

// --- Start of Merged Content from chart_scripts.js ---

const djangoUrl = 'http://127.0.0.1:8000/generate-chart/'; // Verify URL

/**
 * Fetches chart data from the backend.
 * @param {object} configData - The configuration object for the chart.
 */
function fetchChartData(configData) {
    console.log("Initial configData:", configData);

    // --- Retrieve and add table data from sessionStorage ---
    let tableData = null;
    try {
        const storedData = sessionStorage.getItem('currentTableData');
        if (storedData) {
            tableData = JSON.parse(storedData);
        } else {
            console.warn("fetchChartData: No table data found in sessionStorage ('currentTableData').");
        }
    } catch (error) {
        console.error("fetchChartData: Failed to parse table data from sessionStorage:", error);
    }

    // Add table data to the config object if found
    if (tableData) {
        configData.tableData = tableData;
        console.log("Added tableData to configData.");
    } else {
        console.warn("Proceeding without table data in request.");
    }
    // --- End Table Data Addition ---

    console.log("Sending request to:", djangoUrl, "with data:", configData);

    fetch(djangoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
    })
    .then(response => {
        console.log("Received response status:", response.status);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        return response.json();
    })
    .then(data => {
        console.log("Received data from backend:", data);
        if (data.image_data) {
            console.log("Base64 data length:", data.image_data.length);
            console.log("Storing data in sessionStorage...");
            sessionStorage.setItem('chartImageData', data.image_data);
            console.log("Opening chart_display.html...");
            window.open('chart_display.html', '_blank', 'width=800,height=600');
            console.log("Config window will remain open for manual closing.");
        } else {
            console.error('Backend response missing image_data key.');
            throw new Error('Backend did not return image data.');
        }
    })
    .catch(error => {
        console.error('Error during fetch/chart generation process:', error);
        alert(`Failed to generate chart: ${error.message}`);
    });
}

/**
 * Displays the chart image retrieved from sessionStorage.
 */
function displayChartImage() {
    console.log("Functions.js (displayChartImage): Running displayChartImage function.");
    const imageData = sessionStorage.getItem('chartImageData');
    console.log("Functions.js (displayChartImage): Retrieved from sessionStorage:", imageData ? `Data found (length: ${imageData.length})` : "Data NOT found");
    const imgElement = document.getElementById('chartImage');
    console.log("Functions.js (displayChartImage): Image element:", imgElement ? "Found" : "NOT Found");

    if (imageData && imgElement) {
        console.log("Functions.js (displayChartImage): Setting image src...");
        try {
            imgElement.src = imageData;
            imgElement.alt = 'Generated Chart';
            console.log("Functions.js (displayChartImage): Image src set successfully.");
        } catch (e) {
            console.error("Functions.js (displayChartImage): Error setting image src:", e);
            imgElement.alt = 'Error displaying chart data.';
        }
    } else if (imgElement) {
        console.error("Functions.js (displayChartImage): Failed to load chart image: Image data from sessionStorage missing.");
        imgElement.alt = 'Error: Chart data not found in session storage.';
    } else {
        console.error("Functions.js (displayChartImage): Failed to load chart image: Image element not found in DOM.");
    }
}

// --- End of Merged Content from chart_scripts.js ---