function processCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    const progress = document.getElementById('progress');

    if (!file) {
        alert("Please select a file");
        return;
    }

    // Check if the file is a CSV
    if (file.type !== 'text/csv') {
        alert("Please upload a valid CSV file");
        return;
    }

    progress.textContent = "Parsing CSV file...";
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            progress.textContent = "CSV file parsed successfully";

            const data = results.data;
            const columns = results.meta.fields;

            // Check if the CSV has a "SKILL AREA" column
            if (!columns.includes("SKILL AREA")) {
                alert("The CSV file must have a 'SKILL AREA' column");
                progress.textContent = "CSV file missing 'SKILL AREA' column";
                return;
            }

            progress.textContent = "Removing duplicate records...";

            // Remove duplicate records
            const uniqueRecords = removeDuplicates(data);

            progress.textContent = "Processing data...";
            const cleanedData = uniqueRecords.map((record, index) => {
                const upperCaseRecord = {};

                for (const key in record) {
                    if (key.toUpperCase() !== "TIMESTAMP") {
                        upperCaseRecord[key] = record[key].toUpperCase();
                    }
                }

                return upperCaseRecord;
            });

            const categorizedData = {};
            cleanedData.forEach((record, index) => {
                let skillArea = record['SKILL AREA'];
                if (skillArea.length > 31) {
                    skillArea = skillArea.slice(0, 30);
                }

                if (!categorizedData[skillArea]) {
                    categorizedData[skillArea] = [];
                }
                categorizedData[skillArea].push(record);
                progress.textContent = `Processed ${index + 1} records`;
            });

            progress.textContent = "Creating Excel workbook...";
            createExcelWorkbook(categorizedData);
            progress.textContent = "Excel workbook created successfully. Ready for download.";
        }
    });
}

function removeDuplicates(data) {
    const uniqueRecords = [];
    const seen = new Set();

    data.forEach(record => {
        const uniqueKey = record['STATE CODE'].concat(record['PHONE NO'])
        if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            uniqueRecords.push(record);
        }
    });
    alert(uniqueRecords.length)
    return uniqueRecords;
}

function createExcelWorkbook(data) {
    const workbook = XLSX.utils.book_new();
    for (const skillArea in data) {
        const records = data[skillArea];
        const newRecords = records.map((record, index) => {
            const newRecord = { 'S/N': index + 1, ...record }; // Add serial number as first column
            return newRecord;
        });

        const worksheet = XLSX.utils.json_to_sheet(newRecords);
        XLSX.utils.book_append_sheet(workbook, worksheet, skillArea);
    }
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadLink.download = 'processed_data.xlsx';
    downloadLink.style.display = 'block';
}