# Malaysia Public Holidays API

[![Generate API Data](https://github.com/DyDxdYdX/sabah-public-holiday-fetcher/actions/workflows/generate.yml/badge.svg)](https://github.com/DyDxdYdX/sabah-public-holiday-fetcher/actions/workflows/generate.yml)

Visit Site: [Sabah Holiday API](https://sabah-holiday.dydxsoft.my/)

A simple API that provides public holiday data for Malaysia states in JSON format. (Used to be Sabah support only, decide to add multiple state support)

## API Endpoints

### Get Available States

```
GET /api/states.json
```

Returns an array of supported states and their endpoint codes.

### Get Available Years

```
GET /api/years.json
```

Returns Sabah years for backward compatibility.

### Get Holidays for a Specific State and Year

```
GET /api/{state}/{year}.json
```

Returns an array of holidays for the specified state and year.

Backward-compatible Sabah endpoint:

```
GET /api/{year}.json
```

### Get API Metadata

```
GET /api/metadata.json
```

Returns metadata about the API, including:

- `last_updated`: Timestamp when the data was last updated
- `state_count`: Number of states supported
- `states`: List of supported states
- `states_metadata`: Per-state available years, failures, and year range

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
- Generate JSON files for each state/year at `api/{state}/{year}.json`
- Create a `states.json` file listing all supported states
- Create a `years.json` compatibility file for Sabah
- Create a `metadata.json` file with state-aware API information

The data is automatically updated monthly via GitHub Actions, but you can also trigger the workflow manually from the Actions tab in your GitHub repository.

### Deploy to GitHub Pages

1. Push the repository to GitHub
2. Go to Settings > Pages
3. Select the main branch as the source
4. Your API will be available at `https://[your-username].github.io/[repository-name]/api/` or your own custom domain.

## Customization

By default, the API generates data for a range of years from 2 years in the past to 2 years in the future for every supported state.

If you want to customize this behavior, you can modify the following variables in `generate_api.js`:

```javascript
const currentYear = new Date().getFullYear();
const startYear = currentYear - 2; // 2 years in the past
const endYear = currentYear + 2; // 2 years in the future
```

The script also includes retry logic with exponential backoff to handle temporary failures when scraping data.

## Usage Examples

### JavaScript (Fetch API)

```javascript
// Get Sabah holidays for 2026
fetch("https://sabah-holiday.dydxsoft.my/api/sabah/2026.json")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
  })
  .catch((error) => console.error("Error:", error));
```

### PHP

```php
<?php
// Get Sarawak holidays for 2026
$response = file_get_contents('https://sabah-holiday.dydxsoft.my/api/sarawak/2026.json');
$holidays = json_decode($response, true);
print_r($holidays);
?>
```

## Data Source

Holiday data is scraped from [Office Holidays](https://www.officeholidays.com/countries/malaysia).

## License

MIT
