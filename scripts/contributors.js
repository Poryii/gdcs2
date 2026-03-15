const fs = require("fs");
const yaml = require("js-yaml");

const CONTRIBUTORS_FILE = "data/contributors.yaml";
// const CONTRIBUTORS_FILE_SAVE = "data/contributors_test.yaml";
const CONTRIBUTORS_FILE_SAVE = "data/contributors.yaml";

/**
 * @typedef {object} Frontmatter
 * @property {string} title
 * @property {Array<string>} contributors
 * @property {Array<string>} authors
 */

/**
 * @typedef {object} ContributorLUTEntry
 * @property {string} safeUsername Sanitized username.
 * @property {"username" | "safeUsername" | "preferredName"} type Source of the identifier used.
 */

/**
 * @typedef {Object<string, ContributorLUTEntry>} ContributorLUT
 */

/**
 * @typedef {object} Contributor
 * @property {string} ID
 * @property {string} username
 * @property {string} [preferredName]
 * @property {boolean} usePreferred
 * @property {string} safeUsername
 */

// -------------------------------------------- PREPARE CONTRIBUTOR LOOKUP TABLE --------------------------------------------

/**
 * Sanitizes a username so it can safely be used in URLs or folder names.
 * @param {string} username Contributor's username.
 * @returns {string} Sanitized username safe for URLs and folders.
 */
function sanitize(username) {
  return username
    .replace(/^[._\-]+|[._\-]+$/g, "")  // remove initial and final non alphanumeric symbols
    .replace(/[^A-Za-z0-9_.-]+/g, "-"); // replaces non-url safe characters with hyphens
}

/**
 * Computes the `safeUsername` property for each contributor, derived from the contributor's `username`.
 * @param {Array<Contributor>} contributors - List of contributor objects.
 */
function computeSafeUsernames(contributors) {
  for (const contributor of contributors) {
    const safeUsername = sanitize(contributor.username);
    contributor.safeUsername = safeUsername;
  };
}

/**
 * Saves the contributor list to a YAML file.
 * @param {Array<Contributor>} contributors - Contributor objects to save.
 */
function saveContributors(contributors) {
  let output = yaml.dump(contributors).replace(/\n-/g, "\n\n-");
  fs.writeFileSync(CONTRIBUTORS_FILE_SAVE, output);
}

/**
 * Builds a lookup table that maps possible contributor identifiers
 * (username, safeUsername, preferredName) to a canonical safe username.
 * @param {Array<Contributor>} contributors - List of contributor objects.
 * @returns {ContributorLUT} Contributor lookup table.
 */
function buildContributorLUT(contributors) {
  const contributorLUT = {};

  for (const contributor of contributors) {
    const safeUsername = contributor.safeUsername;

    contributorLUT[contributor.username] = {
      safeUsername: safeUsername,
      type: "username",
    };
    contributorLUT[contributor.safeUsername] = {
      safeUsername: safeUsername,
      type: "safeUsername",
    };
    if (contributor.preferredName) {
      contributorLUT[contributor.preferredName] = {
        safeUsername,
        type: "preferredName",
      };
    };
  };

  return contributorLUT;
}

// -------------------------------------------- REWRITE FRONTMATTER --------------------------------------------

/**
 * Validates and normalizes a list of contributor usernames extracted from the frontmatter.
 * @param {Array<string>} list - List of usernames from frontmatter.
 * @param {ContributorLUT} contributorLUT - Contributor lookup table.
 * @param {Set<string>} changesReport - Set used to record username changes.
 * @param {string} guide - Title of the guide currently being processed.
 * @returns {Array<string>} Normalized list of safe usernames.
 */
function rewriteUserList(list, contributorLUT, changesReport, guide) {
  return list.map(username => {
    const contributor = contributorLUT[username];

    if (!contributor) {
      unknownContributorError(username, guide)
    };

    if (contributor.safeUsername === username) {
      return username;
    };

    const reason = (contributor.type === "preferredName") ?
      "Preferred name was used instead of username." :
      "URL and folder safety.";

    changesReport.add(`${username} -> ${contributor.safeUsername} (${reason})`);
    return contributor.safeUsername;
  });
}

/**
 * Creates a frontmatter rewriting function using a contributor lookup table.
 * @param {ContributorLUT} contributorLUT - Contributor lookup table.
 * @returns {(frontmatter: Frontmatter) => Frontmatter} Function that rewrites contributor fields in the frontmatter.
 */
function contributorRewriter(contributorLUT) {
  /**
   * Rewrites contributor-related fields inside a frontmatter object.
   * @param {Frontmatter} frontmatter - Frontmatter object parsed from a guide.
   * @returns {Frontmatter} Mutated frontmatter
   */
  return function rewriteContributors(frontmatter) {
    const changesReport = new Set();
    const guide = frontmatter.title;

    for (const field of ["contributors", "authors"]) {
      if (frontmatter[field]) {
        frontmatter[field] = rewriteUserList(frontmatter[field], contributorLUT, changesReport, guide);
      };
    };

    reportNameChanges(changesReport);
    return frontmatter;
  }
}

// -------------------------------------------- MESSAGE HANDLING --------------------------------------------

const red = "\x1b[31m";
const yellow = "\x1b[33m";
const reset = "\x1b[0m";

/**
 * Prints an error message when an unknown contributor is found and terminates the process.
 * @param {string} username - Unknown username.
 * @param {string} guide - Title of the guide where the error occurred.
 */
function unknownContributorError(username, guide) {
  const errorMessage = (
    red +
    "Error: Unknown contributor\n" +
    `Guide: ${guide}\n` +
    `Unknown username found in frontmatter: ${username}\n\n` + reset +
    "This username was not found in data/contributors.yaml. Please do one of the following:\n" +
    `1. If the contributor is someone who has contributed before, ${yellow}write the username in the frontmatter correctly${reset}\n` +
    `2. Otherwise, ${yellow}add the contributor to data/contributors.yaml${reset}` +
    reset + "\n"
  );
  console.error(errorMessage);
  process.exit(1);
}

/**
 * Prints a warning listing all username changes applied during normalization.
 * @param {Set<string>} changesReport - Set containing username change descriptions.
 */
function reportNameChanges(changesReport) {
  if (changesReport.size > 0) {
    console.warn(`${yellow}Warning${reset}: the following username will be changed:`);
    for (const change of changesReport) {
      console.log(`${yellow}${change}${reset}`);
    };
  };
}

// -------------------------------------------- INITIALIZATION --------------------------------------------

/**
 * Initializes the contributor lookup table.
 *
 * Steps:
 * 1. Loads contributors from YAML
 * 2. Computes safe usernames
 * 3. Saves the processed contributor list
 * 4. Builds the contributor lookup table
 * @returns {ContributorLUT} Contributor lookup table.
 */
function initContributorLUT() {
  const contributors = yaml.load(fs.readFileSync(CONTRIBUTORS_FILE, "utf8"));

  computeSafeUsernames(contributors);
  saveContributors(contributors);

  return buildContributorLUT(contributors);
}

const contributorLUT = initContributorLUT();

module.exports = contributorRewriter(contributorLUT);
