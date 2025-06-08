# MK Map Webhook

A webhook application that simulates drone movement on a 4x4 map using natural language instructions. The application processes movement instructions in both English and Polish, determining the drone's final position and returning the description of the field where it lands.

## Map Structure

The application uses a 4x4 map where each field contains a description in Polish:

```
[
  ["START", "trawa", "drzewo", "budynek"],
  ["trawa", "wiatrak", "trawa", "trawa"],
  ["trawa", "trawa", "skały", "dwa drzewa"],
  ["skały", "skały", "samochód", "jaskinia"]
]
```

- The drone always starts at position (0,0) marked as "START"
- Rows and columns are numbered 0-3
- Each field contains a description of the terrain/obstacle in Polish

## Movement Instructions

The application accepts natural language instructions in both English and Polish. Here are the key movement rules:

1. **Default Movement**: When no specific distance is mentioned, assume one step
2. **Maximum Movement**: Phrases like "all the way", "na maksa", "na sam", "ile tylko możemy" mean moving to the edge of the map (0 or 3)
3. **Specific Steps**: "o X pola" means exactly X steps
4. **Sequential Movements**: Movements are processed in the order they appear
5. **Corrections**: Corrections ("korekta") are applied after the main movement
6. **Hesitation**: If there's hesitation or thinking in the instruction, the last clear movement instruction is used

### Example Instructions

```
# Simple movements
"poleciałem jedno pole w prawo" -> {"row": 0, "col": 1}
"na maksa w prawo" -> {"row": 0, "col": 3}
"o dwa pola w prawo" -> {"row": 0, "col": 2}

# Complex movements
"na sam dół, a później o dwa pola w prawo" -> {"row": 3, "col": 2}
"na sam dół, ile tylko możemy w prawo, korekta o jedno pole do góry" -> {"row": 2, "col": 3}

# Instructions with hesitation
"Lecimy w dół, albo nie! nie! czekaaaaj. W prawo i dopiero teraz w dół" -> {"row": 1, "col": 1}
"Idziemy na sam dół mapy. Albo nie! nie! nie idziemy. W prawo maksymalnie" -> {"row": 0, "col": 3}
```

## API Endpoints

### Health Check

```
GET /api/health
Response: {"status": "ok", "message": "MK_map_webhook is running."}
```

### Flight Instruction

```
POST /api/flight
Content-Type: application/json

Request body:
{
    "instruction": "your movement instruction here"
}

Response:
{
    "description": "field description in Polish"
}
```

## Technology Stack

- Node.js with TypeScript
- Express.js for the web server
- OpenAI GPT-3.5 for natural language processing
- PM2 for process management in production

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the parent directory:

```
OPENAI_API_KEY=your_openai_api_key
PORT=<PORT>
```

3. Start the development server:

```bash
npm run dev
```

## Deployment

1. Build the project:

```bash
npm run build
```

2. Copy files to the server:

```bash
scp -P <ssh_port> -r dist package.json package-lock.json ../.env <external_server>:~/mk_map_webhook/
```

3. SSH into the server:

```bash
ssh -p <ssh_port> <external_server>
```

4. Install dependencies and start the application:

```bash
cd ~/mk_map_webhook
npm install --omit=dev
npm run prod
```

### PM2 Commands

- Start: `npm run prod`
- Stop: `npm run prod:stop`
- Restart: `npm run prod:restart`
- View logs: `pm2 logs mk_map_webhook`
- Check status: `pm2 status`

## Testing the Application

You can test the application using curl, Postman, or any HTTP client:

### Using curl

```bash
# Health check
curl http://localhost:<PORT>/api/health

# Send movement instruction
curl -X POST http://localhost:<PORT>/api/flight \
  -H "Content-Type: application/json" \
  -d '{"instruction": "poleciałem jedno pole w prawo i potem na sam dół"}'
```

### Using Postman

1. Create a new POST request
2. Set the URL to `https://<external_server>:<PORT>/api/flight`
3. Set Content-Type header to `application/json`
4. Set the request body to:

```json
{
  "instruction": "poleciałem jedno pole w prawo"
}
```

> **Important Note**: The server must be properly exposed to the internet with:
>
> - Valid SSL certificate for HTTPS
> - Proper DNS configuration
> - Correct port forwarding
> - Appropriate firewall rules
> - Reverse proxy configuration (e.g., Nginx) if needed

## Error Handling

The application returns "błąd serwera" (server error) in case of:

- Missing or invalid OpenAI API key
- Invalid movement instructions
- Position out of bounds
- Server errors

## Contributing

Feel free to submit issues and enhancement requests!
