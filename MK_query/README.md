# Barbara Location Finder

This application helps find Barbara's current location by analyzing a note and querying various APIs to track her movements.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key_here
API_KEY=your_api_key_here
```

- `OPENAI_API_KEY`: Your OpenAI API key for text processing
- `API_KEY`: Your API key for accessing the location services

## Logic Flow

1. **Initial Data Collection**:

   - Starts with Barbara's note which contains initial names and cities
   - Extracts:
     - Names: "Barbara Zawadzka", "Aleksander Ragowski", "Andrzej Maj", "Rafal Bomba"
     - Initial cities: "Krakow", "Warsaw"

2. **Iterative Search Process**:

   - For each name found, queries the People API to find cities where that person was located
   - For each city found, queries the Places API to find people in that city
   - Tracks:
     - `initialCities`: Cities from the original note (where Barbara was known to be)
     - `barbaraLocations`: New cities where Barbara was found
     - `processedNames` and `processedCities`: To avoid duplicate processing

3. **Key Findings**:

   - When querying "Barbara" in the People API, we get restricted data
   - When querying cities, we find Barbara in:
     - KRAKOW (but this was an initial city, so we ignore it)
     - ELBLAG (this was a new location!)

4. **The Path to ELBLAG**:

   ```
   Initial Note
   → Found names and cities
   → Queried People API for each name
   → Found new cities
   → Queried Places API for each city
   → Found Barbara in ELBLAG
   → Verified with report endpoint
   → Success! (Status 200)
   ```

5. **Why ELBLAG was the Answer**:
   - It was a new city (not in the initial cities)
   - Barbara was found there when querying the Places API
   - The report endpoint confirmed it with a 200 status code and the flag "{{FLG:GOTCHA}}"

## API Endpoints

The application uses three main API endpoints:

- People API: `https://c3ntrala.ag3nts.org/people`
- Places API: `https://c3ntrala.ag3nts.org/places`
- Report API: `https://c3ntrala.ag3nts.org/report`

## Setup and Usage

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your API key:

   ```
   API_KEY=your_api_key_here
   ```

3. Run the application:
   ```bash
   npm start
   ```

## Output

The application will:

1. Process the initial note
2. Iteratively search for Barbara's location
3. Print potential locations found
4. Report each location to the report endpoint
5. Stop when it finds the correct location (status 200)

## Success Criteria

A location is considered correct when:

1. It's not one of the initial cities from the note
2. Barbara is found there when querying the Places API
3. The report endpoint returns a 200 status code
