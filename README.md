# Malaysia Public Holidays API

[![Generate API Data](https://github.com/DyDxdYdX/sabah-public-holiday-fetcher/actions/workflows/generate.yml/badge.svg)](https://github.com/DyDxdYdX/sabah-public-holiday-fetcher/actions/workflows/generate.yml)

Visit Site: [Sabah Holiday API](https://sabah-holiday.dydxsoft.my/)

A simple API that provides public holiday data for Malaysia (Sabah) in JSON format.

## API Endpoints

### Get Available Years
```
GET /api/years.json
```
Returns an array of years for which holiday data is available.

### Get Holidays for a Specific Year
```
GET /api/{year}.json
```
Returns an array of holidays for the specified year.

### Get API Metadata
```
GET /api/metadata.json
```
Returns metadata about the API, including:
- `last_updated`: Timestamp when the data was last updated
- `available_years`: List of years for which data is available
- `failed_years`: List of years for which data scraping failed
- `total_years_available`: Total number of years available
- `year_range`: Range of years available (e.g., "2023-2026")

## Setup and Deployment

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

### Generate API Data
Run the following command to scrape holiday data and generate JSON files:
```
npm run generate
```
This will:
- Create an `api` directory
- Generate JSON files for each year (automatically calculated based on the current year)
- Create a `years.json` file listing all available years
- Create a `metadata.json` file with API information

The data is automatically updated monthly via GitHub Actions, but you can also trigger the workflow manually from the Actions tab in your GitHub repository.

### Deploy to GitHub Pages
1. Push the repository to GitHub
2. Go to Settings > Pages
3. Select the main branch as the source
4. Your API will be available at `https://[your-username].github.io/[repository-name]/api/` or your own custom domain.

## Customization

By default, the API generates data for a range of years from 2 years in the past to 5 years in the future. This is automatically calculated based on the current year.

If you want to customize this behavior, you can modify the following variables in `generate_api.js`:

```javascript
const currentYear = new Date().getFullYear();
const startYear = currentYear - 2; // 2 years in the past
const endYear = currentYear + 5;   // 5 years in the future
```

The script also includes retry logic with exponential backoff to handle temporary failures when scraping data.

## Usage Examples

### JavaScript (Fetch API)
```javascript
// Get holidays for 2025
fetch('https://sabah-holiday.dydxsoft.my/api/2025.json')
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch(error => console.error('Error:', error));
```

### PHP
```php
<?php
// Get holidays for 2025
$response = file_get_contents('https://sabah-holiday.dydxsoft.my/api/2025.json');
$holidays = json_decode($response, true);
print_r($holidays);
?>
```

## Data Source
Holiday data is scraped from [Office Holidays](https://www.officeholidays.com/countries/malaysia/sabah).

## License
MIT
