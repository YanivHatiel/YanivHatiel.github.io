const fs = require('fs');
const path = require('path');

// Configuration
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
const searchExtensions = ['.md', '.html', '.css', '.js', '.json', '.yml', '.yaml', '.toml'];
const excludeDirs = ['node_modules', '.git', 'public', 'resources', '.gemini', 'brain']; // Added brain/gemini to exclude artifacts
const scanDirs = ['.']; // Start from root

// Helper to get all files recursively
function getAllFiles(dir, extensions = [], exclusions = []) {
    let results = [];
    let list;
    try {
        list = fs.readdirSync(dir);
    } catch (e) {
        return results; // Skip if error reading dir
    }

    list.forEach(file => {
        const filePath = path.join(dir, file);
        // Safety check for excluded directories
        if (exclusions.some(ex => filePath.includes(ex))) return;

        // Skip hidden files/dirs (starting with .) except current dir
        if (file.startsWith('.') && file !== '.') return;

        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch (e) {
            return; // Skip if error stating file
        }

        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath, extensions, exclusions));
        } else {
            // If extensions array is empty, include all files. Otherwise filter.
            if (extensions.length === 0 || extensions.includes(path.extname(file).toLowerCase())) {
                results.push(filePath);
            }
        }
    });
    return results;
}

// 1. Gather all image files
console.log('Scanning for images...');
const allImages = getAllFiles('.', imageExtensions, excludeDirs);
console.log(`Found ${allImages.length} images.`);

// 2. Gather all content/code files to search within
console.log('Scanning for content files...');
const contentFiles = getAllFiles('.', searchExtensions, excludeDirs);
console.log(`Found ${contentFiles.length} files to search in.`);

// 3. Check for usage
const unusedImages = [];
const usedImages = new Set();

allImages.forEach((imagePath, index) => {
    const imageName = path.basename(imagePath);
    const imageNameNoExt = path.parse(imageName).name; // Check for basename usage too (e.g. Hugo bundles sometimes refer to image by name without extension in frontmatter, though rare, safer to check)
    let isUsed = false;

    // Read all content files and check if the image name exists
    // Optimization: We could read content files once and cache them, but for 273 images x N files it might be okay.
    // Better optimization: Concatenate all content into one giant string? No, memory issue.
    // Let's iterate content files.

    for (const contentFile of contentFiles) {
        const content = fs.readFileSync(contentFile, 'utf8');
        if (content.includes(imageName)) {
            isUsed = true;
            break;
        }
        // Strict check for relative paths? content.includes(imagePath) might miss "images/foo.jpg" if path is "static/images/foo.jpg"
    }

    if (isUsed) {
        usedImages.add(imagePath);
    } else {
        unusedImages.push(imagePath);
    }

    if (index % 50 === 0) process.stdout.write('.');
});

console.log('\nAnalysis Complete.');
console.log(`Used: ${usedImages.size}`);
console.log(`Unused: ${unusedImages.length}`);

// Output results to a file
fs.writeFileSync('unused_images_report.txt', unusedImages.join('\n'));
console.log('Unused images list saved to unused_images_report.txt');
