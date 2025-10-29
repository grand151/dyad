/**
 * File System Adapter - Abstraction layer for file operations
 * Supports Electron native FS, File System Access API, and virtual FS
 */

import { isElectron, isFileSystemAccessSupported } from "../lib/platform";

export interface FileHandle {
  name: string;
  path: string;
}

export interface DirectoryHandle {
  name: string;
  path: string;
}

export interface FileSystemAdapter {
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;

  // Directory operations
  readDir(path: string): Promise<string[]>;
  createDir(path: string): Promise<void>;
  deleteDir(path: string): Promise<void>;

  // File picker operations
  openFilePicker(): Promise<FileHandle | null>;
  openDirectoryPicker(): Promise<DirectoryHandle | null>;
  saveFilePicker(defaultName?: string): Promise<FileHandle | null>;
}

/**
 * Electron File System Adapter (uses native Node.js fs)
 */
class ElectronFileSystemAdapter implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("fs:readFile", { path });
  }

  async writeFile(path: string, content: string): Promise<void> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("fs:writeFile", { path, content });
  }

  async deleteFile(path: string): Promise<void> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("fs:deleteFile", { path });
  }

  async exists(path: string): Promise<boolean> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("fs:exists", { path });
  }

  async readDir(path: string): Promise<string[]> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("fs:readDir", { path });
  }

  async createDir(path: string): Promise<void> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("fs:createDir", { path });
  }

  async deleteDir(path: string): Promise<void> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("fs:deleteDir", { path });
  }

  async openFilePicker(): Promise<FileHandle | null> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("dialog:openFile");
  }

  async openDirectoryPicker(): Promise<DirectoryHandle | null> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("dialog:openDirectory");
  }

  async saveFilePicker(defaultName?: string): Promise<FileHandle | null> {
    const electron = (window as any).electron;
    return electron.ipcRenderer.invoke("dialog:saveFile", { defaultName });
  }
}

/**
 * Web File System Access API Adapter
 */
class WebFileSystemAdapter implements FileSystemAdapter {
  private fileHandles: Map<string, FileSystemFileHandle> = new Map();
  private dirHandles: Map<string, FileSystemDirectoryHandle> = new Map();

  async readFile(path: string): Promise<string> {
    const handle = this.fileHandles.get(path);
    if (!handle) {
      throw new Error(`File not found: ${path}`);
    }

    const file = await handle.getFile();
    return file.text();
  }

  async writeFile(path: string, content: string): Promise<void> {
    const handle = this.fileHandles.get(path);
    if (!handle) {
      throw new Error(`File not found: ${path}`);
    }

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async deleteFile(path: string): Promise<void> {
    // File System Access API doesn't support delete directly
    // Need to remove from parent directory
    throw new Error("Delete not implemented in File System Access API");
  }

  async exists(path: string): Promise<boolean> {
    return this.fileHandles.has(path) || this.dirHandles.has(path);
  }

  async readDir(path: string): Promise<string[]> {
    const handle = this.dirHandles.get(path);
    if (!handle) {
      throw new Error(`Directory not found: ${path}`);
    }

    const entries: string[] = [];
    for await (const entry of handle.values()) {
      entries.push(entry.name);
    }
    return entries;
  }

  async createDir(path: string): Promise<void> {
    throw new Error("Create directory not implemented in File System Access API");
  }

  async deleteDir(path: string): Promise<void> {
    throw new Error("Delete directory not implemented in File System Access API");
  }

  async openFilePicker(): Promise<FileHandle | null> {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
      });

      const path = handle.name;
      this.fileHandles.set(path, handle);

      return {
        name: handle.name,
        path,
      };
    } catch (error) {
      // User cancelled
      return null;
    }
  }

  async openDirectoryPicker(): Promise<DirectoryHandle | null> {
    try {
      const handle = await (window as any).showDirectoryPicker();

      const path = handle.name;
      this.dirHandles.set(path, handle);

      return {
        name: handle.name,
        path,
      };
    } catch (error) {
      // User cancelled
      return null;
    }
  }

  async saveFilePicker(defaultName?: string): Promise<FileHandle | null> {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultName,
      });

      const path = handle.name;
      this.fileHandles.set(path, handle);

      return {
        name: handle.name,
        path,
      };
    } catch (error) {
      // User cancelled
      return null;
    }
  }
}

/**
 * Virtual File System Adapter (in-memory, fallback)
 */
class VirtualFileSystemAdapter implements FileSystemAdapter {
  private files: Map<string, string> = new Map();
  private dirs: Set<string> = new Set(["/"]); // Root always exists

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.dirs.has(path);
  }

  async readDir(path: string): Promise<string[]> {
    if (!this.dirs.has(path)) {
      throw new Error(`Directory not found: ${path}`);
    }

    const entries: string[] = [];
    const prefix = path.endsWith("/") ? path : `${path}/`;

    // Find direct children
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix)) {
        const relative = filePath.slice(prefix.length);
        if (!relative.includes("/")) {
          entries.push(relative);
        }
      }
    }

    for (const dirPath of this.dirs) {
      if (dirPath.startsWith(prefix) && dirPath !== path) {
        const relative = dirPath.slice(prefix.length);
        if (!relative.includes("/")) {
          entries.push(relative);
        }
      }
    }

    return entries;
  }

  async createDir(path: string): Promise<void> {
    this.dirs.add(path);
  }

  async deleteDir(path: string): Promise<void> {
    this.dirs.delete(path);

    // Delete all files in directory
    const prefix = path.endsWith("/") ? path : `${path}/`;
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix)) {
        this.files.delete(filePath);
      }
    }
  }

  async openFilePicker(): Promise<FileHandle | null> {
    // Create file input element
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const content = await file.text();
          const path = `/${file.name}`;
          this.files.set(path, content);
          resolve({
            name: file.name,
            path,
          });
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  async openDirectoryPicker(): Promise<DirectoryHandle | null> {
    // Not supported in fallback mode
    throw new Error("Directory picker not supported in virtual file system");
  }

  async saveFilePicker(defaultName?: string): Promise<FileHandle | null> {
    // Create download link
    const path = `/${defaultName || "file.txt"}`;
    return {
      name: defaultName || "file.txt",
      path,
    };
  }
}

/**
 * Get appropriate file system adapter based on platform
 */
export function getFileSystemAdapter(): FileSystemAdapter {
  if (isElectron()) {
    return new ElectronFileSystemAdapter();
  } else if (isFileSystemAccessSupported()) {
    return new WebFileSystemAdapter();
  } else {
    return new VirtualFileSystemAdapter();
  }
}

// Singleton instance
export const fileSystem = getFileSystemAdapter();
