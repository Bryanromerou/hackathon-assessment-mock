export interface Question {
  id: string;
  category: "verbal" | "math" | "abstract" | "spatial";
  text: string;
  options: string[];
}
