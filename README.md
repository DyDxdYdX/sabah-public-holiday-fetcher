# Malaysia Public Holidays API

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

## Setup and Deployment

### Prerequisites
- Node.js (v14 or higher)
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
- Generate JSON files for each year (2023-2027 by default)
- Create a `years.json` file listing all available years

### Deploy to GitHub Pages
1. Push the repository to GitHub
2. Go to Settings > Pages
3. Select the main branch as the source
4. Your API will be available at `https://[your-username].github.io/[repository-name]/api/`

## Customization

To change the years for which data is generated, modify the `startYear` and `endYear` variables in `generate_api.js`.

## Usage Examples

### JavaScript (Fetch API)
```javascript
// Get holidays for 2025
fetch('https://dydxdydx.github.io/sabah-public-holiday-fetcher/api/2025.json')
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
$response = file_get_contents('https://dydxdydx.github.io/sabah-public-holiday-fetcher/api/2025.json');
$holidays = json_decode($response, true);
print_r($holidays);
?>
```

## Data Source
Holiday data is scraped from [Office Holidays](https://www.officeholidays.com/countries/malaysia/sabah).

## License
MIT
