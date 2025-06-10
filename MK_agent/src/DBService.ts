// File: src/DBService.ts
import fs from "fs";

const DB_FILE = "db.json";
const WRONG_ANSWERS_FILE = "wrong_answers.json";

export class DBService {
  static load(): Record<string, string> {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, "{}");
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  }

  static save(data: Record<string, string>): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }

  static update(key: string, value: string): void {
    const data = DBService.load();
    data[key] = value;
    DBService.save(data);
  }

  static get(key: string): string | undefined {
    const data = DBService.load();
    return data[key];
  }

  static loadWrongAnswers(): Record<string, string[]> {
    if (!fs.existsSync(WRONG_ANSWERS_FILE)) {
      fs.writeFileSync(WRONG_ANSWERS_FILE, "{}");
    }
    const data = fs.readFileSync(WRONG_ANSWERS_FILE, "utf8");
    return JSON.parse(data);
  }

  static saveWrongAnswers(data: Record<string, string[]>): void {
    fs.writeFileSync(WRONG_ANSWERS_FILE, JSON.stringify(data, null, 2));
  }

  static addWrongAnswer(key: string, value: string): void {
    const wrongAnswers = DBService.loadWrongAnswers();
    if (!wrongAnswers[key]) {
      wrongAnswers[key] = [];
    }
    if (!wrongAnswers[key].includes(value)) {
      wrongAnswers[key].push(value);
    }
    DBService.saveWrongAnswers(wrongAnswers);
  }

  static getWrongAnswers(key: string): string[] {
    const wrongAnswers = DBService.loadWrongAnswers();
    return wrongAnswers[key] || [];
  }
}
