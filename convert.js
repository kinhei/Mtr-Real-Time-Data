const fs = require("fs");
const path = require("path");

// Function to convert CSV to JSON
function csvToJson(csvFilePath, jsonFilePath) {
  // Read CSV file
  fs.readFile(csvFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the CSV file:", err);
      return;
    }

    // Split data into rows
    const data_rows = data.split("\n").map((row) => row.split(","));

    // Get data headers from the first row
    const data_headers = data_rows[0];

    // Initialize an object to hold the final JSON structure
    const result = [];

    // Process each row (skipping the header)
    for (let i = 1; i < data_rows.length; i++) {
      const row = data_rows[i];
      if (row.length === data_headers.length) {
        // Ensure row length matches header length
        const lineCode = row[0].replace(/^"|"$/g, ""); // First column as line code

        const stationData = {};
        const stationCode = row[2].replace(/^"|"$/g, ""); // Third column as station code
        const stationChiName = row[4].replace(/^"|"$/g, ""); // Fifth column as station Chinese name
        const stationEngName = row[5].replace(/^"|"$/g, ""); // Sixth column as station English name

        if (stationCode && stationChiName && stationEngName) {
          stationData[stationCode] = {
            chiName: stationChiName.trim(),
            engName: stationEngName.trim(),
          };
        }

        // Check if line code already exists in result
        let lineEntry = result.find((entry) => entry[lineCode]);
        // If not, create a new entry
        if (!lineEntry) {
          lineEntry = {};
          lineEntry[lineCode] = {};
          result.push(lineEntry);
        }
        console.log("lineEntry: ", lineEntry);

        // Merge station data into the corresponding line entry
        Object.assign(lineEntry[lineCode], stationData);
      }
    }

    console.log("Final Result: ", result[0]);

    // Write result to JSON file
    fs.writeFile(jsonFilePath, JSON.stringify(result, null, 4), (err) => {
      if (err) {
        console.error("Error writing JSON file:", err);
      } else {
        console.log("JSON file has been saved successfully!");
      }
    });
  });
}

// Define paths for input CSV and output JSON files
const csvFilePath = path.join(__dirname, "mtr_lines_and_stations.csv");
const jsonFilePath = path.join(__dirname, "station_data.json");

// Call the conversion function
csvToJson(csvFilePath, jsonFilePath);
