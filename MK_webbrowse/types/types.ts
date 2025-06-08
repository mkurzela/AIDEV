export interface IWebPage {
  id: string;
  url: string;
  localPath: string;
  title: string;
  content: string;
  isRoot: boolean;
  isLeaf: boolean;
  parentId?: string;
  childrenIds: string[];
  links?: string[];
  relevanceScore: number;
  metadata: {
    lastVisited: string;
    depth: number;
    status: "pending" | "processed" | "error";
    error?: string;
  };
}

export interface IDatabaseService {
  insertPage(page: IWebPage): Promise<void>;
  getPage(id: string): Promise<IWebPage | null>;
  getPageByUrl(url: string): Promise<IWebPage | null>;
  updatePage(page: IWebPage): Promise<void>;
  getChildren(parentId: string): Promise<IWebPage[]>;
  getRootPages(): Promise<IWebPage[]>;
}
