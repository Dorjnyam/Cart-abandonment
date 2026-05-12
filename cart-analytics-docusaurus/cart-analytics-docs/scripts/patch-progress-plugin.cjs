const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "node_modules", "schema-utils", "dist", "validate.js");

if (!fs.existsSync(target)) {
  process.exit(0);
}

const marker = "configuration && configuration.name === \"Progress Plugin\"";
let source = fs.readFileSync(target, "utf8");

if (!source.includes(marker)) {
  source = source.replace(
    "function validate(schema, options, configuration) {",
    "function validate(schema, options, configuration) { if (configuration && configuration.name === \"Progress Plugin\") return;",
  );
  fs.writeFileSync(target, source);
  console.log("Patched schema-utils Progress Plugin validation for Docusaurus build.");
}
