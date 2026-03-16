const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

// Create api directory if it doesn't exist
const apiDir = path.join(__dirname, "api");
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir);
}

// Years to pre-generate (adjust as needed)
const currentYear = new Date().getFullYear();
const startYear = currentYear - 2; // 2 years in the past
const endYear = currentYear + 2; // 2 years in the future

const states = [
  { code: "johor", name: "Johor" },
  { code: "kedah", name: "Kedah" },
  { code: "kelantan", name: "Kelantan" },
  { code: "kuala-lumpur", name: "Kuala Lumpur" },
  { code: "labuan", name: "Labuan" },
  { code: "melaka", name: "Melaka" },
  { code: "negeri-sembilan", name: "Negeri Sembilan" },
  { code: "pahang", name: "Pahang" },
  { code: "penang", name: "Penang" },
  { code: "perak", name: "Perak" },
  { code: "perlis", name: "Perlis" },
  { code: "putrajaya", name: "Putrajaya" },
  { code: "sabah", name: "Sabah" },
  { code: "sarawak", name: "Sarawak" },
  { code: "selangor", name: "Selangor" },
  { code: "terengganu", name: "Terengganu" },
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isMandatoryGazetted(holidayName) {
  const name = holidayName.toLowerCase();
  return (
    name.includes("national day") ||
    name.includes("labour day") ||
    name.includes("workers") ||
    name.includes("malaysia day") ||
    name.includes("agong") ||
    name.includes("king's birthday") ||
    name.includes("federal territory day") ||
    name.includes("governor") ||
    name.includes("sultan") ||
    name.includes("raja") ||
    name.includes("yang di-pertuan besar")
  );
}

async function scrapeHolidays(state, year) {
  console.log(`Scraping holidays for ${state.name} (${year})...`);

  // Maximum number of retries
  const maxRetries = 1;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const url = `https://www.officeholidays.com/countries/malaysia/${state.code}/${year}`;
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const holidayTable = $("table.country-table");

      if (holidayTable.length === 0) {
        throw new Error(
          `Could not find holiday table for ${state.name} (${year})`,
        );
      }

      const holidays = [];

      holidayTable.find("tr").each((_, row) => {
        const cells = $(row).find("td");

        if (cells.length >= 4) {
          const type = $(cells[3]).text().trim().toLowerCase(); // 'national holiday', 'regional holiday', etc.
          const dayOfWeek = $(cells[0]).text().trim();
          const date = $(cells[1]).text().trim();
          const holidayName = $(cells[2]).text().trim();

          // Only include National Holiday and Regional Holiday
          if (
            (type === "national holiday" || type === "regional holiday") &&
            date &&
            holidayName
          ) {
            holidays.push({
              date,
              day_of_week: dayOfWeek,
              holiday_name: holidayName,
              is_mandatory: isMandatoryGazetted(holidayName),
            });
          }
        }
      });

      if (holidays.length === 0) {
        throw new Error(`No holidays found for ${state.name} (${year})`);
      }

      return holidays;
    } catch (error) {
      retries++;
      console.error(
        `Error scraping ${state.name} (${year}) (attempt ${retries}/${maxRetries}):`,
        error.message,
      );

      if (retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = 2000 * Math.pow(2, retries - 1);
        console.log(`Waiting ${waitTime}ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        console.error(
          `Failed to scrape ${state.name} (${year}) after ${maxRetries} attempts`,
        );
        return null;
      }
    }
  }

  return null;
}

async function generateApiFiles() {
  const statesMetadata = {};

  fs.writeFileSync(
    path.join(apiDir, "states.json"),
    JSON.stringify(states, null, 2),
  );
  console.log(`Generated api/states.json with ${states.length} states`);

  for (const state of states) {
    const stateDir = path.join(apiDir, state.code);
    ensureDir(stateDir);

    const successfulYears = [];
    const failedYears = [];

    for (let year = startYear; year <= endYear; year++) {
      try {
        const holidays = await scrapeHolidays(state, year);

        if (holidays && holidays.length > 0) {
          fs.writeFileSync(
            path.join(stateDir, `${year}.json`),
            JSON.stringify(holidays, null, 2),
          );
          console.log(
            `Generated api/${state.code}/${year}.json with ${holidays.length} holidays`,
          );
          successfulYears.push(year);

          // Backward compatibility for existing Sabah endpoint: /api/{year}.json
          if (state.code === "sabah") {
            fs.writeFileSync(
              path.join(apiDir, `${year}.json`),
              JSON.stringify(holidays, null, 2),
            );
            console.log(
              `Generated api/${year}.json (Sabah compatibility endpoint)`,
            );
          }
        } else {
          console.log(`Failed to generate data for ${state.name} (${year})`);
          failedYears.push(year);
        }
      } catch (error) {
        console.error(
          `Error generating file for ${state.name} (${year}):`,
          error.message,
        );
        failedYears.push(year);
      }
    }

    successfulYears.sort((a, b) => a - b);
    failedYears.sort((a, b) => a - b);

    statesMetadata[state.code] = {
      code: state.code,
      name: state.name,
      available_years: successfulYears,
      failed_years: failedYears,
      total_years_available: successfulYears.length,
      year_range:
        successfulYears.length > 0
          ? `${Math.min(...successfulYears)}-${Math.max(...successfulYears)}`
          : null,
    };
  }

  try {
    // Keep existing years endpoint as Sabah years for compatibility
    const sabahYears = statesMetadata.sabah
      ? statesMetadata.sabah.available_years
      : [];
    fs.writeFileSync(
      path.join(apiDir, "years.json"),
      JSON.stringify(sabahYears, null, 2),
    );
    console.log(`Generated api/years.json (Sabah compatibility years)`);

    const metadata = {
      last_updated: new Date().toISOString(),
      state_count: states.length,
      default_state: "sabah",
      states,
      states_metadata: statesMetadata,
    };

    fs.writeFileSync(
      path.join(apiDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
    );
    console.log("Generated api/metadata.json with state-aware API information");
  } catch (error) {
    console.error("Error generating API files:", error.message);
    throw error;
  }
}

generateApiFiles().catch(console.error);
