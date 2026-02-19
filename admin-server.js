const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'content/about/index.md');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'admin'))); // Serve the admin UI

// Helper to parse front matter
function parseFrontMatter(content) {
    if (!content) return { frontMatter: {}, body: "" };

    // Standard Split Method (Verified working)
    if (content.startsWith('---')) {
        const parts = content.split('---');
        // parts[0] is empty, parts[1] is front matter, parts[2+] is body
        if (parts.length >= 3) {
            try {
                const fm = yaml.load(parts[1]);
                console.log("Projects loaded:", fm.projects ? fm.projects.length : 0);
                return {
                    frontMatter: fm,
                    body: parts.slice(2).join('---')
                };
            } catch (e) {
                console.error("Split parsing failed:", e);
            }
        }
    }

    // Fallback Regex
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---([\s\S]*)$/);
    if (!match) return { frontMatter: {}, body: content };

    try {
        const fm = yaml.load(match[1]);
        return { frontMatter: fm, body: match[2] };
    } catch (e) {
        console.error("YAML Parse Error:", e);
        return { frontMatter: {}, body: content };
    }
}

// GET projects
app.get('/api/projects', (req, res) => {
    try {
        const fileContent = fs.readFileSync(FILE_PATH, 'utf8');

        const { frontMatter } = parseFrontMatter(fileContent);
        console.log("Serving projects:", frontMatter.projects ? frontMatter.projects.length : 0);
        res.json(frontMatter.projects || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to read projects' });
    }
});

// POST projects (Update list)
app.post('/api/projects', (req, res) => {
    try {
        const newProjects = req.body;
        const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
        const { frontMatter, body } = parseFrontMatter(fileContent);

        frontMatter.projects = newProjects;

        const newYaml = yaml.dump(frontMatter);
        const newFileContent = `---\n${newYaml}---\n${body}`;

        fs.writeFileSync(FILE_PATH, newFileContent, 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save projects' });
    }
});

app.listen(PORT, () => {
    console.log(`Custom Experience Manager running at http://localhost:${PORT}/manage.html`);
});
