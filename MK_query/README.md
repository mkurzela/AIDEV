# Location Finder

This application helps find a person's current location by analyzing a note and querying various APIs to track their movements.

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

   - Starts with a note containing initial names and cities
   - Extracts names and initial cities from the note

2. **Iterative Search Process**:

   - For each name found, queries the People API to find cities where that person was located
   - For each city found, queries the Places API to find people in that city
   - Tracks:
     - `initialCities`: Cities from the original note (where the person was known to be)
     - `personLocations`: New cities where the person was found
     - `processedNames` and `processedCities`: To avoid duplicate processing

3. **Key Findings**:

   - When querying the target person in the People API, we get restricted data
   - When querying cities, we find the person in new locations

4. **The Path to Success**:

   ```
   Initial Note
   → Found names and cities
   → Queried People API for each name
   → Found new cities
   → Queried Places API for each city
   → Found the person in a new location
   → Verified with report endpoint
   → Success! (Status 200)
   ```

5. **Why the New Location was the Answer**:
   - It was a new city (not in the initial cities)
   - The person was found there when querying the Places API
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
2. Iteratively search for the person's location
3. Print potential locations found
4. Report each location to the report endpoint
5. Stop when it finds the correct location (status 200)

## Success Criteria

A location is considered correct when:

1. It's not one of the initial cities from the note
2. The person is found there when querying the Places API
3. The report endpoint returns a 200 status code
