const fs = require('fs');
const path = require('path');

const reportFile = 'unused_images_report.txt';
const archiveDir = '_archive/unused_images';

if (!fs.existsSync(reportFile)) {
    console.error('Report file not found!');
    process.exit(1);
}

const lines = fs.readFileSync(reportFile, 'utf8').split('\n').filter(line => line.trim() !== '');

lines.forEach(line => {
    // Windows paths might have backslashes, normalize them
    const filePath = line.trim();

    // Safety check: Don't move files from docs/ (generated) or themes/
    if (filePath.startsWith('docs') || filePath.startsWith('themes')) {
        console.log(`Skipping generated/theme file: ${filePath}`);
        return;
    }

    if (fs.existsSync(filePath)) {
        const fileName = path.basename(filePath);
        const destPath = path.join(archiveDir, fileName);

        // Handle duplicates in archive
        let finalDestPath = destPath;
        let counter = 1;
        while (fs.existsSync(finalDestPath)) {
            const ext = path.extname(fileName);
            const name = path.basename(fileName, ext);
            finalDestPath = path.join(archiveDir, `${name}_${counter}${ext}`);
            counter++;
        }

        try {
            fs.renameSync(filePath, finalDestPath);
            console.log(`Moved: ${filePath} -> ${finalDestPath}`);
        } catch (e) {
            console.error(`Error moving ${filePath}:`, e);
        }
    } else {
        console.log(`File not found (already moved?): ${filePath}`);
    }
});
