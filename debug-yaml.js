const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'content/about/index.md');

console.log("Reading file from:", FILE_PATH);

try {
    let content = fs.readFileSync(FILE_PATH, 'utf8');
    console.log("File read successfully. Length:", content.length);

    console.log("\n--- HEX DUMP (First 50 chars) ---");
    let hex = "";
    for (let i = 0; i < Math.min(50, content.length); i++) {
        hex += content.charCodeAt(i).toString(16).padStart(2, '0') + " ";
    }
    console.log(hex);
    console.log("---------------------------------");

    console.log("\n--- ATTEMPT 1: Regex Match ---");
    // Flexible regex
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
    if (match) {
        console.log("Regex Matched!");
        console.log("Captured Group 1 Length:", match[1].length);
        try {
            const fm = yaml.load(match[1]);
            console.log("YAML Parsed Successfully.");
            console.log("Keys:", Object.keys(fm));
            console.log("Projects Count:", fm.projects ? fm.projects.length : "MISSING 'projects' KEY");
        } catch (e) {
            console.log("YAML Parse Error:", e.message);
        }
    } else {
        console.log("Regex FAILED to match.");
    }

    console.log("\n--- ATTEMPT 2: Split ---");
    if (content.startsWith('---')) {
        const parts = content.split('---');
        console.log("Split parts length:", parts.length);
        if (parts.length >= 3) {
            console.log("Part 1 (index 1) First 50 chars:", parts[1].substring(0, 50).replace(/\n/g, '\\n'));
            try {
                const fm = yaml.load(parts[1]);
                console.log("YAML Parsed Successfully (Split).");
                console.log("Projects Count:", fm.projects ? fm.projects.length : "MISSING 'projects' KEY");
            } catch (e) {
                console.log("YAML Parse Error (Split):", e.message);
            }
        } else {
            console.log("Split failed: Less than 3 parts found.");
        }
    } else {
        console.log("File does not start with ---");
    }

} catch (e) {
    console.error("Critical Error:", e);
}
