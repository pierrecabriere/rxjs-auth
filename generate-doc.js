"use strict";

const fs = require("fs");
const path = require("path");
const jsdoc2md = require("jsdoc-to-markdown");

const inputFile = "./dist-docs/**/*.js";
const outputDir = "./docs";
const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile });
const classNames = [...new Set(templateData.filter((identifier) => identifier.kind === "class").map((identifier) => identifier.name))];

function decodeLinks(md) {
  for (const _className of classNames) {
    let regex, regexString;

    regexString = `\\(\\#(${_className}(\\+[a-zA-Z]+?)?)\\)`;
    regex = new RegExp(regexString, "g");
    md = md.replace(regex, `(${_className}.md#$1)`);

    regexString = `\"\\#(${_className}(\\+[a-zA-Z]+?)?)\"`;
    regex = new RegExp(regexString, "g");
    md = md.replace(regex, `"${_className}.md#$1"`);
  }

  return md;
}

function renderMain() {
  const template = `{{>module-index~}}{{>global-index~}}`;
  // console.log(`rendering ${className}, template: ${template}`);
  let output = jsdoc2md.renderSync({ data: templateData, template, separators: true });
  // console.log(output);
  output = decodeLinks(output);
  fs.writeFileSync(path.resolve(outputDir, `README.md`), output);
}

function renderClasses() {
  for (const className of classNames) {
    const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`;
    // console.log(`rendering ${className}, template: ${template}`);
    let output = jsdoc2md.renderSync({ data: templateData, template, separators: true });
    output = decodeLinks(output);
    fs.writeFileSync(path.resolve(outputDir, `${className}.md`), output);
  }
}

renderMain();
renderClasses();
