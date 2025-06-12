export function processRequest(requestData: {
  type: string;
  content: string;
  threadId?: string;
}): Promise<string>;
