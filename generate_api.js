const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Create api directory if it doesn't exist
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir);
}

// Years to pre-generate (adjust as needed)
const currentYear = new Date().getFullYear();
const startYear = currentYear - 2; // 2 years in the past
const endYear = currentYear + 2;   // 2 years in the future

async function scrapeHolidays(year) {
  console.log(`Scraping holidays for ${year}...`);

  // Maximum number of retries
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const url = `https://www.officeholidays.com/countries/malaysia/sabah/${year}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const holidayTable = $('table.country-table');

      if (holidayTable.length === 0) {
        throw new Error(`Could not find holiday table for year ${year}`);
      }

      const holidays = [];

      holidayTable.find('tr').each((_, row) => {
        const cells = $(row).find('td');

        if (cells.length >= 3) {
          const date = $(cells[1]).text().trim();
          const holidayName = $(cells[2]).text().trim();

          if (date && holidayName) {
            holidays.push({
              date,
              holiday_name: holidayName
            });
          }
        }
      });

      if (holidays.length === 0) {
        throw new Error(`No holidays found for year ${year}`);
      }

      return holidays;
    } catch (error) {
      retries++;
      console.error(`Error scraping ${year} (attempt ${retries}/${maxRetries}):`, error.message);

      if (retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = 2000 * Math.pow(2, retries - 1);
        console.log(`Waiting ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`Failed to scrape ${year} after ${maxRetries} attempts`);
        return null;
      }
    }
  }

  return null;
}

async function generateApiFiles() {
  // Track successful years
  const successfulYears = [];
  const failedYears = [];

  // Generate individual year files
  for (let year = startYear; year <= endYear; year++) {
    try {
      const holidays = await scrapeHolidays(year);

      if (holidays && holidays.length > 0) {
        fs.writeFileSync(
          path.join(apiDir, `${year}.json`),
          JSON.stringify(holidays, null, 2)
        );
        console.log(`Generated api/${year}.json with ${holidays.length} holidays`);
        successfulYears.push(year);
      } else {
        console.log(`Failed to generate data for ${year}`);
        failedYears.push(year);
      }
    } catch (error) {
      console.error(`Error generating file for ${year}:`, error.message);
      failedYears.push(year);
    }
  }

  // Generate years.json (list of available years)
  try {
    // Sort years in ascending order
    successfulYears.sort((a, b) => a - b);

    fs.writeFileSync(
      path.join(apiDir, 'years.json'),
      JSON.stringify(successfulYears, null, 2)
    );
    console.log(`Generated api/years.json with ${successfulYears.length} years`);

    // Generate a summary file with metadata
    const metadata = {
      last_updated: new Date().toISOString(),
      available_years: successfulYears,
      failed_years: failedYears,
      total_years_available: successfulYears.length,
      year_range: `${Math.min(...successfulYears)}-${Math.max(...successfulYears)}`
    };

    fs.writeFileSync(
      path.join(apiDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    console.log(`Generated api/metadata.json with API information`);

    if (failedYears.length > 0) {
      console.warn(`Warning: Failed to generate data for years: ${failedYears.join(', ')}`);
    }
  } catch (error) {
    console.error('Error generating metadata files:', error.message);
    throw error; // Re-throw to indicate failure
  }
}

generateApiFiles().catch(console.error);