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
const startYear = 2023;
const endYear = 2027;

async function scrapeHolidays(year) {
  console.log(`Scraping holidays for ${year}...`);
  
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
    
    holidayTable.find('tr').each((i, row) => {
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
    
    return holidays;
  } catch (error) {
    console.error(`Error scraping ${year}:`, error.message);
    return null;
  }
}

async function generateApiFiles() {
  // Generate individual year files
  for (let year = startYear; year <= endYear; year++) {
    const holidays = await scrapeHolidays(year);
    
    if (holidays && holidays.length > 0) {
      fs.writeFileSync(
        path.join(apiDir, `${year}.json`),
        JSON.stringify(holidays, null, 2)
      );
      console.log(`Generated api/${year}.json with ${holidays.length} holidays`);
    } else {
      console.log(`Failed to generate data for ${year}`);
    }
  }
  
  // Generate years.json (list of available years)
  const availableYears = [];
  for (let year = startYear; year <= endYear; year++) {
    const filePath = path.join(apiDir, `${year}.json`);
    if (fs.existsSync(filePath)) {
      availableYears.push(year);
    }
  }
  
  fs.writeFileSync(
    path.join(apiDir, 'years.json'),
    JSON.stringify(availableYears, null, 2)
  );
  console.log(`Generated api/years.json with ${availableYears.length} years`);
}

generateApiFiles().catch(console.error);