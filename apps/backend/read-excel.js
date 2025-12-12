const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('D:\\mentor v1.1\\Meetings_Export_2025-12-12_07-37.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

let output = '';
output += '=== HEADERS ===\n';
output += JSON.stringify(data[0], null, 2) + '\n\n';
output += '=== DATA SUMMARY ===\n';
output += 'Total rows: ' + data.length + '\n\n';

output += '=== ALL DATA ===\n';
for (let i = 0; i < data.length; i++) {
    output += 'Row ' + i + ': ' + JSON.stringify(data[i]) + '\n';
}

fs.writeFileSync('data-output.txt', output);
console.log('Data written to data-output.txt');
