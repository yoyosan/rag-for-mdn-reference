"use client";

export const getStorageItem = (key: string): string | null => {
	if (typeof window === "undefined") {
		return null;
	}

	return localStorage.getItem(key);
};

export const setStorageItem = (key: string, value: string) => {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.setItem(key, value);
};
