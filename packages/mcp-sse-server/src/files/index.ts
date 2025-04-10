import fs from "fs";
export const getFiles = async (folderPath: string) => {
  try {
    const files = await fs.readdirSync(folderPath);
    return files;
  } catch (error) {
    console.error("获取文件列表失败:", error);
    return [];
  }
};
