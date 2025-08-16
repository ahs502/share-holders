/* eslint-disable @typescript-eslint/no-explicit-any */

import { Dropbox, DropboxAuth } from "dropbox";
import { useEffect, useState } from "react";
import type { Data } from "./types";

const CLIENT_ID = "q92uu9htksk0v04";
const REDIRECT_URI = window.location.origin + window.location.pathname;
const FILE_PATH = "/data.json";

const LOCAL_STORAGE_KEY = "dropbox_access_token";

export function useDropbox() {
  const [dropbox, setDropbox] = useState<Dropbox | null>(null);

  useEffect(() => {
    let accessTokenFromUrl: string | null;
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      accessTokenFromUrl = params.get("access_token");
    } catch {
      accessTokenFromUrl = null;
    }

    if (accessTokenFromUrl) {
      localStorage.setItem(LOCAL_STORAGE_KEY, accessTokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname); // Clean the URL.
    }

    const accessToken = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (accessToken) {
      setDropbox(new Dropbox({ accessToken: accessToken }));
    }
  }, []);

  return {
    async signIn(): Promise<void> {
      const auth = new DropboxAuth({ clientId: CLIENT_ID });
      const authUrl = await auth.getAuthenticationUrl(
        REDIRECT_URI,
        undefined,
        "token",
        "legacy",
        undefined,
        undefined,
        true
      );

      window.location.href = authUrl as string;
    },

    signOut(): void {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setDropbox(null);
      window.location.reload();
    },

    isSignedIn(): boolean {
      return !!dropbox;
    },

    async loadData(): Promise<Data> {
      if (!dropbox) throw new Error("Sign-in first");
      try {
        const { result }: any = await dropbox.filesDownload({
          path: FILE_PATH,
        });
        const content = await new Response(result.fileBlob).text();
        return JSON.parse(content) as Data;
      } catch (error: any) {
        if (error.status === 409) {
          // File doesn't exist, return default value:
          return { totalInvestment: 0, currentValue: 0, shareHolders: [] };
        }
        throw error;
      }
    },

    async saveData(data: Data): Promise<void> {
      if (!dropbox) throw new Error("Sign-in first");
      await dropbox.filesUpload({
        path: FILE_PATH,
        contents: JSON.stringify(data, null, 2),
        mode: { ".tag": "overwrite" },
      });
    },
  };
}
