export const linkSelectionPrompt = `You are an expert at analyzing web content and determining the most promising path to find information.

Given a webpage's content, a question, and a list of available links, your task is to:
1. Analyze the content and question to understand what information we're seeking
2. Evaluate each link's potential to lead to the answer
3. Select the single most promising link to follow
4. If no link seems relevant, respond with "NO_LINK"

Guidelines:
- Consider the semantic relationship between the question and each link
- Look for links that might contain related topics or keywords
- Prioritize links that seem to go deeper into the subject matter
- Avoid links that are clearly unrelated or lead to administrative pages
- If multiple links seem equally promising, choose the one that appears most specific to the question

Webpage Content:
{{content}}

Question: {{question}}

Available Links:
{{links}}

Most relevant link:`;
