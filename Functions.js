document.addEventListener('DOMContentLoaded', () => {
    const addRowButton = document.getElementById('addRow');
    const tableBody = document.getElementById('dynamicTable').getElementsByTagName('tbody')[0];

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
    addRowButton.addEventListener('click', addRow);

    // Add event listener for existing remove buttons
    document.querySelectorAll('.remove-row').forEach(button => {
        button.addEventListener('click', (event) => {
            const row = event.target.closest('tr');
            tableBody.deleteRow(row.rowIndex - 1); // Adjust for header row
        });
    });
});